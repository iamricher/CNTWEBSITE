-- ============================================================
--  CNT  —  Careers × ATS  shared database (Supabase / Postgres)
--  Single source of truth. Safe to run top-to-bottom on a fresh
--  project; every step is idempotent. Mirrors production.
--  Run:  Supabase dashboard → SQL Editor → paste → Run
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. TABLES
-- ────────────────────────────────────────────────────────────

-- Open positions shown on the public Careers page
create table if not exists public.jobs (
  id           bigint generated always as identity primary key,
  role         text not null,
  client       text not null,
  location     text not null,
  salary_range text,
  openings     int  default 1,
  priority     text default 'normal',          -- urgent | high | normal
  description  text,
  status       text default 'open',            -- open (published) | closed (unpublished)
  created_at   timestamptz default now()
);

-- Applications submitted from the Careers page → read by the ATS
create table if not exists public.applications (
  id           bigint generated always as identity primary key,
  job_id       bigint references public.jobs(id) on delete set null,
  name         text not null,
  email        text not null,
  phone        text,
  role         text,                           -- copied from the job (denormalised for the ATS)
  client       text,                           -- maps to an ATS client account
  location     text,
  experience   text,
  source       text default 'Website',
  cover_note   text,
  resume_url   text,                           -- object path inside the 'resumes' bucket
  stage        text default 'new',             -- new | interview | exam | bgcheck | hired | onboarding | pool | rejected
  status       text default 'active',
  applied_date date default current_date,
  created_at   timestamptz default now()
);
create index if not exists applications_created_idx on public.applications (created_at desc);

-- HR staff logins & roles (1 row per auth user, created by the trigger below)
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  full_name  text,
  role       text default 'recruiter',         -- super_admin | recruitment_manager | recruitment_supervisor | account_officer | recruiter | pending
  created_at timestamptz default now()
);

-- Configurable pipeline stages (Odoo: stages are data, not code).
-- `key` is the stable value stored in applications.stage — never rename it;
-- rename `name`/`short` instead.
create table if not exists public.stages (
  id            bigint generated always as identity primary key,
  key           text unique not null,
  name          text not null,
  short         text,
  color         text default '#64748b',
  sequence      int  default 0,
  folded        boolean default false,        -- collapsed in the kanban
  is_hired      boolean default false,        -- entering this stage means hired
  email_subject text,                         -- auto-draft when a card enters
  email_body    text,
  requirements  text,                         -- internal notes for the stage
  created_at    timestamptz default now()
);

-- Master data managed by super admin (feeds every dropdown / facet)
create table if not exists public.taxonomy (
  id         bigint generated always as identity primary key,
  kind       text not null check (kind in ('client','position','location')),
  name       text not null,
  color      text,                             -- client accent colour
  created_at timestamptz default now(),
  unique (kind, name)
);

-- Tamper-evident activity log (append-only via RLS below)
create table if not exists public.audit_log (
  id          bigint generated always as identity primary key,
  actor_email text,
  actor_role  text,
  action      text,
  entity      text,
  entity_ref  text,
  details     text,
  created_at  timestamptz default now()
);

-- ────────────────────────────────────────────────────────────
-- 2. ADDITIVE COLUMNS  (Odoo alignment — safe to re-run)
-- ────────────────────────────────────────────────────────────

-- Recruitment mechanics
--   priority      : 0=None 1=Good 2=Very Good 3=Excellent  (star evaluation)
--   refuse_reason : structured reason when a candidate is refused
--   kanban_state  : normal | ready | blocked                (card status dot)
--   activity      : append-only per-candidate timeline (jsonb)
alter table public.applications
  add column if not exists priority      int   default 0,
  add column if not exists refuse_reason text,
  add column if not exists kanban_state  text  default 'normal',
  add column if not exists activity      jsonb default '[]'::jsonb;

-- Odoo applicant-form fields + reporting/offer alignment
alter table public.applications
  add column if not exists recruiter        text,
  add column if not exists tags             text,
  add column if not exists degree           text,
  add column if not exists medium           text,
  add column if not exists referred_by      text,
  add column if not exists linkedin         text,
  add column if not exists proposed_salary  text,
  add column if not exists availability     date,
  add column if not exists offer_validity   date;

