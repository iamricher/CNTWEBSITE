-- Traffic-source analytics: record the external referrer host per page view.
alter table public.page_views add column if not exists referrer text;
