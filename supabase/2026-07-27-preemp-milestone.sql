-- Pre-Employment Requirements milestone.
--
-- Adds the timestamp the deployment checklist stamps when a candidate's
-- pre-employment requirements are completed. The other deployment milestones
-- (contract_signed_at, oriented_at, deployed_at, newhire_reported_at) already
-- exist; this is the new first step. Non-destructive.

alter table public.applications
  add column if not exists preemp_requirements_at timestamptz;

-- verify (expect 1)
select count(*) as preemp_col
from information_schema.columns
where table_schema='public' and table_name='applications' and column_name='preemp_requirements_at';
