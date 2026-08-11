-- View counts: a per-event view counter + a site-wide visit counter.
-- Anonymous visitors can only INCREMENT (via SECURITY DEFINER functions);
-- only staff can read the site-visit total. Idempotent.

-- 1) Per-event views ─────────────────────────────────────────────
alter table public.events add column if not exists view_count bigint not null default 0;

create or replace function public.cnt_increment_event_view(ev_id bigint)
returns void language sql security definer set search_path=public as $$
  update public.events set view_count = coalesce(view_count,0) + 1
  where id = ev_id and published = true;
$$;
grant execute on function public.cnt_increment_event_view(bigint) to anon, authenticated;

-- 2) Site-wide visit counter ─────────────────────────────────────
create table if not exists public.site_metrics (
  key   text primary key,
  count bigint not null default 0
);
insert into public.site_metrics(key, count) values ('site_visits', 0)
  on conflict (key) do nothing;

alter table public.site_metrics enable row level security;
drop policy if exists "site_metrics read staff" on public.site_metrics;
create policy "site_metrics read staff" on public.site_metrics
  for select to authenticated using (public.cnt_is_staff());

create or replace function public.cnt_increment_visit()
returns bigint language plpgsql security definer set search_path=public as $$
declare v bigint;
begin
  update public.site_metrics set count = count + 1 where key = 'site_visits' returning count into v;
  if not found then
    insert into public.site_metrics(key, count) values ('site_visits', 1) returning count into v;
  end if;
  return v;
end;
$$;
grant execute on function public.cnt_increment_visit() to anon, authenticated;

-- verify (col=1, tbl=1, fns=2)
select (select count(*) from information_schema.columns where table_schema='public' and table_name='events' and column_name='view_count') as col,
       (select count(*) from information_schema.tables  where table_schema='public' and table_name='site_metrics') as tbl,
       (select count(*) from pg_proc where proname in ('cnt_increment_event_view','cnt_increment_visit')) as fns;
