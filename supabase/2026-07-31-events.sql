-- Events & Updates: super-admin-posted news shown on the public site, each with
-- a dedicated detail page. Public reads only PUBLISHED rows; only super_admin
-- can create/edit/delete. Idempotent.

create or replace function public.cnt_is_super_admin()
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles where id=auth.uid() and role='super_admin')
$$;

create table if not exists public.events (
  id          bigint generated always as identity primary key,
  title       text not null,
  category    text,          -- Hiring Drive / Announcement / Milestone …
  summary     text,          -- short blurb for the card
  body        text,          -- full details for the detail page
  event_date  text,          -- display label, e.g. "Aug 2026"
  image_url   text,
  published   boolean not null default true,
  created_at  timestamptz default now()
);

alter table public.events enable row level security;

drop policy if exists "events read published" on public.events;
drop policy if exists "events read staff"     on public.events;
drop policy if exists "events write super"    on public.events;
create policy "events read published" on public.events for select to anon, authenticated using (published = true);
create policy "events read staff"     on public.events for select to authenticated using (public.cnt_is_staff());
create policy "events write super"    on public.events for all    to authenticated using (public.cnt_is_super_admin()) with check (public.cnt_is_super_admin());

-- verify (tbl=1, fn=1)
select (select count(*) from information_schema.tables where table_schema='public' and table_name='events') as tbl,
       (select count(*) from pg_proc where proname='cnt_is_super_admin') as fn;
