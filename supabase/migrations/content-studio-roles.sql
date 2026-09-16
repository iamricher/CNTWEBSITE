-- ============================================================
--  Separate Content Studio access from the ATS.
--
--  Adds a dedicated `content_manager` role that can run Content Studio but is
--  NOT an ATS user (recruiters/account officers/etc. can no longer touch
--  Content Studio, and content managers can't see ATS applicant data).
--
--  Access model:
--    • Content Studio  = super_admin OR content_manager  (cnt_can_manage_content)
--    • ATS             = cnt_is_staff (unchanged) — content_manager is NOT staff
--    • Content Studio users are created inside Content Studio by a super_admin
--      (super_admin is already a manager, so no profiles-policy change needed).
--
--  `profiles.role` is free text, so 'content_manager' needs no schema change.
--  Idempotent.
-- ============================================================

create or replace function public.cnt_can_manage_content()
returns boolean language sql stable security definer set search_path=public as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid() and role in ('super_admin','content_manager')
  )
$$;

-- ── Content tables: WRITE (for-all) → content managers ──────────────────────
-- (a for-all policy's USING also grants SELECT of every row, so content
--  managers can see drafts too — no separate read policy needed here.)
drop policy if exists "events write super" on public.events;
drop policy if exists "events write content" on public.events;
create policy "events write content" on public.events for all to authenticated
  using (public.cnt_can_manage_content()) with check (public.cnt_can_manage_content());

drop policy if exists "stories write super" on public.stories;
drop policy if exists "stories write content" on public.stories;
create policy "stories write content" on public.stories for all to authenticated
  using (public.cnt_can_manage_content()) with check (public.cnt_can_manage_content());

drop policy if exists "testi write super" on public.testimonials;
drop policy if exists "testi write content" on public.testimonials;
create policy "testi write content" on public.testimonials for all to authenticated
  using (public.cnt_can_manage_content()) with check (public.cnt_can_manage_content());

drop policy if exists "offices write super" on public.offices;
drop policy if exists "offices write content" on public.offices;
create policy "offices write content" on public.offices for all to authenticated
  using (public.cnt_can_manage_content()) with check (public.cnt_can_manage_content());

drop policy if exists "faqs staff write" on public.faqs;
drop policy if exists "faqs write content" on public.faqs;
create policy "faqs write content" on public.faqs for all to authenticated
  using (public.cnt_can_manage_content()) with check (public.cnt_can_manage_content());

drop policy if exists "team staff write" on public.team_members;
drop policy if exists "team write content" on public.team_members;
create policy "team write content" on public.team_members for all to authenticated
  using (public.cnt_can_manage_content()) with check (public.cnt_can_manage_content());

drop policy if exists "clients staff write" on public.clients;
drop policy if exists "clients write content" on public.clients;
create policy "clients write content" on public.clients for all to authenticated
  using (public.cnt_can_manage_content()) with check (public.cnt_can_manage_content());

drop policy if exists "legal staff write" on public.legal_pages;
drop policy if exists "legal write content" on public.legal_pages;
create policy "legal write content" on public.legal_pages for all to authenticated
  using (public.cnt_can_manage_content()) with check (public.cnt_can_manage_content());

-- ── Studio dashboard reads/manage: allow staff OR content managers ──────────
drop policy if exists "messages read staff" on public.messages;
create policy "messages read staff" on public.messages for select to authenticated
  using (public.cnt_is_staff() or public.cnt_can_manage_content());
drop policy if exists "messages update staff" on public.messages;
create policy "messages update staff" on public.messages for update to authenticated
  using (public.cnt_is_staff() or public.cnt_can_manage_content())
  with check (public.cnt_is_staff() or public.cnt_can_manage_content());
drop policy if exists "messages delete staff" on public.messages;
create policy "messages delete staff" on public.messages for delete to authenticated
  using (public.cnt_is_staff() or public.cnt_can_manage_content());

drop policy if exists "subscribers staff all" on public.subscribers;
create policy "subscribers staff all" on public.subscribers for all to authenticated
  using (public.cnt_is_staff() or public.cnt_can_manage_content())
  with check (public.cnt_is_staff() or public.cnt_can_manage_content());

drop policy if exists "page_views read staff" on public.page_views;
create policy "page_views read staff" on public.page_views for select to authenticated
  using (public.cnt_is_staff() or public.cnt_can_manage_content());

drop policy if exists "site_metrics read staff" on public.site_metrics;
create policy "site_metrics read staff" on public.site_metrics for select to authenticated
  using (public.cnt_is_staff() or public.cnt_can_manage_content());

drop policy if exists "audit read staff" on public.audit_log;
create policy "audit read staff" on public.audit_log for select to authenticated
  using (public.cnt_is_staff() or public.cnt_can_manage_content());
drop policy if exists "audit insert staff" on public.audit_log;
create policy "audit insert staff" on public.audit_log for insert to authenticated
  with check (public.cnt_is_staff() or public.cnt_can_manage_content());

-- ── event-images storage bucket: content managers can upload/remove ─────────
drop policy if exists "event img insert super" on storage.objects;
create policy "event img insert super" on storage.objects for insert to authenticated
  with check (bucket_id='event-images' and public.cnt_can_manage_content());
drop policy if exists "event img delete super" on storage.objects;
create policy "event img delete super" on storage.objects for delete to authenticated
  using (bucket_id='event-images' and public.cnt_can_manage_content());

-- verify
select
  (select count(*) from public.profiles where role='content_manager') as content_managers,
  public.cnt_can_manage_content() as i_can_manage_content;
