-- Candidate self-service status lookup (powers status.html).
-- Public, two-factor (email + phone) so it can't enumerate emails, and it
-- returns ONLY status fields. Run in Supabase → SQL Editor. No destructive
-- operations, so no confirmation prompt. Also captured in schema.sql.
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
    and regexp_replace(coalesce(a.phone,''),'[^0-9]','','g') = regexp_replace(coalesce(p_phone,''),'[^0-9]','','g')
  order by a.created_at desc;
$$;
revoke all on function public.cnt_application_status(text, text) from public;
grant execute on function public.cnt_application_status(text, text) to anon, authenticated;

select (select count(*) from pg_proc where proname='cnt_application_status') as status_fn;  -- expect 1
