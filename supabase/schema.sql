-- ============================================================
--  CNT  —  Careers × ATS  shared database (Supabase / Postgres)
--  Run this ONCE:  Supabase dashboard → SQL Editor → paste → Run
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
  status       text default 'open',            -- open | closed
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
  stage        text default 'new',             -- ATS pipeline stage
  status       text default 'active',
  applied_date date default current_date,
  created_at   timestamptz default now()
);

create index if not exists applications_created_idx on public.applications (created_at desc);

-- Odoo-style recruitment mechanics (additive — safe to re-run)
--   priority      : 0=None 1=Good 2=Very Good 3=Excellent  (star evaluation)
--   refuse_reason : structured reason when a candidate is refused
--   kanban_state  : normal | ready | blocked                (card status dot)
--   activity      : append-only timeline of events (jsonb)
alter table public.applications
  add column if not exists priority      int   default 0,
  add column if not exists refuse_reason text,
  add column if not exists kanban_state  text  default 'normal',
  add column if not exists activity      jsonb default '[]'::jsonb;

-- Odoo applicant-form fields + reporting/offer alignment (additive)
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

-- Odoo job-position fields (additive)
alter table public.jobs
  add column if not exists employment_type text default 'Full-Time',
  add column if not exists recruiter        text;

-- ────────────────────────────────────────────────────────────
-- 2. ROW LEVEL SECURITY
--    Public can APPLY and browse OPEN jobs, nothing else.
--    Only signed-in HR staff can read applicants or move stages.
-- ────────────────────────────────────────────────────────────
alter table public.jobs         enable row level security;
alter table public.applications enable row level security;

-- Jobs ------------------------------------------------------
drop policy if exists "jobs read open anon"  on public.jobs;
drop policy if exists "jobs read all authed" on public.jobs;
drop policy if exists "jobs write authed"    on public.jobs;

create policy "jobs read open anon"  on public.jobs
  for select to anon           using (status = 'open');
create policy "jobs read all authed" on public.jobs
  for select to authenticated  using (true);
create policy "jobs write authed"    on public.jobs
  for all    to authenticated  using (true) with check (true);

-- Applications ---------------------------------------------
drop policy if exists "apps insert public"  on public.applications;
drop policy if exists "apps read authed"    on public.applications;
drop policy if exists "apps update authed"  on public.applications;

create policy "apps insert public" on public.applications
  for insert to anon, authenticated with check (true);   -- anyone may apply
create policy "apps read authed"   on public.applications
  for select to authenticated using (true);              -- only HR may read
create policy "apps update authed" on public.applications
  for update to authenticated using (true) with check (true);

-- ────────────────────────────────────────────────────────────
-- 3. RESUME STORAGE  (private bucket)
-- ────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

drop policy if exists "resumes upload public" on storage.objects;
drop policy if exists "resumes read authed"   on storage.objects;

create policy "resumes upload public" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'resumes');                     -- applicants may upload
create policy "resumes read authed" on storage.objects
  for select to authenticated
  using (bucket_id = 'resumes');                          -- only HR may download

-- ────────────────────────────────────────────────────────────
-- 4. SEED OPEN POSITIONS  (mirrors the ATS job database)
--    Safe to re-run: clears and reloads the seed set.
-- ────────────────────────────────────────────────────────────
truncate public.jobs restart identity cascade;

insert into public.jobs (role, client, location, salary_range, openings, priority) values
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
  ('Brand Ambassador',            'Cinderella',  'Cavite',     '₱15,500-₱18,000', 3, 'normal');

-- Done. Next: create one HR login under Authentication → Users → Add user.
