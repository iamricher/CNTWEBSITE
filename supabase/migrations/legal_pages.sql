-- ============================================================
--  Editable Privacy Policy & Terms of Service (Content Studio → Legal).
--  One row per page (slug 'privacy' / 'terms'). Public reads all rows; staff
--  (cnt_is_staff) writes. Pages fall back to their hardcoded HTML when no row
--  exists, so nothing breaks before you edit. Idempotent.
-- ============================================================

create table if not exists public.legal_pages (
  slug          text primary key,          -- 'privacy' | 'terms'
  updated_label text,                       -- the "Last updated: …" line
  body_html     text,                       -- inner HTML of <main class="legal-body">
  updated_at    timestamptz not null default now()
);

alter table public.legal_pages enable row level security;

drop policy if exists "legal public read" on public.legal_pages;
drop policy if exists "legal staff write" on public.legal_pages;
create policy "legal public read" on public.legal_pages
  for select using (true);
create policy "legal staff write" on public.legal_pages
  for all using (public.cnt_is_staff()) with check (public.cnt_is_staff());

select slug, updated_label from public.legal_pages;
