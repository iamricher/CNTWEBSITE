-- ============================================================
--  Client portal migration — run once in the Supabase SQL editor
--  (Dashboard → SQL Editor → paste → Run). Idempotent & additive:
--  safe to re-run. Everything here is also captured in schema.sql.
-- ============================================================

-- 1. Columns ---------------------------------------------------
alter table public.applications
  add column if not exists client_status text default 'none',
  add column if not exists client_reason text,
  add column if not exists endorsed_at   timestamptz,
  add column if not exists decided_at    timestamptz;
alter table public.profiles        add column if not exists client_account   text;
alter table public.hiring_requests add column if not exists client_submitted boolean default false;

-- 2. Helper + RPCs ---------------------------------------------
create or replace function public.cnt_client_account()
returns text language sql stable security definer set search_path=public as $$
  select client_account from public.profiles where id=auth.uid()
$$;

-- The ONLY read path a client has into applications. Its WHERE clause is the
-- security boundary (own account only, endorsed/decided only). Returns the full
-- candidate profile + CV path so the client can review the actual applicant
-- before approving; excludes internal recruiter notes.
-- drop first: the return signature evolved, and CREATE OR REPLACE cannot
-- change a function's return type. Note the SQL editor shows a "destructive
-- operations" confirmation because of the drop/revoke — that is expected; confirm it.
drop function if exists public.cnt_client_candidates();
create or replace function public.cnt_client_candidates()
returns table (
  id bigint, name text, email text, phone text, linkedin text, referred_by text,
  role text, location text, source text, applied_date date,
  tags text, degree text, medium text, work_experience text, education text,
  languages text, certifications text, seminars text, awards text, char_references text,
  cover_note text, proposed_salary text, availability date, resume_url text,
  priority int, client_status text, endorsed_at timestamptz,
  decided_at timestamptz, client_reason text
) language sql stable security definer set search_path=public as $$
  select a.id, a.name, a.email, a.phone, a.linkedin, a.referred_by,
         a.role, a.location, a.source, a.applied_date,
         a.tags, a.degree, a.medium, a.work_experience, a.education,
         a.languages, a.certifications, a.seminars, a.awards, a.char_references,
         a.cover_note, a.proposed_salary, a.availability, a.resume_url,
         a.priority, a.client_status, a.endorsed_at, a.decided_at, a.client_reason
  from public.applications a
  where public.cnt_client_account() is not null
    and a.client = public.cnt_client_account()
    and a.client_status in ('endorsed','approved','rejected')
$$;
revoke all on function public.cnt_client_candidates() from public, anon;
grant execute on function public.cnt_client_candidates() to authenticated;

-- A client records their decision — the only write a client can make to
-- applications. Only from 'endorsed', only for their own account.
create or replace function public.cnt_client_decide(app_id bigint, decision text, reason text default null)
returns text language plpgsql security definer set search_path=public as $$
declare acct text; cur text;
begin
  acct := public.cnt_client_account();
  if acct is null then raise exception 'Not a client account'; end if;
  if decision not in ('approved','rejected') then raise exception 'Invalid decision'; end if;
  select client_status into cur from public.applications
    where id=app_id and client=acct for update;
  if cur is null then raise exception 'Candidate not found for your account'; end if;
  if cur <> 'endorsed' then raise exception 'Candidate is not awaiting your decision'; end if;
  update public.applications
    set client_status=decision, decided_at=now(),
        client_reason=case when decision='rejected' then reason else null end
    where id=app_id and client=acct;
  return decision;
end;
$$;
revoke all on function public.cnt_client_decide(bigint, text, text) from public, anon;
grant execute on function public.cnt_client_decide(bigint, text, text) to authenticated;

-- 3. RLS -------------------------------------------------------
drop policy if exists "profiles read self" on public.profiles;
create policy "profiles read self" on public.profiles for select to authenticated using (id = auth.uid());

alter table public.hiring_requests enable row level security;
drop policy if exists "hr staff all"     on public.hiring_requests;
create policy "hr staff all"     on public.hiring_requests for all    to authenticated
  using (public.cnt_is_staff()) with check (public.cnt_is_staff());
drop policy if exists "hr client read"   on public.hiring_requests;
create policy "hr client read"   on public.hiring_requests for select to authenticated
  using (account is not null and account = public.cnt_client_account());
drop policy if exists "hr client insert" on public.hiring_requests;
create policy "hr client insert" on public.hiring_requests for insert to authenticated
  with check (account = public.cnt_client_account() and status = 'Pending' and client_submitted = true);

-- Client may fetch a signed URL for exactly the CVs endorsed to their account.
drop policy if exists "resumes read client" on storage.objects;
create policy "resumes read client" on storage.objects for select to authenticated
  using (
    bucket_id='resumes'
    and exists (
      select 1 from public.applications a
      where a.resume_url = storage.objects.name
        and a.client = public.cnt_client_account()
        and a.client_status in ('endorsed','approved','rejected')
    )
  );

-- 4. Verify ----------------------------------------------------
--  Expect: both columns present, both functions present.
select
  (select count(*) from information_schema.columns where table_name='profiles' and column_name='client_account')        as has_client_account,
  (select count(*) from information_schema.columns where table_name='hiring_requests' and column_name='client_submitted') as has_client_submitted,
  (select count(*) from pg_proc where proname='cnt_client_candidates') as has_read_rpc,
  (select count(*) from pg_proc where proname='cnt_client_decide')     as has_decide_rpc;
