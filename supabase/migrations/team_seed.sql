-- ============================================================
--  Seed the leadership shown on /about as editable templates in
--  Content Studio → Team. Per-name guard: each exec is inserted only if a
--  member with that name doesn't already exist, so re-running is safe and it
--  won't duplicate or clobber members you've added yourself.
-- ============================================================

insert into public.team_members (name, role, photo_url, photo_pos, sort_order, published)
select v.name, v.role, v.photo_url, v.photo_pos, v.sort_order, true
from (values
  ('Atty. Cecilio Tobillo', 'President',                   '/assets/img/cecilio-tobillo.jpg', '50% 14%', 1),
  ('Paul Joseph Tobillo',   'VP, Chief Financial Officer', '/assets/img/pj-tobillo.jpg',       '50% 12%', 2)
) as v(name, role, photo_url, photo_pos, sort_order)
where not exists (select 1 from public.team_members t where t.name = v.name);

-- verify
select id, name, role, sort_order from public.team_members order by sort_order, created_at;
