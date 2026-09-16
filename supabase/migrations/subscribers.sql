-- ============================================================
--  Job Alerts / Announcement subscribers for Content Studio.
--
--  Visitors subscribe with their email (homepage "Stay in the loop" band).
--  When staff publishes a new post in Content Studio, the site emails every
--  active subscriber automatically (see api/notify-subscribers.js).
--
--  Security model:
--   • The public NEVER touches this table directly. Anonymous visitors call
--     two SECURITY DEFINER helpers only — cnt_subscribe() and cnt_unsubscribe()
--     — so they can add themselves or opt out, but can never read the list or
--     harvest emails.
--   • Staff (cnt_is_staff) can read/manage rows for the admin + the notify job.
--  Idempotent.
-- ============================================================

create table if not exists public.subscribers (
  id                bigint generated always as identity primary key,
  email             text        not null,
  name              text,
  source            text,                              -- e.g. 'homepage'
  active            boolean     not null default true, -- false once unsubscribed
  unsubscribe_token uuid        not null default gen_random_uuid(),
  confirmed_at      timestamptz,                       -- reserved for future double opt-in
  created_at        timestamptz not null default now(),
  unsubscribed_at   timestamptz
);

-- One row per address (case-insensitive), so re-subscribing reactivates.
create unique index if not exists subscribers_email_key
  on public.subscribers (lower(email));
create index if not exists subscribers_active_idx
  on public.subscribers (active) where active = true;

alter table public.subscribers enable row level security;

-- No public policies at all: anon reaches this table only through the two
-- SECURITY DEFINER functions below. Staff may read + manage everything.
drop policy if exists "subscribers staff all" on public.subscribers;
create policy "subscribers staff all" on public.subscribers
  for all using (public.cnt_is_staff()) with check (public.cnt_is_staff());

-- ── Public entry points (SECURITY DEFINER — run as owner, bypass RLS) ──

-- Add / reactivate a subscriber. Safe to call repeatedly; never leaks whether
-- the address already existed. Returns nothing (void) to avoid enumeration.
create or replace function public.cnt_subscribe(p_email text, p_name text default null, p_source text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(p_email));
begin
  if v_email is null or v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then
    raise exception 'invalid email' using errcode = '22023';
  end if;
  insert into public.subscribers (email, name, source)
  values (v_email, nullif(trim(coalesce(p_name,'')),''), nullif(trim(coalesce(p_source,'')),''))
  on conflict (lower(email)) do update
    set active = true,
        unsubscribed_at = null,
        name = coalesce(excluded.name, public.subscribers.name),
        source = coalesce(excluded.source, public.subscribers.source);
end;
$$;

-- Opt out via the one-click token embedded in every email. Idempotent.
create or replace function public.cnt_unsubscribe(p_token uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare v_found boolean;
begin
  update public.subscribers
    set active = false, unsubscribed_at = now()
    where unsubscribe_token = p_token
    returning true into v_found;
  return coalesce(v_found, false);
end;
$$;

revoke all on function public.cnt_subscribe(text, text, text) from public;
revoke all on function public.cnt_unsubscribe(uuid) from public;
grant execute on function public.cnt_subscribe(text, text, text) to anon, authenticated;
grant execute on function public.cnt_unsubscribe(uuid) to anon, authenticated;

-- ── Guard on events: remember when subscribers were notified, so editing a
--    post later never re-blasts everyone. api/notify-subscribers.js sets this. ──
alter table public.events add column if not exists notified_at timestamptz;

-- verify
select count(*) as subscriber_count from public.subscribers;
