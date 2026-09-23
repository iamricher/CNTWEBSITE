-- ============================================================
--  Per-service promo video (YouTube) for the Services section.
--
--  Adds an optional `video_url` to the services table. Managers paste a
--  YouTube link in Content Studio → Services → Video, and service.html renders
--  it as a privacy-friendly youtube-nocookie responsive embed when set.
--
--  RLS is unchanged: the existing "services write content" / read policies use
--  `for all`, so the new column is already governed. Idempotent.
-- ============================================================
alter table public.services add column if not exists video_url text;

-- verify
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'services' and column_name = 'video_url';