-- Interview stage consolidation: the single 'interview' stage carries kind + round
alter table public.applications
  add column if not exists interview_date  date,
  add column if not exists interview_time  text,
  add column if not exists interview_type  text,   -- Phone / Face-to-Face / Video / Panel / Client / Final
  add column if not exists interview_round text,   -- 1st / 2nd / 3rd / Final
  add column if not exists interview_link  text;   -- venue or online meeting URL

-- Odoo job-position fields
alter table public.jobs
  add column if not exists employment_type text default 'Full-Time',
  add column if not exists recruiter        text,
  -- Date the client expects the role filled. Carried over from the approved
  -- hiring request; drives the ageing / overdue flags on the Job Positions tab.
  add column if not exists deadline         date;

-- Résumé detail fields (populated by Digitize Résumé, editable by recruiters)
alter table public.applications
  add column if not exists work_experience text,
  add column if not exists education       text,
  add column if not exists languages       text,
  -- Résumé sections captured by Digitize. "references" is a reserved word in
  -- Postgres, hence char_references.
  add column if not exists certifications  text,
  add column if not exists seminars        text,
  add column if not exists awards          text,
  add column if not exists char_references text,
  -- How the applicant knows the person who referred them (careers form asks
  -- for this only when the source is Referral).
  add column if not exists referral_relation text;

-- Data Privacy Act of 2012 (RA 10173)
--   consent_at : when the applicant ticked the consent box on the careers form
--   purged_at  : when the record was anonymised (retention purge / erasure request)
alter table public.applications
  add column if not exists consent_at timestamptz,
  add column if not exists purged_at  timestamptz;

-- Client endorsement (recruiter endorses → client approves/rejects in the portal)
--   client_status : none | endorsed | approved | rejected
--   client_reason : reason the client gave when rejecting
alter table public.applications
  add column if not exists client_status text default 'none',
  add column if not exists client_reason text,
  add column if not exists endorsed_at   timestamptz,
  add column if not exists decided_at    timestamptz;

-- Single-shot guard for the auto-confirmation email (applicant-confirm fn)
alter table public.applications
  add column if not exists confirmation_sent_at timestamptz;

-- Deployment milestones (Contract → Orientation → Deployed → New Hire Report).
-- These live in prod but were previously undocumented here (schema drift) —
-- reconciled so a rebuild-from-schema keeps them.
alter table public.applications
  add column if not exists preemp_requirements_at timestamptz,
  add column if not exists contract_signed_at     timestamptz,
  add column if not exists oriented_at             timestamptz,
  add column if not exists deployed_at             timestamptz,
  add column if not exists newhire_reported_at     timestamptz;

-- On every new application, asynchronously call the applicant-confirm Edge
-- Function (via pg_net) to email the applicant a confirmation. Server-side, so
-- it works despite the staff-only SELECT RLS, and wrapped so it can never block
-- an insert. Deploy applicant-confirm with JWT verification off (see docs/email.md).
create extension if not exists pg_net;
create or replace function public.cnt_application_confirm()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  perform net.http_post(
    url     := 'https://mtaknpmvvldmnsizvtuy.supabase.co/functions/v1/applicant-confirm',
    headers := jsonb_build_object('Content-Type','application/json'),
    body    := jsonb_build_object('application_id', NEW.id)
  );
  return NEW;
exception when others then
  return NEW;
end; $$;
drop trigger if exists cnt_application_confirm_trg on public.applications;
create trigger cnt_application_confirm_trg after insert on public.applications
  for each row execute function public.cnt_application_confirm();

-- Which client a portal user represents (null for staff). Matches a taxonomy
-- client name and applications.client / hiring_requests.account.
alter table public.profiles
  add column if not exists client_account text;

-- Hiring requests (MRF). Staff-created, or client-submitted via the portal.
create table if not exists public.hiring_requests (
  id               bigint generated always as identity primary key,
  req_id           text,
  account          text,                          -- client this vacancy is for
  role             text,
  location         text,
  type             text,
  count            int  default 1,
  priority         text default 'Normal',
  status           text default 'Pending',        -- Pending | Open | Filled
  date             date default current_date,
  deadline         date,
  requestor        text,
  notes            text,
  assigned_to      uuid,
  assigned_name    text,
  client_submitted boolean default false,         -- filed by a client in the portal
  created_at       timestamptz default now()
);
alter table public.hiring_requests
  add column if not exists client_submitted boolean default false;

