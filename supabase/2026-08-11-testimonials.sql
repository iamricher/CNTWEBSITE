-- Testimonials: client quotes shown on the homepage ("Trusted by Leaders Who
-- Hire Right"). Public reads only PUBLISHED rows; only super_admin can write.
-- Idempotent.

create table if not exists public.testimonials (
  id          bigint generated always as identity primary key,
  quote       text not null,
  author      text,          -- e.g. "Maria P."
  role        text,          -- e.g. "VP Human Resources, Leading Philippine Bank"
  rating      int  not null default 5,
  sort_order  int  default 0,
  published   boolean not null default true,
  created_at  timestamptz default now()
);

alter table public.testimonials enable row level security;

drop policy if exists "testi read published" on public.testimonials;
drop policy if exists "testi read staff"     on public.testimonials;
drop policy if exists "testi write super"    on public.testimonials;
create policy "testi read published" on public.testimonials for select to anon, authenticated using (published = true);
create policy "testi read staff"     on public.testimonials for select to authenticated using (public.cnt_is_staff());
create policy "testi write super"    on public.testimonials for all    to authenticated using (public.cnt_is_super_admin()) with check (public.cnt_is_super_admin());

-- verify (tbl=1)
select (select count(*) from information_schema.tables where table_schema='public' and table_name='testimonials') as tbl;
