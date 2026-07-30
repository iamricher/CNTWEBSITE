-- Opt-in stage-entry email automation (Odoo parity). Each pipeline stage can be
-- flagged to auto-send its email template when a candidate enters it. Default OFF
-- so nothing sends unless an admin turns it on per stage. Idempotent.

alter table public.stages
  add column if not exists auto_email boolean not null default false;

-- verify
select count(*) as auto_email_col
from information_schema.columns
where table_schema='public' and table_name='stages' and column_name='auto_email';