-- One application per person per job posting (duplicate / spam guard).
-- Enforced in the DB because anon cannot read the table to check for itself.
create unique index if not exists applications_one_per_job
  on public.applications (lower(email), job_id) where job_id is not null;

-- Indexes for scale
create index if not exists applications_stage_idx  on public.applications (stage);
create index if not exists applications_client_idx on public.applications (client);
create index if not exists applications_email_idx  on public.applications (lower(email));
create index if not exists jobs_status_idx         on public.jobs (status);

-- Fold any legacy interview stages into the consolidated 'interview' stage
update public.applications set stage='interview',
  interview_round=coalesce(interview_round,'1st Interview'),
  interview_type =coalesce(interview_type,'Phone Interview')       where stage='phone';
update public.applications set stage='interview',
  interview_round=coalesce(interview_round,'1st Interview'),
  interview_type =coalesce(interview_type,'Face-to-Face Interview') where stage='qualified';
update public.applications set stage='interview',
  interview_round=coalesce(interview_round,'2nd Interview'),
  interview_type =coalesce(interview_type,'Panel Interview')        where stage='scheduled';

-- ────────────────────────────────────────────────────────────
-- 3. AUTH / ROLE HELPERS
--    security definer → read profiles without tripping RLS recursion
-- ────────────────────────────────────────────────────────────
create or replace function public.cnt_is_staff()
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles where id=auth.uid()
    and role in ('super_admin','recruitment_manager','recruitment_supervisor','account_officer','recruiter'))
$$;

create or replace function public.cnt_is_manager()
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles where id=auth.uid()
    and role in ('super_admin','recruitment_manager','recruitment_supervisor'))
$$;

-- The client account of the caller (null for staff / anon). One place for the
-- scoping rule used by every client-facing policy and RPC. Note 'client' is
-- deliberately absent from cnt_is_staff()/cnt_is_manager(), so a client never
-- gains staff access through those.
create or replace function public.cnt_client_account()
returns text language sql stable security definer set search_path=public as $$
  select client_account from public.profiles where id=auth.uid()
$$;

-- Read of a client's endorsed candidates. RLS is row-level and cannot hide
-- columns, so clients never SELECT applications directly — this function is
-- the ONLY read path and its WHERE clause is the security boundary: caller's
-- own account only, endorsed/decided only. Per the client's decision it returns
-- the full candidate profile (name, contact, CV path) so the client can review
-- MONITORING-ONLY: returns an ANONYMISED view of every applicant tied to the
-- caller's account, plus where each one is in the pipeline. It deliberately
-- selects NO direct identifiers (name, email, phone, linkedin, referred_by,
-- resume_url, cover_note, proposed_salary) — the fixed column list here is the
-- guarantee that PII can never leak, even via raw network inspection. Clients
-- no longer endorse/approve/reject, so there is no status filter: they monitor
-- the whole pipeline for their vacancies.
-- drop first: the return signature changed, and Postgres won't let CREATE OR
-- REPLACE change a function's return type.
drop function if exists public.cnt_client_candidates();
create or replace function public.cnt_client_candidates()
returns table (
  id bigint, role text, location text, applied_date date,
  tags text, degree text, medium text, priority int,
  stage text, stage_label text, stage_seq int, is_hired boolean
) language sql stable security definer set search_path=public as $$
  select a.id, a.role, a.location, a.applied_date,
         a.tags, a.degree, a.medium, a.priority,
         a.stage,
         coalesce(s.name, initcap(replace(a.stage,'_',' ')), 'Applied') as stage_label,
         coalesce(s.sequence, 0) as stage_seq,
         coalesce(s.is_hired, false) as is_hired
  from public.applications a
  left join public.stages s on s.key = a.stage
  where public.cnt_client_account() is not null
    and a.client = public.cnt_client_account()
$$;
revoke all on function public.cnt_client_candidates() from public, anon;
grant execute on function public.cnt_client_candidates() to authenticated;

