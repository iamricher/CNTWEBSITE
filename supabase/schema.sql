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
  add column if not exists interview_round text;   -- 1st / 2nd / 3rd / Final

-- Odoo job-position fields
alter table public.jobs
  add column if not exists employment_type text default 'Full-Time',
  add column if not exists recruiter        text;

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
alter table public.applications enable row level security;
alter table public.jobs         enable row level security;
alter table public.profiles     enable row level security;
alter table public.audit_log    enable row level security;
alter table public.taxonomy     enable row level security;
alter table public.stages       enable row level security;

do $wipe$ declare p record; begin
  for p in select policyname, tablename from pg_policies
           where schemaname='public' and tablename in ('applications','jobs','profiles','audit_log','taxonomy','stages') loop
    execute format('drop policy if exists %I on public.%I', p.policyname, p.tablename);
  end loop;
end $wipe$;

-- Applications: anyone may APPLY; only staff read/update; managers delete
create policy "apps insert public" on public.applications for insert to anon, authenticated with check (true);
create policy "apps read staff"    on public.applications for select to authenticated using (public.cnt_is_staff());
create policy "apps update staff"  on public.applications for update to authenticated using (public.cnt_is_staff()) with check (public.cnt_is_staff());
create policy "apps delete mgr"    on public.applications for delete to authenticated using (public.cnt_is_manager());

-- Jobs: public reads OPEN roles (careers page); staff read all + manage
create policy "jobs read open anon" on public.jobs for select to anon           using (status='open');
create policy "jobs read staff"     on public.jobs for select to authenticated  using (public.cnt_is_staff());
create policy "jobs write staff"    on public.jobs for all    to authenticated  using (public.cnt_is_staff()) with check (public.cnt_is_staff());

-- Profiles: staff read; only managers create/change/remove (blocks self role-escalation)
create policy "profiles read staff" on public.profiles for select to authenticated using (public.cnt_is_staff());
create policy "profiles insert mgr" on public.profiles for insert to authenticated with check (public.cnt_is_manager());
create policy "profiles update mgr" on public.profiles for update to authenticated using (public.cnt_is_manager()) with check (public.cnt_is_manager());
create policy "profiles delete mgr" on public.profiles for delete to authenticated using (public.cnt_is_manager());

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
drop policy if exists "resumes delete mgr"    on storage.objects;
create policy "resumes upload public" on storage.objects
  for insert to anon, authenticated with check (bucket_id='resumes');
create policy "resumes read staff" on storage.objects
  for select to authenticated using (bucket_id='resumes' and public.cnt_is_staff());
-- managers may delete CVs — required for the RA 10173 retention purge / erasure
create policy "resumes delete mgr" on storage.objects
  for delete to authenticated using (bucket_id='resumes' and public.cnt_is_manager());

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
