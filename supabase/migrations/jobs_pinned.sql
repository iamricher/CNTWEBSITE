-- ============================================================
--  Pinned (priority) jobs — the HR director can pin a job so it floats to the
--  top of the public careers page and homepage "Latest Openings".
--  Toggled from the ATS job cards (cntTogglePin). Idempotent.
-- ============================================================
alter table public.jobs add column if not exists pinned boolean not null default false;

-- Fast "pinned first, newest first" ordering.
create index if not exists jobs_pinned_created_idx
  on public.jobs (pinned desc, created_at desc);

-- verify
select count(*) filter (where pinned) as pinned_jobs, count(*) as total_jobs from public.jobs;
