-- ============================================================
--  FAQ + Team managers for Content Studio
--  Run this once in Supabase → SQL Editor.
--  Public (anon) can read only published rows; staff can do everything
--  (same cnt_is_staff() gate the rest of the admin uses).
-- ============================================================

-- ---------- FAQs ----------
create table if not exists public.faqs (
  id          bigint generated always as identity primary key,
  question    text    not null,
  answer      text    not null,          -- trusted HTML authored by staff
  sort_order  int     not null default 0,
  published   boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.faqs enable row level security;

drop policy if exists "faqs public read"  on public.faqs;
drop policy if exists "faqs staff write"   on public.faqs;
create policy "faqs public read" on public.faqs
  for select using (published = true);
create policy "faqs staff write" on public.faqs
  for all using (public.cnt_is_staff()) with check (public.cnt_is_staff());

-- ---------- Team members (About → Leadership) ----------
create table if not exists public.team_members (
  id          bigint generated always as identity primary key,
  name        text    not null,
  role        text,
  photo_url   text,
  sort_order  int     not null default 0,
  published   boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.team_members enable row level security;

drop policy if exists "team public read" on public.team_members;
drop policy if exists "team staff write" on public.team_members;
create policy "team public read" on public.team_members
  for select using (published = true);
create policy "team staff write" on public.team_members
  for all using (public.cnt_is_staff()) with check (public.cnt_is_staff());
