-- ============================================================
--  Public live-stats RPC for the homepage "Our Impact (Live)" band.
--  Run once in the Supabase SQL editor (idempotent, safe to re-run).
--
--  Returns ONLY aggregate counts — no rows, no names, no PII — so it is safe
--  to expose to anon. It is the single public read of these tables' shape;
--  everything else stays behind RLS. Mirrored in supabase/schema.sql.
-- ============================================================
create or replace function public.cnt_public_stats()
returns json language sql stable security definer set search_path=public as $$
  select json_build_object(
    'open_jobs',    (select count(*)                 from public.jobs where status = 'open'),
    'openings',     (select coalesce(sum(openings),0) from public.jobs where status = 'open'),
    'partners',     (select count(distinct client)   from public.jobs),
    'locations',    (select count(distinct location) from public.jobs where status = 'open'),
    'applications', (select count(*)                 from public.applications),
    'placed',       (select count(*)                 from public.applications where stage in ('hired','onboarding'))
  )
$$;
revoke all on function public.cnt_public_stats() from public;
grant execute on function public.cnt_public_stats() to anon, authenticated;

-- verify: expect one json row of counts
select public.cnt_public_stats();
