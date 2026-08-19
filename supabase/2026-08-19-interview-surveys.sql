-- ============================================================
--  CNT ATS — Interview surveys ("Send Interview", Odoo-style)
--
--  Staff build custom questionnaires/tests per job, send a unique link to an
--  applicant, and the applicant answers online. Auto-scored server-side; the
--  correct answers NEVER leave the database.
--
--  Security model
--   • Both tables are staff-only via RLS (cnt_is_staff) — anon has ZERO direct
--     access to surveys or invites.
--   • The public answer page reaches the data ONLY through two SECURITY DEFINER
--     RPCs keyed by the invite's unguessable UUID token:
--       cnt_survey_public(token)         → questions WITHOUT the answer key
--       cnt_survey_submit(token, answers)→ validates, scores, stores, notifies
--     So a token unlocks exactly one invite and never reveals correct answers
--     or any other applicant's response. No service-role key needed.
--
--  Run once in Supabase → SQL editor.
-- ============================================================

-- ── Tables ───────────────────────────────────────────────────────────────
create table if not exists public.interview_surveys (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  job_role    text,                          -- optional: suggested for matching roles
  questions   jsonb not null default '[]'::jsonb,
  pass_score  int,                            -- optional pass threshold (percent 0..100)
  active      boolean not null default true,
  created_by  text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- One row per interview sent to an applicant. The row id IS the link token.
-- questions + survey_title are SNAPSHOTTED at send time so later edits to the
-- survey never change what an already-sent invite asks or scores against.
create table if not exists public.interview_invites (
  id              uuid primary key default gen_random_uuid(),   -- the token
  survey_id       uuid references public.interview_surveys(id) on delete set null,
  survey_title    text,
  questions       jsonb not null default '[]'::jsonb,
  applicant_id    bigint references public.applications(id) on delete set null,
  applicant_name  text,
  applicant_email text,
  deadline        timestamptz,
  status          text not null default 'sent',   -- sent | submitted | expired
  answers         jsonb,
  score           numeric,
  max_score       numeric,
  pass            boolean,
  sent_by         text,
  sent_at         timestamptz default now(),
  submitted_at    timestamptz
);
create index if not exists interview_invites_app_idx  on public.interview_invites (applicant_id, sent_at desc);
create index if not exists interview_surveys_act_idx  on public.interview_surveys (active, created_at desc);

-- ── RLS: staff-only, no anon access ──────────────────────────────────────
alter table public.interview_surveys enable row level security;
alter table public.interview_invites enable row level security;

drop policy if exists "surveys read staff"  on public.interview_surveys;
drop policy if exists "surveys write staff" on public.interview_surveys;
create policy "surveys read staff"  on public.interview_surveys for select to authenticated using (public.cnt_is_staff());
create policy "surveys write staff" on public.interview_surveys for all    to authenticated using (public.cnt_is_staff()) with check (public.cnt_is_staff());

drop policy if exists "invites read staff"  on public.interview_invites;
drop policy if exists "invites write staff" on public.interview_invites;
create policy "invites read staff"  on public.interview_invites for select to authenticated using (public.cnt_is_staff());
create policy "invites write staff" on public.interview_invites for all    to authenticated using (public.cnt_is_staff()) with check (public.cnt_is_staff());

-- ── Public RPC: load an invite by token (answer key stripped) ────────────
create or replace function public.cnt_survey_public(p_token uuid)
returns json language plpgsql stable security definer set search_path=public as $$
declare
  v    public.interview_invites;
  item jsonb;
  pub  jsonb := '[]'::jsonb;
  eff  text;
begin
  select * into v from public.interview_invites where id = p_token;
  if not found then return json_build_object('error','not_found'); end if;

  -- effective status: an unsubmitted invite past its deadline reads as expired
  eff := case when v.status='sent' and v.deadline is not null and v.deadline < now()
              then 'expired' else v.status end;

  -- publish each question WITHOUT its correct answers or point weighting
  for item in select value from jsonb_array_elements(coalesce(v.questions,'[]'::jsonb)) loop
    pub := pub || jsonb_build_array(item - 'correct' - 'points');
  end loop;

  return json_build_object(
    'title',        coalesce(v.survey_title,'Interview'),
    'name',         v.applicant_name,
    'status',       eff,
    'deadline',     v.deadline,
    'submitted_at', v.submitted_at,
    'score',        v.score,
    'max_score',    v.max_score,
    'pass',         v.pass,
    'questions',    pub
  );
end; $$;
grant execute on function public.cnt_survey_public(uuid) to anon, authenticated;

-- ── Public RPC: submit answers, score server-side, store + notify ────────
--  Expected p_answers shape (keyed by each question's "id"):
--    { "q1": {"selected":[0]}, "q2": {"text":"..."},
--      "q3": {"selected":[1,2]}, "q4": {"scale":4} }
create or replace function public.cnt_survey_submit(p_token uuid, p_answers jsonb)
returns json language plpgsql security definer set search_path=public as $$
declare
  v        public.interview_invites;
  q        jsonb;
  qid      text;
  qtype    text;
  ans      jsonb;
  correct  jsonb;
  pts      numeric;
  sel      int[];
  cor      int[];
  total    numeric := 0;
  got      numeric := 0;
  thr      int;
  is_pass  boolean := null;
begin
  select * into v from public.interview_invites where id = p_token for update;
  if not found then return json_build_object('error','not_found'); end if;
  if v.status = 'submitted' then return json_build_object('error','already_submitted'); end if;
  if v.deadline is not null and v.deadline < now() then
    update public.interview_invites set status='expired' where id = p_token;
    return json_build_object('error','expired');
  end if;

  for q in select value from jsonb_array_elements(coalesce(v.questions,'[]'::jsonb)) loop
    qtype   := q->>'type';
    qid     := q->>'id';
    pts     := coalesce(nullif(q->>'points','')::numeric, 1);
    correct := q->'correct';

    -- only choice questions with a defined answer key are auto-scored
    if qtype in ('single','multi') and correct is not null and jsonb_typeof(correct)='array'
       and jsonb_array_length(correct) > 0 then
      total := total + pts;
      ans := p_answers -> qid;
      if ans is not null and jsonb_typeof(ans->'selected')='array' then
        sel := array(select jsonb_array_elements_text(ans->'selected'))::int[];
        cor := array(select jsonb_array_elements_text(correct))::int[];
        if qtype='single' then
          if array_length(sel,1)=1 and sel[1] = any(cor) then got := got + pts; end if;
        else  -- multi: reward an exact set match
          if (select coalesce(array_agg(x order by x),'{}') from unnest(sel) x)
           = (select coalesce(array_agg(x order by x),'{}') from unnest(cor) x)
          then got := got + pts; end if;
        end if;
      end if;
    end if;
  end loop;

  select pass_score into thr from public.interview_surveys where id = v.survey_id;
  if total > 0 and thr is not null then
    is_pass := (got / total * 100) >= thr;
  end if;

  update public.interview_invites
     set answers = p_answers, score = got, max_score = total, pass = is_pass,
         status = 'submitted', submitted_at = now()
   where id = p_token;

  -- let the recruiting team know it's in (best-effort; never blocks the submit)
  begin
    insert into public.notifications(recipient_kind, recipient_name, kind, title, body, ref_type, ref_id)
    values ('staff', v.sent_by, 'request', 'Interview form completed',
            coalesce(v.applicant_name,'A candidate')||' finished “'||coalesce(v.survey_title,'the interview')||'”'||
              case when total > 0 then ' — score '||got||'/'||total else '' end,
            'applicant', coalesce(v.applicant_id::text,''));
  exception when others then null;
  end;

  return json_build_object('ok', true, 'score', got, 'max_score', total, 'pass', is_pass);
end; $$;
grant execute on function public.cnt_survey_submit(uuid, jsonb) to anon, authenticated;
