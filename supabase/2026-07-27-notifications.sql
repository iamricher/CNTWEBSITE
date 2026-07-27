-- Persistent notifications (roadmap #7).
--
-- Until now the client portal derived its "notifications" on every load and the
-- ATS had none at all — so a recruiter never learned when a client approved or
-- rejected the candidate they endorsed, and nothing had read/unread state or a
-- history. This adds a real notifications table with a recipient model.
--
-- Design mirrors the rest of the app's PII isolation: the table has RLS enabled
-- with NO policies, so it is reachable only through the SECURITY DEFINER RPCs
-- below. Recipients are targeted the way the app already identifies people —
-- clients by client_account, staff by recruiter full_name (null = all staff).
--
-- Run in Supabase → SQL Editor. No destructive operations. Also in schema.sql.

-- ── table ──────────────────────────────────────────────────────
create table if not exists public.notifications (
  id               bigint generated always as identity primary key,
  recipient_kind   text not null,           -- 'client' | 'staff'
  recipient_client text,                     -- client account (when kind='client')
  recipient_name   text,                     -- staff full_name (when kind='staff'); null = all staff
  kind             text not null,            -- endorsed | approved | rejected | filled | request
  title            text,
  body             text,
  ref_type         text,                     -- 'applicant' | 'vacancy' | 'request'
  ref_id           text,
  created_at       timestamptz default now(),
  read_at          timestamptz
);
create index if not exists notifications_client_idx
  on public.notifications (recipient_client, created_at desc) where recipient_kind='client';
create index if not exists notifications_staff_idx
  on public.notifications (recipient_name, created_at desc) where recipient_kind='staff';

alter table public.notifications enable row level security;
-- Intentionally no policies: only the SECURITY DEFINER RPCs below may touch it.

-- ── trigger: applications changes create notifications ─────────
-- Fires from every path that flips client_status (ATS endorse, the client
-- decide RPC), so the endorse → decide loop is captured in one place.
create or replace function public.cnt_app_notify() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  if TG_OP='UPDATE' and NEW.client_status is distinct from OLD.client_status then
    if NEW.client_status='endorsed' then
      insert into public.notifications(recipient_kind, recipient_client, kind, title, body, ref_type, ref_id)
      values ('client', NEW.client, 'endorsed', 'New candidate to review',
              coalesce(NEW.name,'A candidate')||' ('||coalesce(NEW.role,'—')||') is awaiting your decision.',
              'applicant', NEW.id::text);
    elsif NEW.client_status in ('approved','rejected') then
      insert into public.notifications(recipient_kind, recipient_name, kind, title, body, ref_type, ref_id)
      values ('staff', NEW.recruiter, NEW.client_status,
              'Client '||NEW.client_status,
              coalesce(NEW.client,'A client')||' '||NEW.client_status||' '||coalesce(NEW.name,'a candidate')
                ||case when NEW.client_status='rejected' and coalesce(NEW.client_reason,'')<>''
                       then ' — '||NEW.client_reason else '' end,
              'applicant', NEW.id::text);
    end if;
  end if;
  return NEW;
end; $$;

drop trigger if exists cnt_app_notify_trg on public.applications;
create trigger cnt_app_notify_trg after update on public.applications
  for each row execute function public.cnt_app_notify();

-- ── RPC: read my notifications ─────────────────────────────────
-- Audience is derived from the caller's own profile; a client sees only its
-- account's notifications, staff see ones addressed to them or broadcast.
create or replace function public.cnt_notifications(p_limit int default 30)
returns setof public.notifications
language plpgsql stable security definer set search_path=public as $$
declare acct text; nm text; r text;
begin
  select client_account, full_name, role into acct, nm, r
    from public.profiles where id=auth.uid();
  if acct is not null then
    return query select * from public.notifications
      where recipient_kind='client' and recipient_client=acct
      order by created_at desc limit greatest(1, least(coalesce(p_limit,30), 100));
  elsif r in ('super_admin','recruitment_manager','recruitment_supervisor','account_officer','recruiter') then
    return query select * from public.notifications
      where recipient_kind='staff' and (recipient_name is null or recipient_name=nm)
      order by created_at desc limit greatest(1, least(coalesce(p_limit,30), 100));
  end if;
  return;
end; $$;
revoke all on function public.cnt_notifications(int) from public, anon;
grant execute on function public.cnt_notifications(int) to authenticated;

-- ── RPC: mark read (one id, or all mine when null) ─────────────
create or replace function public.cnt_notifications_read(p_id bigint default null)
returns void language plpgsql security definer set search_path=public as $$
declare acct text; nm text; r text;
begin
  select client_account, full_name, role into acct, nm, r
    from public.profiles where id=auth.uid();
  update public.notifications set read_at=now()
   where read_at is null
     and (p_id is null or id=p_id)
     and ( (acct is not null and recipient_kind='client' and recipient_client=acct)
        or (acct is null and r in ('super_admin','recruitment_manager','recruitment_supervisor','account_officer','recruiter')
            and recipient_kind='staff' and (recipient_name is null or recipient_name=nm)) );
end; $$;
revoke all on function public.cnt_notifications_read(bigint) from public, anon;
grant execute on function public.cnt_notifications_read(bigint) to authenticated;

-- ── backfill: seed the client bell for already-endorsed candidates ──
insert into public.notifications(recipient_kind, recipient_client, kind, title, body, ref_type, ref_id, created_at)
select 'client', a.client, 'endorsed', 'New candidate to review',
       coalesce(a.name,'A candidate')||' ('||coalesce(a.role,'—')||') is awaiting your decision.',
       'applicant', a.id::text, coalesce(a.endorsed_at, now())
from public.applications a
where a.client_status='endorsed' and a.client is not null
  and not exists (select 1 from public.notifications n
                  where n.ref_type='applicant' and n.ref_id=a.id::text and n.kind='endorsed');

-- ── verify ─────────────────────────────────────────────────────
select (select count(*) from pg_class where relname='notifications') as tbl,           -- 1
       (select count(*) from pg_trigger where tgname='cnt_app_notify_trg') as trg,      -- 1
       (select count(*) from pg_proc where proname='cnt_notifications') as read_fn,     -- 1
       (select count(*) from pg_proc where proname='cnt_notifications_read') as mark_fn,-- 1
       (select count(*) from public.notifications) as seeded;
