-- Success Stories: super-admin-managed case studies shown on the homepage.
-- Public reads PUBLISHED rows; only super_admin writes. Reuses the public
-- 'event-images' bucket for photos. Idempotent.

create table if not exists public.stories (
  id          bigint generated always as identity primary key,
  category    text,           -- e.g. "Banking & Finance"
  title       text not null,
  description text,
  image_url   text,
  published   boolean not null default true,
  sort_order  int default 0,
  created_at  timestamptz default now()
);

alter table public.stories enable row level security;

drop policy if exists "stories read published" on public.stories;
drop policy if exists "stories read staff"     on public.stories;
drop policy if exists "stories write super"    on public.stories;
create policy "stories read published" on public.stories for select to anon, authenticated using (published = true);
create policy "stories read staff"     on public.stories for select to authenticated using (public.cnt_is_staff());
create policy "stories write super"    on public.stories for all    to authenticated using (public.cnt_is_super_admin()) with check (public.cnt_is_super_admin());

-- verify (expect 1)
select count(*) as tbl from information_schema.tables where table_schema='public' and table_name='stories';
