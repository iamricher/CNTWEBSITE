-- ============================================================
--  CNT — application campaign attribution (UTM)
--
--  Carries the visitor's campaign (from the tagged link they arrived on) all
--  the way to the application they submit, so the recruiter can see which
--  shared link / platform / campaign actually produced a hire — not just a
--  page view. Captured from the browser's stored first-touch UTM by
--  careers.html and forwarded through /api/apply.
--
--  Note: this is separate from the self-reported "How did you hear about us?"
--  (applications.source) — utm_* is the automatic, trustworthy attribution.
--
--  Run once in Supabase → SQL editor.
-- ============================================================
alter table public.applications add column if not exists utm_source   text;
alter table public.applications add column if not exists utm_medium   text;
alter table public.applications add column if not exists utm_campaign text;

create index if not exists applications_utm_idx on public.applications (utm_source, utm_campaign, created_at);
