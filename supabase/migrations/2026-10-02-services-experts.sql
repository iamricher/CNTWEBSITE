-- ============================================================
--  Per-service Experts / SMEs (photo + name) for the Services section.
--
--  Adds an optional `experts` JSON array to the services table. Each item is
--  { "name": "...", "photo": "<public url>" }. Managers add them in
--  Content Studio → Services → Experts/SMEs (upload a photo + type a name), and
--  service.html renders them as profile cards when present.
--
--  RLS is unchanged: the existing "services write content" / read policies use
--  `for all`, so the new column is already governed. Idempotent.
-- ============================================================
alter table public.services add column if not exists experts jsonb not null default '[]'::jsonb;

-- verify
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'services' and column_name = 'experts';
