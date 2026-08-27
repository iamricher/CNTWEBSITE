-- Offices / Locations: the branch directory shown by the homepage locator and
-- the per-office pages, managed from Content Studio. Public reads VISIBLE rows;
-- only super_admin can create/edit/delete. Idempotent.
--
-- Depends on public.cnt_is_super_admin() (see 2026-07-31-events.sql).

create table if not exists public.offices (
  slug        text primary key,                 -- URL id, e.g. 'mandaluyong' (office?id=slug)
  name        text not null,
  role        text,                             -- 'Head Office' / 'Satellite Branch'
  region      text not null default 'luzon',    -- main | luzon | visayas | mindanao
  is_main     boolean not null default false,   -- the head office (logo marker on map)
  has_data    boolean not null default false,   -- full page ready? false = "coming soon"
  lat         double precision,
  lng         double precision,
  address     text,
  person      text,                             -- contact person (optional)
  phone       text,                             -- display, e.g. (02) 8293-5269
  tel         text,                             -- dial, e.g. +63282935269
  hours       text,                             -- multi-line ("\n" separated)
  email       text,
  email_note  text,                             -- e.g. "Temporary — dedicated email coming soon."
  maps        text,                             -- Google Maps share URL
  mapq        text,                             -- query for the embedded map iframe
  photos       jsonb not null default '[]'::jsonb, -- array of image URLs
  hero         text,                            -- cover photo shown as the hero banner (blends into the map)
  getting_there text,                           -- "Getting here" items, one per line
  amenities    jsonb not null default '[]'::jsonb, -- facilities/amenities tags
  sort_order   int not null default 0,
  visible      boolean not null default true,   -- uncheck to hide from the public site
  created_at   timestamptz default now()
);

-- add columns to tables created before they existed
alter table public.offices add column if not exists hero text;
alter table public.offices add column if not exists getting_there text;
alter table public.offices add column if not exists amenities jsonb not null default '[]'::jsonb;

alter table public.offices enable row level security;

drop policy if exists "offices read visible" on public.offices;
drop policy if exists "offices write super"  on public.offices;
-- Public + logged-in users read visible branches (coming-soon ones stay visible).
create policy "offices read visible" on public.offices for select to anon, authenticated using (visible = true);
-- Super admins have full access (this ALL policy also lets them read hidden rows).
create policy "offices write super"  on public.offices for all    to authenticated using (public.cnt_is_super_admin()) with check (public.cnt_is_super_admin());

-- ── Seed the current directory (idempotent; won't clobber edits made in Studio) ──
insert into public.offices (slug,name,role,region,is_main,has_data,lat,lng,address,phone,tel,hours,email,email_note,maps,mapq,photos,sort_order) values
  ('mandaluyong','Mandaluyong','Head Office','main',true,true,14.5774,121.0359,
   '219 LYFE Tower, Shaw Blvd. cor. E. Jacinto St., Brgy. Bagong Silang, 1550 Mandaluyong, Philippines',
   '(02) 8293-5269','+63282935269',
   E'Monday – Friday: 8:30 AM – 6:30 PM\nSaturday: 8:30 AM – 3:00 PM',
   'hrdadmin@cntpromoads.com','Temporary — a dedicated branch email is coming soon.',
   'https://maps.app.goo.gl/Ud5JvjJwZJmpBLyM7','219 LYFE Tower, Shaw Blvd, Mandaluyong',
   '["/assets/img/lyfe-tower-1.jpg","/assets/img/OFFFICE-LOBBY.jpg","/assets/img/POLARI-SUN.jpg","/assets/img/HALL-SUN.jpg","/assets/img/LOBBY-ESCALATOR.jpg"]'::jsonb, 0),
  ('pangasinan','Pangasinan','Satellite Branch','luzon',false,false,15.8949,120.2863,null,null,null,null,null,null,null,null,'[]'::jsonb,1),
  ('isabela','Isabela','Satellite Branch','luzon',false,false,16.9754,121.8107,null,null,null,null,null,null,null,null,'[]'::jsonb,2),
  ('bicol','Bicol','Satellite Branch','luzon',false,false,13.1391,123.7438,null,null,null,null,null,null,null,null,'[]'::jsonb,3),
  ('iloilo','Iloilo','Satellite Branch','visayas',false,false,10.7202,122.5621,null,null,null,null,null,null,null,null,'[]'::jsonb,4),
  ('cebu','Cebu','Satellite Branch','visayas',false,false,10.3157,123.8854,null,null,null,null,null,null,null,null,'[]'::jsonb,5),
  ('tacloban','Tacloban','Satellite Branch','visayas',false,false,11.2543,125.0038,null,null,null,null,null,null,null,null,'[]'::jsonb,6),
  ('davao','Davao','Satellite Branch','mindanao',false,false,7.1907,125.4553,null,null,null,null,null,null,null,null,'[]'::jsonb,7),
  ('cdo','Cagayan de Oro','Satellite Branch','mindanao',false,false,8.4542,124.6319,null,null,null,null,null,null,null,null,'[]'::jsonb,8)
on conflict (slug) do nothing;

-- verify (tbl=1, seeded=9)
select (select count(*) from information_schema.tables where table_schema='public' and table_name='offices') as tbl,
       (select count(*) from public.offices) as seeded;
