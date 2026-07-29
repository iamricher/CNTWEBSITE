-- Odoo-style Job Position editor: extra descriptive fields on public.jobs.
-- These back the redesigned job editor (Recruitment tab): Department, Industry,
-- Working Schedule, Contract Template, Expected Skills (comma-separated tags) and
-- Interviewers (comma-separated staff names). "Published" reuses the existing
-- status column (open = published, paused = unpublished), so no column for it.
-- Idempotent and non-destructive — safe to re-run.

alter table public.jobs
  add column if not exists department        text,
  add column if not exists industry          text,
  add column if not exists working_schedule  text,
  add column if not exists contract_template text,
  add column if not exists expected_skills   text,
  add column if not exists interviewers      text;

-- verify (expect 6)
select count(*) as job_odoo_cols
from information_schema.columns
where table_schema='public' and table_name='jobs'
  and column_name in ('department','industry','working_schedule','contract_template','expected_skills','interviewers');
