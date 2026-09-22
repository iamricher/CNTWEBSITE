-- Success Stories → give each story its own detail page, like events.
-- Adds a full write-up (body) and a photo gallery (images). Idempotent.
-- Reuses the public 'event-images' storage bucket for the gallery photos.

alter table public.stories add column if not exists body   text;
alter table public.stories add column if not exists images jsonb not null default '[]'::jsonb;

-- verify (expect 2 — body + images both present)
select count(*) as cols
  from information_schema.columns
 where table_schema='public' and table_name='stories'
   and column_name in ('body','images');
