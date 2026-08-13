-- Contact-form messages + newsletter subscribers.
-- Anonymous visitors can only INSERT (submit the public forms); only staff can
-- read and manage. Idempotent.

-- Contact messages ───────────────────────────────────────────────
create table if not exists public.messages (
  id         bigint generated always as identity primary key,
  name       text,
  email      text,
  company    text,
  subject    text,          -- inquiry type
  message    text not null,
  handled    boolean not null default false,
  created_at timestamptz default now()
);
alter table public.messages enable row level security;
drop policy if exists "messages insert anon"  on public.messages;
drop policy if exists "messages read staff"   on public.messages;
drop policy if exists "messages update staff" on public.messages;
drop policy if exists "messages delete staff" on public.messages;
create policy "messages insert anon"  on public.messages for insert to anon, authenticated with check (true);
create policy "messages read staff"   on public.messages for select to authenticated using (public.cnt_is_staff());
create policy "messages update staff" on public.messages for update to authenticated using (public.cnt_is_staff()) with check (public.cnt_is_staff());
create policy "messages delete staff" on public.messages for delete to authenticated using (public.cnt_is_staff());

-- Newsletter subscribers ─────────────────────────────────────────
create table if not exists public.newsletter_subscribers (
  id         bigint generated always as identity primary key,
  email      text not null unique,
  created_at timestamptz default now()
);
alter table public.newsletter_subscribers enable row level security;
drop policy if exists "newsletter insert anon"  on public.newsletter_subscribers;
drop policy if exists "newsletter read staff"   on public.newsletter_subscribers;
drop policy if exists "newsletter delete staff" on public.newsletter_subscribers;
create policy "newsletter insert anon"  on public.newsletter_subscribers for insert to anon, authenticated with check (true);
create policy "newsletter read staff"   on public.newsletter_subscribers for select to authenticated using (public.cnt_is_staff());
create policy "newsletter delete staff" on public.newsletter_subscribers for delete to authenticated using (public.cnt_is_staff());

-- verify (both = 1)
select (select count(*) from information_schema.tables where table_schema='public' and table_name='messages') as messages_tbl,
       (select count(*) from information_schema.tables where table_schema='public' and table_name='newsletter_subscribers') as newsletter_tbl;
