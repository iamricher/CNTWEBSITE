-- Auto-confirmation email for new applications.
--
-- On every new application, a trigger calls the applicant-confirm Edge Function
-- (via pg_net, asynchronously) which emails the applicant. Server-side so it
-- doesn't depend on the browser and isn't affected by the staff-only SELECT RLS
-- on applications. The call is fire-and-forget and wrapped so it can NEVER block
-- or fail an application insert.
--
-- Prereqs: deploy the applicant-confirm function (with JWT verification OFF) and
-- set RESEND_API_KEY / MAIL_FROM (see docs/email.md). Safe to run before that —
-- until the function exists the async call just no-ops.
--
-- Run in Supabase → SQL Editor. Also mirrored in schema.sql.

-- Single-shot guard the function stamps after sending.
alter table public.applications
  add column if not exists confirmation_sent_at timestamptz;

-- pg_net lets Postgres make outbound HTTP calls (enable if not already).
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
  return NEW;   -- email plumbing must never block an application insert
end; $$;

drop trigger if exists cnt_application_confirm_trg on public.applications;
create trigger cnt_application_confirm_trg after insert on public.applications
  for each row execute function public.cnt_application_confirm();

-- verify (each expect 1)
select (select count(*) from information_schema.columns
          where table_schema='public' and table_name='applications' and column_name='confirmation_sent_at') as confirmation_col,
       (select count(*) from pg_proc where proname='cnt_application_confirm') as fn,
       (select count(*) from pg_trigger where tgname='cnt_application_confirm_trg') as trg;
