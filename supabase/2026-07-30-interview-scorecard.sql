-- Interview scorecard / evaluation (Odoo "interview survey" equivalent).
-- Structured per-candidate evaluation: {scores:{criterion:1-5}, recommendation,
-- notes, by, at}. Backs the Endorse/Proceed/Refuse decision. Idempotent.

alter table public.applications
  add column if not exists interview_scorecard jsonb not null default '{}'::jsonb;

-- verify (expect 1)
select count(*) as scorecard_col
from information_schema.columns
where table_schema='public' and table_name='applications' and column_name='interview_scorecard';
