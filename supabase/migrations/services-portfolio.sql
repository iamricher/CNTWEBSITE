-- Portfolio fields for service detail pages (editable in Content Studio → Services).
-- Each is a JSON array; empty by default so the page falls back to the built-in
-- draft copy until a content manager customizes the service.
--   who_for             : string[]  — audience chips ("Who it's for")
--   scope               : string[]  — capability checklist ("What's covered")
--   client_benefits     : string[]  — "For your business" bullets
--   applicant_benefits  : string[]  — "For candidates" bullets
--   stats               : {v,l}[]   — "By the numbers" band (value + label)

alter table public.services
  add column if not exists who_for            jsonb not null default '[]'::jsonb,
  add column if not exists scope              jsonb not null default '[]'::jsonb,
  add column if not exists client_benefits    jsonb not null default '[]'::jsonb,
  add column if not exists applicant_benefits jsonb not null default '[]'::jsonb,
  add column if not exists stats              jsonb not null default '[]'::jsonb;

-- No RLS changes needed: existing policies (public read published; cnt_can_manage_content
-- write) already cover these columns.
