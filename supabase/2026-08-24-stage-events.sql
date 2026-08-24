-- ============================================================
--  CNT — application stage timeline (for true time-to-hire & funnel)
--
--  Records WHEN each application entered each stage, so Content Studio can
--  measure real time-to-hire (apply → Job Offer), how long candidates sit in
--  each stage, and a historical pipeline funnel — none of which the current
--  single `stage` column can tell you.
--
--  A trigger logs a row on every insert and every stage change, no matter which
--  screen made it (careers form, kanban drag, list action), so history stays
--  complete without touching app code. Existing applications are backfilled
--  with one seed event from their created_at + current stage.
--
--  Run once in Supabase → SQL editor.
-- ============================================================
create table if not exists public.stage_events (
  id             bigint generated always as identity primary key,
  application_id bigint not null references public.applications(id) on delete cascade,
  stage          text   not null,
  entered_at     timestamptz not null default now(),
  created_at     timestamptz not null default now()
);
create index if not exists stage_events_app_idx   on public.stage_events (application_id, entered_at);
create index if not exists stage_events_stage_idx on public.stage_events (stage, entered_at);

-- Log a timeline row on create + whenever the stage actually changes.
create or replace function public.log_stage_event() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'INSERT') then
    insert into public.stage_events(application_id, stage, entered_at)
    values (new.id, coalesce(new.stage, 'new'), coalesce(new.created_at, now()));
  elsif (tg_op = 'UPDATE' and new.stage is distinct from old.stage) then
    insert into public.stage_events(application_id, stage, entered_at)
    values (new.id, new.stage, now());
  end if;
  return new;
end $$;

drop trigger if exists trg_log_stage_event on public.applications;
create trigger trg_log_stage_event
  after insert or update of stage on public.applications
  for each row execute function public.log_stage_event();

-- Backfill: one seed event per existing application (created_at + current stage).
insert into public.stage_events(application_id, stage, entered_at)
select a.id, coalesce(a.stage, 'new'), coalesce(a.created_at, now())
from public.applications a
where not exists (select 1 from public.stage_events se where se.application_id = a.id);

-- Staff may read the timeline; inserts happen only through the SECURITY DEFINER
-- trigger, so no client insert policy is needed.
alter table public.stage_events enable row level security;
drop policy if exists "stage_events staff read" on public.stage_events;
create policy "stage_events staff read" on public.stage_events
  for select using (public.cnt_is_staff());
