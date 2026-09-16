-- ============================================================
--  Job Alerts — extend auto-notify to NEW job postings.
--
--  When a recruiter posts a new OPEN job in the ATS, the site emails every
--  active subscriber (see api/notify-subscribers.js, type='job'). This adds the
--  same one-shot guard the events table already has, so re-saving/editing a job
--  never re-blasts subscribers. Idempotent.
-- ============================================================
alter table public.jobs add column if not exists notified_at timestamptz;

-- verify
select count(*) as jobs_count from public.jobs;
