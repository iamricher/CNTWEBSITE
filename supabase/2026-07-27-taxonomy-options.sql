-- Position/location options for the client portal vacancy form.
--
-- The taxonomy table is staff-only (RLS), so a client can't read it directly.
-- This SECURITY DEFINER function exposes ONLY the position and location NAMES
-- (not clients, not anything sensitive) so the client portal can offer them as
-- dropdowns instead of free text. Safe to grant broadly — these are just labels.
--
-- Run in Supabase → SQL Editor. Non-destructive. Also mirrored in schema.sql.
create or replace function public.cnt_taxonomy_options()
returns table(kind text, name text)
language sql stable security definer set search_path=public as $$
  select kind, name from public.taxonomy
  where kind in ('position','location')
  order by kind, name;
$$;
revoke all on function public.cnt_taxonomy_options() from public;
grant execute on function public.cnt_taxonomy_options() to anon, authenticated;

-- verify (expect 1)
select count(*) as taxonomy_options_fn from pg_proc where proname='cnt_taxonomy_options';
