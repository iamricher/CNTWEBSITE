-- ============================================================
--  Let all staff delete applicants (not just managers).
--
--  The applications table already allowed any staff member to INSERT and
--  UPDATE rows, but DELETE was restricted to manager-level roles
--  (cnt_is_manager). That made a recruiter's "Remove" silently fail: RLS
--  filters the row out of the DELETE (0 rows, no error), the UI removes it
--  optimistically, and it reappears on the next load.
--
--  Bring DELETE in line with INSERT/UPDATE — any staff member may delete.
--  Idempotent.
-- ============================================================

drop policy if exists "apps delete mgr"   on public.applications;
drop policy if exists "apps delete staff" on public.applications;
create policy "apps delete staff" on public.applications
  for delete to authenticated using (public.cnt_is_staff());

-- verify
select policyname, cmd, qual
from pg_policies
where tablename = 'applications' and cmd = 'DELETE';
