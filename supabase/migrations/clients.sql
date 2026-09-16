-- ============================================================
--  Clients manager (homepage logo marquee) for Content Studio.
--  Public reads published rows; staff (cnt_is_staff) writes. Then seeds the
--  logos that were hardcoded on the homepage as editable rows. Idempotent.
-- ============================================================

create table if not exists public.clients (
  id          bigint generated always as identity primary key,
  name        text    not null,
  logo_url    text,
  sort_order  int     not null default 0,
  published   boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.clients enable row level security;

drop policy if exists "clients public read" on public.clients;
drop policy if exists "clients staff write" on public.clients;
create policy "clients public read" on public.clients
  for select using (published = true);
create policy "clients staff write" on public.clients
  for all using (public.cnt_is_staff()) with check (public.cnt_is_staff());

-- Seed the previously-hardcoded homepage logos (guarded by logo_url so re-runs
-- don't duplicate and your own additions are never touched).
insert into public.clients (name, logo_url, sort_order, published)
select v.name, v.logo_url, v.sort_order, true
from (values
  ('Universal Robina Corporation', '/assets/img/urc.png',          1),
  ('Uncle John''s',                '/assets/img/uncle-johns.png',   2),
  ('Sony',                         '/assets/img/sony.png',          3),
  ('Skyworth',                     '/assets/img/skyworth.png',      4),
  ('Hisense',                      '/assets/img/hisense.png',       5),
  ('Client (rename me)',           '/assets/img/client-290663.png', 6)
) as v(name, logo_url, sort_order)
where not exists (select 1 from public.clients c where c.logo_url = v.logo_url);

-- verify
select id, name, sort_order, published from public.clients order by sort_order, created_at;
