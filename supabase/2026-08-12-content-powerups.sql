-- Content power-ups: scheduled publishing + image galleries for events.
-- (Drag-to-reorder reuses the existing sort_order columns — no schema change.)
-- Idempotent.

alter table public.events add column if not exists publish_at timestamptz;
alter table public.events add column if not exists images jsonb not null default '[]'::jsonb;

-- Public sees a row only if it's published AND not scheduled for the future.
drop policy if exists "events read published" on public.events;
create policy "events read published" on public.events for select to anon, authenticated
  using (published = true and (publish_at is null or publish_at <= now()));

-- verify (both columns = 1)
select (select count(*) from information_schema.columns where table_schema='public' and table_name='events' and column_name='publish_at') as publish_at_col,
       (select count(*) from information_schema.columns where table_schema='public' and table_name='events' and column_name='images') as images_col;
