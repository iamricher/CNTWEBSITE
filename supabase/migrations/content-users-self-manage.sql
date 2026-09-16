-- ============================================================
--  Let CONTENT MANAGERS manage other Content Studio users
--  (create / revoke content_manager logins) — not just super_admin.
--
--  Safe by construction — these policies let a content admin touch ONLY
--  content-domain profiles and ONLY toggle between content_manager and pending:
--    • USING  (old row) must already be content_manager OR pending
--        → cannot touch recruiters/account officers/super_admins (ATS users).
--    • CHECK  (new row) role must be content_manager OR pending
--        → cannot promote anyone to super_admin or any ATS role (no escalation).
--    • DELETE stays manager-only (revoke = set role back to 'pending', not delete).
--
--  super_admin keeps its existing broad "profiles ... mgr" policies (RLS is OR).
--  Idempotent.
-- ============================================================

-- List content_manager logins in the Content Studio → Users screen.
drop policy if exists "profiles content-admin read" on public.profiles;
create policy "profiles content-admin read" on public.profiles
  for select to authenticated
  using ( public.cnt_can_manage_content() and role = 'content_manager' );

-- Create (pending → content_manager) and revoke (content_manager → pending).
drop policy if exists "profiles content-admin manage" on public.profiles;
create policy "profiles content-admin manage" on public.profiles
  for update to authenticated
  using  ( public.cnt_can_manage_content() and role in ('content_manager','pending') )
  with check ( public.cnt_can_manage_content() and role in ('content_manager','pending') );

-- verify
select count(*) as content_managers from public.profiles where role='content_manager';
