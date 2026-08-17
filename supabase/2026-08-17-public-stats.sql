-- ============================================================
--  Public live-stats RPC for the homepage "Our Impact (Live)" band.
--  Run once in the Supabase SQL editor (idempotent, safe to re-run).
--
--  Returns ONLY aggregate counts — no rows, no names, no PII — so it is safe
--  to expose to anon. Deliberately scoped to CURRENT activity (open jobs,
--  companies hiring now, applications this month) so it complements the
--  homepage's lifetime figures instead of contradicting them.
--  Mirrored in supabase/schema.sql.
-- ============================================================
create or replace function public.cnt_public_stats()
returns json language sql stable security definer set search_path=public as $$
  select json_build_object(
    'openings',         (select coalesce(sum(openings),0) from public.jobs where status = 'open'),
    'open_jobs',        (select count(*)                 from public.jobs where status = 'open'),
    'companies_hiring', (select count(distinct client)   from public.jobs where status = 'open'),
    'locations',        (select count(distinct location) from public.jobs where status = 'open'),
    'apps_month',       (select count(*) from public.applications where applied_date >= date_trunc('month', now())::date)
  )
$$;
revoke all on function public.cnt_public_stats() from public;
grant execute on function public.cnt_public_stats() to anon, authenticated;

-- verify: expect one json row of counts
select public.cnt_public_stats();
