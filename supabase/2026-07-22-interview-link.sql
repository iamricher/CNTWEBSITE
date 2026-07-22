-- Online-interview meeting link. Additive; safe to re-run.
-- Run in Supabase → SQL Editor. (Also captured in schema.sql.)
alter table public.applications
  add column if not exists interview_link text;
