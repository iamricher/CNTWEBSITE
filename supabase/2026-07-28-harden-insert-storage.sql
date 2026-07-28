-- Security hardening (from the strict audit):
--   #2  the public application insert accepted arbitrary column values, so a
--       direct anon call could create an application already 'hired'/'approved'/
--       'deployed', bypassing the whole workflow.
--   #3  résumé uploads had no size or type limit.
--
-- Run in Supabase → SQL Editor. Also mirrored in schema.sql.

-- ── #2  Split the insert policy ────────────────────────────────
-- Anon (the public careers form) may only create a FRESH application — never
-- pre-set stage/decision/workflow fields. Staff keep full insert.
drop policy if exists "apps insert public" on public.applications;
drop policy if exists "apps insert anon"   on public.applications;
drop policy if exists "apps insert staff"  on public.applications;

create policy "apps insert anon" on public.applications
  for insert to anon
  with check (
    coalesce(stage,'new')          = 'new'
    and coalesce(status,'active')  = 'active'
    and coalesce(client_status,'none') = 'none'
    and coalesce(priority,0)       = 0
    and endorsed_at            is null
    and decided_at             is null
    and client_reason          is null
    and refuse_reason          is null
    and confirmation_sent_at   is null
    and preemp_requirements_at is null
  );

create policy "apps insert staff" on public.applications
  for insert to authenticated
  with check (public.cnt_is_staff());

-- ── #3  Constrain résumé uploads ───────────────────────────────
-- 5 MB cap + CV file types only (the careers form accepts .pdf/.doc/.docx).
update storage.buckets
   set file_size_limit    = 5242880,
       allowed_mime_types = array[
         'application/pdf',
         'application/msword',
         'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
       ]
 where id = 'resumes';

-- ── verify (anon_insert=1, staff_insert=1, size=5242880) ───────
select
  (select count(*) from pg_policies where tablename='applications' and policyname='apps insert anon')  as anon_insert,
  (select count(*) from pg_policies where tablename='applications' and policyname='apps insert staff') as staff_insert,
  (select file_size_limit from storage.buckets where id='resumes')                                     as resume_size_limit;
