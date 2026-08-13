-- Analytics: log each public page view as a row so we can chart views over
-- time, unique visitors, and per-page traffic. Anonymous visitors can only
-- INSERT; only staff can read. Idempotent.

create table if not exists public.page_views (
  id         bigint generated always as identity primary key,
  path       text,
  visitor_id text,          -- persistent per-browser id (localStorage)
  created_at timestamptz default now()
);
create index if not exists page_views_created_idx on public.page_views (created_at);

alter table public.page_views enable row level security;
drop policy if exists "page_views insert anon" on public.page_views;
drop policy if exists "page_views read staff"  on public.page_views;
create policy "page_views insert anon" on public.page_views for insert to anon, authenticated with check (true);
create policy "page_views read staff"  on public.page_views for select to authenticated using (public.cnt_is_staff());

-- verify (tbl=1)
select (select count(*) from information_schema.tables where table_schema='public' and table_name='page_views') as tbl;
