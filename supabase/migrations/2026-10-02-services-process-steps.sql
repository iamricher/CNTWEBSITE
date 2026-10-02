-- ============================================================
--  Per-service "How we work" process steps, editable in Content Studio.
--
--  process_steps : JSON array of { "h": "Step title", "p": "Description" }.
--  When empty, the service page falls back to its built-in default process
--  (PROCESS_BY_SLUG[slug] or the generic staffing steps), so nothing breaks.
--
--  Managed in Content Studio → Services. RLS unchanged (policies use `for all`).
--  Idempotent.
-- ============================================================
alter table public.services
  add column if not exists process_steps jsonb not null default '[]'::jsonb;

-- verify
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'services' and column_name = 'process_steps';
