-- ============================================================
--  CNT — page_views campaign attribution (UTM) for Content Studio
--
--  Adds the standard UTM tags to each page view so the analytics dashboard
--  can show which shared link / platform / campaign drove the visit — even
--  when the social app strips the referrer. The values come from the URL the
--  visitor arrived on (?utm_source=…&utm_medium=…&utm_campaign=…), captured by
--  assets/site-chrome.js and stored via the /api/pv serverless function.
--
--  First-touch: once a visitor lands on a tagged link, the campaign sticks to
--  their following page views for 30 days, so the whole visit is credited.
--
--  Run once in Supabase → SQL editor.
-- ============================================================
alter table public.page_views add column if not exists utm_source   text;   -- e.g. facebook, instagram, email
alter table public.page_views add column if not exists utm_medium   text;   -- e.g. social, post, story, email
alter table public.page_views add column if not exists utm_campaign text;   -- e.g. oct-hiring, csr-warehouse

-- Helpful for the "Campaigns" rollup over a date range.
create index if not exists page_views_utm_idx on public.page_views (utm_source, utm_campaign, created_at);
