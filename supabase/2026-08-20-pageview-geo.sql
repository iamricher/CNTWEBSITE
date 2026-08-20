-- ============================================================
--  CNT — page_views geography (for Content Studio analytics)
--
--  Adds coarse visitor location to each page view so the analytics dashboard
--  can show top countries and Philippine regions/cities. The values come from
--  Vercel's edge geo-IP headers (x-vercel-ip-country / -country-region / -city)
--  attached by the /api/pv serverless function — the full IP is never stored.
--
--  Run once in Supabase → SQL editor.
-- ============================================================
alter table public.page_views add column if not exists country text;   -- ISO-2, e.g. PH
alter table public.page_views add column if not exists region  text;   -- region/state code
alter table public.page_views add column if not exists city    text;

-- Helpful for the "Locations" rollups over a date range.
create index if not exists page_views_country_idx on public.page_views (country, created_at);
create index if not exists page_views_region_idx  on public.page_views (region,  created_at);
