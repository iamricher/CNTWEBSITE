-- ============================================================
--  Client portal → monitoring-only  (run once in the Supabase SQL editor)
--  Dashboard → SQL Editor → paste → Run. Idempotent & additive; safe to re-run.
--
--  Change of direction: clients no longer endorse/approve/reject candidates and
--  no longer file vacancies. The portal is now READ-ONLY monitoring — a client
--  sees every applicant tied to their account and where each one is in the
--  recruitment pipeline, fully ANONYMISED (no name / email / phone / CV).
--
--  This migration:
--    1. Rewrites cnt_client_candidates() to return an anonymised column set +
--       the pipeline stage, for ALL applicants of the caller's account (the old
--       "endorsed/approved/rejected only" filter is gone).
--    2. Adds cnt_client_stages() so the portal can draw the pipeline tracker.
--    3. Retires the client's write path and CV access: drops cnt_client_decide,
--       cnt_client_can_read_cv, the client CV storage policy, and the client
--       hiring_requests policies (no more vacancy filing).
--    cnt_client_account() and cnt_client_log() are unchanged and still used.
--  Everything here is mirrored in supabase/schema.sql.
-- ============================================================

-- 1. Anonymised monitoring read path -------------------------------
-- The ONLY read a client has into applications. Its WHERE clause is the
-- security boundary (own account only). It selects NO direct-identifier columns
-- (name, email, phone, linkedin, referred_by, resume_url, cover_note,
-- proposed_salary) so PII cannot leak even via raw network inspection — the
-- fixed column list in this function body is the guarantee.
-- drop first: the return signature changed and CREATE OR REPLACE cannot change
-- a function's return type. The SQL editor shows a "destructive operations"
-- confirmation because of the drop — that is expected; confirm it.
drop function if exists public.cnt_client_candidates();
create or replace function public.cnt_client_candidates()
returns table (
  id bigint, role text, location text, applied_date date,
  tags text, degree text, medium text, priority int,
  stage text, stage_label text, stage_seq int, is_hired boolean
) language sql stable security definer set search_path=public as $$
  select a.id, a.role, a.location, a.applied_date,
         a.tags, a.degree, a.medium, a.priority,
         a.stage,
         coalesce(s.name, initcap(replace(a.stage,'_',' ')), 'Applied') as stage_label,
         coalesce(s.sequence, 0) as stage_seq,
         coalesce(s.is_hired, false) as is_hired
  from public.applications a
  left join public.stages s on s.key = a.stage
  where public.cnt_client_account() is not null
    and a.client = public.cnt_client_account()
$$;
revoke all on function public.cnt_client_candidates() from public, anon;
grant execute on function public.cnt_client_candidates() to authenticated;

-- 2. Pipeline stages for the tracker (non-sensitive taxonomy) ------
-- Lets the portal show the full ordered pipeline and highlight where each
-- candidate is. No PII; any authenticated client may read the stage list.
drop function if exists public.cnt_client_stages();
create or replace function public.cnt_client_stages()
returns table ( key text, name text, sequence int, is_hired boolean )
language sql stable security definer set search_path=public as $$
  select s.key, s.name, coalesce(s.sequence,0) as sequence, coalesce(s.is_hired,false) as is_hired
  from public.stages s
  where coalesce(s.folded,false) = false
  order by s.sequence
$$;
revoke all on function public.cnt_client_stages() from public, anon;
grant execute on function public.cnt_client_stages() to authenticated;

-- 3. Retire the client write path + CV access + vacancy filing ------
-- Clients decide nothing now, so their only application write and their CV read
-- are removed. Dropping them shrinks the attack surface.
drop function if exists public.cnt_client_decide(bigint, text, text);

drop policy if exists "resumes read client" on storage.objects;
drop function if exists public.cnt_client_can_read_cv(text);

-- No more client-filed vacancies: remove both client hiring_requests policies.
-- Staff keep full control via "hr staff all" (unchanged).
drop policy if exists "hr client insert" on public.hiring_requests;
drop policy if exists "hr client read"   on public.hiring_requests;

-- 4. Verify --------------------------------------------------------
--  Expect: read RPC present, stages RPC present, decide RPC gone (0).
select
  (select count(*) from pg_proc where proname='cnt_client_candidates') as has_read_rpc,
  (select count(*) from pg_proc where proname='cnt_client_stages')     as has_stages_rpc,
  (select count(*) from pg_proc where proname='cnt_client_decide')     as decide_rpc_should_be_0;
