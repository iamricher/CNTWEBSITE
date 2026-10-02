-- ============================================================
--  Per-service Testimonials + a Partners/"Trusted by" image.
--
--  testimonials : JSON array of { "quote": "...", "author": "..." } — shown as
--                 a quotes section on the service page.
--  partners_image : public URL (storage upload or a static /assets path) of a
--                 logo wall shown in a "Trusted by" section.
--
--  Managed in Content Studio → Services. RLS unchanged (policies use `for all`).
--  Idempotent.
-- ============================================================
alter table public.services
  add column if not exists testimonials   jsonb not null default '[]'::jsonb,
  add column if not exists partners_image text;

-- verify
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'services'
  and column_name in ('testimonials', 'partners_image')
order by column_name;