-- Pipeline stages for the portal's tracker (non-sensitive taxonomy). Lets a
-- client see the full ordered pipeline and where each candidate sits.
drop function if exists public.cnt_client_stages();
create or replace function public.cnt_client_stages()
returns table ( key text, name text, sequence int, is_hired boolean )
language sql stable security definer set search_path=public as $$
  select s.key, s.name, coalesce(s.sequence,0) as sequence, coalesce(s.is_hired,false) as is_hired
  from public.stages s
  where coalesce(s.folded,false) = false
  order by s.sequence
$$;
revoke all on function public.cnt_client_stages() from public, anon;
grant execute on function public.cnt_client_stages() to authenticated;

-- RA 10173 accountability: a client logs its own access events (privacy
-- acknowledgment, viewing a candidate's data). Only clients may log, and only
-- as themselves — the audit_log stays append-only.
create or replace function public.cnt_client_log(p_action text, p_ref text default null)
returns void language plpgsql security definer set search_path=public as $$
declare acct text;
begin
  acct := public.cnt_client_account();
  if acct is null then return; end if;
  insert into public.audit_log(actor_email, actor_role, action, entity, entity_ref, details)
  values ((select email from public.profiles where id=auth.uid()), 'client',
          left(coalesce(p_action,'client_event'),40), 'client_portal', left(p_ref,120), acct);
end;
$$;
revoke all on function public.cnt_client_log(text, text) from public, anon;
grant execute on function public.cnt_client_log(text, text) to authenticated;

-- (Client CV access removed: the monitoring portal is anonymised and never
--  exposes resume_url, so cnt_client_can_read_cv and the "resumes read client"
--  storage policy were dropped — see 2026-08-17-client-monitoring.sql.)

-- Public live stats for the homepage "Our Impact (Live)" band. Returns ONLY
-- aggregate counts (no rows, no PII), so it is safe to expose to anon. Scoped
-- to CURRENT activity so it complements — not contradicts — the lifetime figures.
create or replace function public.cnt_public_stats()
returns json language sql stable security definer set search_path=public as $$
  select json_build_object(
    'openings',         (select coalesce(sum(openings),0) from public.jobs where status = 'open'),
    'open_jobs',        (select count(*)                 from public.jobs where status = 'open'),
    'companies_hiring', (select count(distinct client)   from public.jobs where status = 'open'),
    'locations',        (select count(distinct location) from public.jobs where status = 'open'),
    'apps_month',       (select count(*) from public.applications where applied_date >= date_trunc('month', now())::date)
  )
$$;
revoke all on function public.cnt_public_stats() from public;
grant execute on function public.cnt_public_stats() to anon, authenticated;

-- Public candidate self-service status lookup. Two-factor (email + phone, both
-- on file) so it can't be used to enumerate emails, and it returns ONLY status
-- fields — never name, CV, notes or anyone else's data. SECURITY DEFINER so it
-- reads applications despite RLS; the WHERE clause is the whole guard.
create or replace function public.cnt_application_status(p_email text, p_phone text)
returns table (role text, client text, location text, stage text, applied_date date,
               endorsed_at timestamptz, decided_at timestamptz, client_status text, updated_at timestamptz)
language sql stable security definer set search_path=public as $$
  select a.role, a.client, a.location, a.stage, a.applied_date,
         a.endorsed_at, a.decided_at, a.client_status,
         greatest(a.created_at, coalesce(a.decided_at,a.created_at), coalesce(a.endorsed_at,a.created_at))
  from public.applications a
  where a.purged_at is null
    and lower(a.email) = lower(btrim(p_email))
    and length(regexp_replace(coalesce(a.phone,''),'[^0-9]','','g')) >= 7
    -- Match on the last 10 digits (national number) so +63 / leading-0 /
    -- spacing differences all resolve to the same number.
    and right(regexp_replace(coalesce(a.phone,''),'[^0-9]','','g'),10) = right(regexp_replace(coalesce(p_phone,''),'[^0-9]','','g'),10)
  order by a.created_at desc;
$$;
revoke all on function public.cnt_application_status(text, text) from public;
grant execute on function public.cnt_application_status(text, text) to anon, authenticated;

-- ── Persistent notifications (roadmap #7) ──────────────────────
-- RLS-enabled with no policies: reachable only through the RPCs below. Clients
-- are addressed by client_account, staff by recruiter full_name (null = all).
create table if not exists public.notifications (
  id               bigint generated always as identity primary key,
  recipient_kind   text not null,           -- 'client' | 'staff'
  recipient_client text,                     -- client account (when kind='client')
  recipient_name   text,                     -- staff full_name (when kind='staff'); null = all staff
  kind             text not null,            -- endorsed | approved | rejected | filled | request
  title            text,
  body             text,
  ref_type         text,                     -- 'applicant' | 'vacancy' | 'request'
  ref_id           text,
  created_at       timestamptz default now(),
  read_at          timestamptz
);
create index if not exists notifications_client_idx
  on public.notifications (recipient_client, created_at desc) where recipient_kind='client';
create index if not exists notifications_staff_idx
  on public.notifications (recipient_name, created_at desc) where recipient_kind='staff';
alter table public.notifications enable row level security;

-- Applications changes create notifications. Fires from every path that flips
-- client_status (ATS endorse, the client decide RPC).
create or replace function public.cnt_app_notify() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  if TG_OP='UPDATE' and NEW.client_status is distinct from OLD.client_status then
    if NEW.client_status='endorsed' then
      insert into public.notifications(recipient_kind, recipient_client, kind, title, body, ref_type, ref_id)
      values ('client', NEW.client, 'endorsed', 'New candidate to review',
              coalesce(NEW.name,'A candidate')||' ('||coalesce(NEW.role,'—')||') is awaiting your decision.',
              'applicant', NEW.id::text);
    elsif NEW.client_status in ('approved','rejected') then
      insert into public.notifications(recipient_kind, recipient_name, kind, title, body, ref_type, ref_id)
      values ('staff', NEW.recruiter, NEW.client_status,
              'Client '||NEW.client_status,
              coalesce(NEW.client,'A client')||' '||NEW.client_status||' '||coalesce(NEW.name,'a candidate')
                ||case when NEW.client_status='rejected' and coalesce(NEW.client_reason,'')<>''
                       then ' — '||NEW.client_reason else '' end,
              'applicant', NEW.id::text);
    end if;
  end if;
  return NEW;
end; $$;
drop trigger if exists cnt_app_notify_trg on public.applications;
create trigger cnt_app_notify_trg after update on public.applications
  for each row execute function public.cnt_app_notify();

-- Read my notifications (audience derived from the caller's profile).
create or replace function public.cnt_notifications(p_limit int default 30)
returns setof public.notifications
language plpgsql stable security definer set search_path=public as $$
declare acct text; nm text; r text;
begin
  select client_account, full_name, role into acct, nm, r
    from public.profiles where id=auth.uid();
  if acct is not null then
    return query select * from public.notifications
      where recipient_kind='client' and recipient_client=acct
      order by created_at desc limit greatest(1, least(coalesce(p_limit,30), 100));
  elsif r in ('super_admin','recruitment_manager','recruitment_supervisor','account_officer','recruiter') then
    return query select * from public.notifications
      where recipient_kind='staff' and (recipient_name is null or recipient_name=nm)
      order by created_at desc limit greatest(1, least(coalesce(p_limit,30), 100));
  end if;
  return;
end; $$;
revoke all on function public.cnt_notifications(int) from public, anon;
grant execute on function public.cnt_notifications(int) to authenticated;

-- Mark read (one id, or all mine when null).
create or replace function public.cnt_notifications_read(p_id bigint default null)
returns void language plpgsql security definer set search_path=public as $$
declare acct text; nm text; r text;
begin
  select client_account, full_name, role into acct, nm, r
    from public.profiles where id=auth.uid();
  update public.notifications set read_at=now()
   where read_at is null
     and (p_id is null or id=p_id)
     and ( (acct is not null and recipient_kind='client' and recipient_client=acct)
        or (acct is null and r in ('super_admin','recruitment_manager','recruitment_supervisor','account_officer','recruiter')
            and recipient_kind='staff' and (recipient_name is null or recipient_name=nm)) );
end; $$;
revoke all on function public.cnt_notifications_read(bigint) from public, anon;
grant execute on function public.cnt_notifications_read(bigint) to authenticated;

-- Position/location option lists for the client portal vacancy form (the
-- taxonomy table itself is staff-only, so clients read the names via this).
create or replace function public.cnt_taxonomy_options()
returns table(kind text, name text)
language sql stable security definer set search_path=public as $$
  select kind, name from public.taxonomy
  where kind in ('position','location')
  order by kind, name;
$$;
revoke all on function public.cnt_taxonomy_options() from public;
grant execute on function public.cnt_taxonomy_options() to anon, authenticated;

-- New sign-ups are inert ('pending') until an admin assigns a real role
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name',''), 'pending')
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ────────────────────────────────────────────────────────────
-- 4. ROW LEVEL SECURITY  (role-based — enforced at the DB layer)
--    Public may APPLY and browse OPEN jobs. Only staff read applicant
--    PII. Only managers manage users and delete records. Audit is
--    append-only. Wiped-then-recreated so re-runs never leave a stale
--    permissive policy behind.
-- ────────────────────────────────────────────────────────────
alter table public.applications    enable row level security;
alter table public.jobs            enable row level security;
alter table public.profiles        enable row level security;
alter table public.audit_log       enable row level security;
alter table public.taxonomy        enable row level security;
alter table public.stages          enable row level security;
alter table public.hiring_requests enable row level security;

do $wipe$ declare p record; begin
  for p in select policyname, tablename from pg_policies
           where schemaname='public' and tablename in ('applications','jobs','profiles','audit_log','taxonomy','stages','hiring_requests') loop
    execute format('drop policy if exists %I on public.%I', p.policyname, p.tablename);
  end loop;
end $wipe$;

-- Applications: anyone may APPLY (as a fresh 'new' row only); only staff
-- read/update; managers delete. Anon can't pre-set stage/decision fields — a
-- blanket `with check (true)` let a direct call inject a pre-approved candidate.
create policy "apps insert anon" on public.applications for insert to anon
  with check (
    coalesce(stage,'new')='new' and coalesce(status,'active')='active'
    and coalesce(client_status,'none')='none' and coalesce(priority,0)=0
    and endorsed_at is null and decided_at is null and client_reason is null
    and refuse_reason is null and confirmation_sent_at is null and preemp_requirements_at is null
  );
create policy "apps insert staff"  on public.applications for insert to authenticated with check (public.cnt_is_staff());
create policy "apps read staff"    on public.applications for select to authenticated using (public.cnt_is_staff());
create policy "apps update staff"  on public.applications for update to authenticated using (public.cnt_is_staff()) with check (public.cnt_is_staff());
create policy "apps delete staff"  on public.applications for delete to authenticated using (public.cnt_is_staff());

-- Jobs: public reads OPEN roles (careers page); staff read all + manage
create policy "jobs read open anon" on public.jobs for select to anon           using (status='open');
create policy "jobs read staff"     on public.jobs for select to authenticated  using (public.cnt_is_staff());
create policy "jobs write staff"    on public.jobs for all    to authenticated  using (public.cnt_is_staff()) with check (public.cnt_is_staff());

-- Profiles: staff read; only managers create/change/remove (blocks self role-escalation)
create policy "profiles read staff" on public.profiles for select to authenticated using (public.cnt_is_staff());
create policy "profiles insert mgr" on public.profiles for insert to authenticated with check (public.cnt_is_manager());
create policy "profiles update mgr" on public.profiles for update to authenticated using (public.cnt_is_manager()) with check (public.cnt_is_manager());
create policy "profiles delete mgr" on public.profiles for delete to authenticated using (public.cnt_is_manager());
-- Every user may read their OWN profile row (portal clients need role + account)
create policy "profiles read self" on public.profiles for select to authenticated using (id = auth.uid());

-- Hiring requests: staff manage all; a client reads and files only their own.
-- A client-filed request is forced to their account, Pending, client_submitted;
-- they cannot update or delete — staff own the lifecycle.
create policy "hr staff all"      on public.hiring_requests for all    to authenticated
  using (public.cnt_is_staff()) with check (public.cnt_is_staff());
-- (Client vacancy filing removed — the portal is monitoring-only now, so the
--  "hr client read"/"hr client insert" policies were dropped. See
--  2026-08-17-client-monitoring.sql. Staff own hiring_requests entirely.)

-- Only the Account Officer (or owner) may approve an MRF (Pending → Open) or
-- change its assigned recruiter. RLS lets any staff UPDATE, so this trigger
-- enforces the rule server-side (the UI gate alone is bypassable via the API).
create or replace function public.cnt_mrf_guard() returns trigger
language plpgsql security definer set search_path=public as $$
declare r text;
begin
  if auth.uid() is null then return NEW; end if;
  select role into r from public.profiles where id = auth.uid();
  if ( (NEW.assigned_to   is distinct from OLD.assigned_to)
    or (NEW.assigned_name is distinct from OLD.assigned_name)
    or (OLD.status = 'Pending' and NEW.status = 'Open') )
     and coalesce(r,'') not in ('account_officer','super_admin') then
    raise exception 'Only the Account Officer may approve MRFs or assign recruiters';
  end if;
  return NEW;
end; $$;
drop trigger if exists cnt_mrf_guard_trg on public.hiring_requests;
create trigger cnt_mrf_guard_trg before update on public.hiring_requests
  for each row execute function public.cnt_mrf_guard();

-- Audit log: staff append + read; no update/delete policy ⇒ rows are immutable
create policy "audit insert staff" on public.audit_log for insert to authenticated with check (public.cnt_is_staff());
create policy "audit read staff"   on public.audit_log for select to authenticated using (public.cnt_is_staff());

-- Taxonomy (master data): staff read; only managers/super admin may change
create policy "taxonomy read staff" on public.taxonomy for select to authenticated using (public.cnt_is_staff());
create policy "taxonomy write mgr"  on public.taxonomy for all    to authenticated using (public.cnt_is_manager()) with check (public.cnt_is_manager());

-- Stages: staff read; only managers/super admin may reconfigure the pipeline
create policy "stages read staff" on public.stages for select to authenticated using (public.cnt_is_staff());
create policy "stages write mgr"  on public.stages for all    to authenticated using (public.cnt_is_manager()) with check (public.cnt_is_manager());

-- ────────────────────────────────────────────────────────────
-- 5. RESUME STORAGE  (private bucket)
--    Applicants upload CVs; only staff can download.
-- ────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

drop policy if exists "resumes upload public" on storage.objects;
drop policy if exists "resumes read authed"   on storage.objects;
drop policy if exists "resumes read staff"    on storage.objects;
drop policy if exists "resumes read client"   on storage.objects;
drop policy if exists "resumes delete mgr"    on storage.objects;
create policy "resumes upload public" on storage.objects
  for insert to anon, authenticated with check (bucket_id='resumes');
create policy "resumes read staff" on storage.objects
  for select to authenticated using (bucket_id='resumes' and public.cnt_is_staff());
-- (No client CV access — the monitoring portal is anonymised. The former
--  "resumes read client" policy was dropped; see 2026-08-17-client-monitoring.sql.)
-- managers may delete CVs — required for the RA 10173 retention purge / erasure
create policy "resumes delete mgr" on storage.objects
  for delete to authenticated using (bucket_id='resumes' and public.cnt_is_manager());

-- Constrain résumé uploads: 5 MB cap + CV file types only (anon upload otherwise
-- has no size/type limit — a storage-abuse vector).
update storage.buckets
   set file_size_limit    = 5242880,
       allowed_mime_types = array['application/pdf','application/msword',
         'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
 where id = 'resumes';

-- ────────────────────────────────────────────────────────────
-- 6. SEED MASTER DATA + OPEN POSITIONS  (only when empty — never wipes live data)
-- ────────────────────────────────────────────────────────────
-- Current pipeline, seeded only when empty
insert into public.stages (key, name, short, color, sequence, folded, is_hired)
select * from (values
  ('new',       'Initial Screening','Screening','#ef4444',10,false,false),
  ('interview', 'Interview',        'Interview','#8b5cf6',20,false,false),
  ('exam',      'Pre-Emp Exam',     'Exam',     '#06b6d4',30,false,false),
  ('bgcheck',   'Background Check', 'BGC',      '#6366f1',40,false,false),
  ('hired',     'Job Offer',        'Offer',    '#10b981',50,false,true),
  ('onboarding','Onboarding',       'Onboard',  '#059669',60,false,true)
) v(key,name,short,color,sequence,folded,is_hired)
where not exists (select 1 from public.stages);

insert into public.taxonomy (kind, name, color)
select * from (values
  ('client','SONY','#1d4ed8'),('client','HAIER','#0f766e'),('client','HISENSE','#7c3aed'),
  ('client','URC','#b91c1c'),('client','SKYWORTH','#0369a1'),('client','UNCLE JOHNS','#d97706'),
  ('client','Cinderella','#be185d'),
  ('position','Sales Promoter',null),('position','Merchandiser',null),('position','Area Supervisor',null),
  ('position','Brand Ambassador',null),('position','Trade Marketing Specialist',null),
  ('position','Field Sales Representative',null),('position','Product Demonstrator',null),
  ('position','Store Supervisor',null),('position','In-Store Activator',null),
  ('position','Content Marketer',null),('position','Logistics Coordinator',null),
  ('location','Manila',null),('location','Tarlac',null),('location','Bulacan',null),
  ('location','Pampanga',null),('location','Cavite',null),('location','Pangasinan',null),
  ('location','Batangas',null)
) v(kind,name,color)
where not exists (select 1 from public.taxonomy);

insert into public.jobs (role, client, location, salary_range, openings, priority)
select * from (values
  ('Merchandiser',                'SONY',        'Manila',     '₱17,000-₱19,000', 5, 'high'),
  ('Brand Ambassador',            'SONY',        'Tarlac',     '₱16,000-₱18,000', 3, 'normal'),
  ('Store Supervisor',            'SONY',        'Bulacan',    '₱23,000-₱26,000', 2, 'urgent'),
  ('Product Demonstrator',        'SONY',        'Pampanga',   '₱15,500-₱17,000', 4, 'normal'),
  ('Sales Promoter',              'HAIER',       'Manila',     '₱14,500-₱16,500', 6, 'high'),
  ('Brand Ambassador',            'HAIER',       'Cavite',     '₱16,000-₱18,000', 3, 'normal'),
  ('Area Supervisor',             'HAIER',       'Pangasinan', '₱26,000-₱30,000', 1, 'urgent'),
  ('Merchandiser',                'HAIER',       'Batangas',   '₱15,500-₱17,500', 4, 'normal'),
  ('Product Demonstrator',        'HISENSE',     'Manila',     '₱15,000-₱17,000', 5, 'high'),
  ('Trade Marketing Specialist',  'HISENSE',     'Pampanga',   '₱28,000-₱35,000', 2, 'normal'),
  ('In-Store Activator',          'HISENSE',     'Cavite',     '₱14,000-₱16,000', 3, 'normal'),
  ('Sales Promoter',              'URC',         'Manila',     '₱14,500-₱16,000', 8, 'urgent'),
  ('Area Supervisor',             'URC',         'Tarlac',     '₱25,000-₱28,000', 2, 'high'),
  ('Field Sales Representative',  'URC',         'Bulacan',    '₱20,000-₱24,000', 4, 'high'),
  ('Trade Marketing Specialist',  'URC',         'Batangas',   '₱28,000-₱32,000', 2, 'normal'),
  ('Product Demonstrator',        'SKYWORTH',    'Manila',     '₱14,500-₱16,500', 5, 'normal'),
  ('Sales Promoter',              'SKYWORTH',    'Pampanga',   '₱14,000-₱16,000', 4, 'high'),
  ('Merchandiser',                'SKYWORTH',    'Tarlac',     '₱15,500-₱17,000', 3, 'normal'),
  ('Sales Promoter',              'UNCLE JOHNS', 'Batangas',   '₱13,500-₱15,500', 4, 'normal'),
  ('In-Store Activator',          'UNCLE JOHNS', 'Manila',     '₱14,000-₱16,000', 3, 'high'),
  ('Logistics Coordinator',       'UNCLE JOHNS', 'Bulacan',    '₱18,000-₱22,000', 2, 'normal'),
  ('Sales Promoter',              'Cinderella',  'Manila',     '₱14,500-₱16,000', 6, 'high'),
  ('Store Supervisor',            'Cinderella',  'Manila',     '₱22,000-₱26,000', 2, 'urgent'),
  ('Brand Ambassador',            'Cinderella',  'Cavite',     '₱15,500-₱18,000', 3, 'normal')
) v(role, client, location, salary_range, openings, priority)
where not exists (select 1 from public.jobs);

-- ============================================================
--  Done. First admin: create a user under Authentication → Users,
--  then in SQL:  update public.profiles set role='super_admin'
--                where email='<that user email>';
--  (New sign-ups land as 'pending' and cannot read data until promoted.)
-- ============================================================
