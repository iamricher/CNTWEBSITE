-- Reconcile schema drift: the deployment-milestone timestamp columns are used
-- by the app (mapRow / setMilestone / printable docs) and exist in production,
-- but weren't defined in schema.sql. Idempotent — a no-op if they already exist,
-- creates them if a rebuild is missing them. Non-destructive.

alter table public.applications
  add column if not exists contract_signed_at  timestamptz,
  add column if not exists oriented_at          timestamptz,
  add column if not exists deployed_at          timestamptz,
  add column if not exists newhire_reported_at  timestamptz;

-- verify (expect 4)
select count(*) as milestone_cols
from information_schema.columns
where table_schema='public' and table_name='applications'
  and column_name in ('contract_signed_at','oriented_at','deployed_at','newhire_reported_at');
