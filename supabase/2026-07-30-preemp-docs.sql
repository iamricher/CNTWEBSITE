-- Pre-employment document uploads (turns the Background Check checklist into a
-- real 201-file). Persists the checklist ticks (previously in-memory only) and
-- stores an uploaded file path per requirement. Idempotent.

alter table public.applications
  add column if not exists requirements     jsonb not null default '{}'::jsonb,
  add column if not exists requirement_docs jsonb not null default '{}'::jsonb;

-- Private 'documents' bucket for requirement files: PDF, images (ID photos /
-- scanned clearances) and Word. Separate from 'resumes' (which stays PDF/DOC-only
-- for the public careers form).
insert into storage.buckets (id, name, public) values ('documents','documents',false)
  on conflict (id) do nothing;
update storage.buckets
   set file_size_limit = 5242880,
       allowed_mime_types = array['application/pdf','image/jpeg','image/png','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']
 where id='documents';

drop policy if exists "docs insert staff" on storage.objects;
drop policy if exists "docs read staff"   on storage.objects;
drop policy if exists "docs delete staff" on storage.objects;
create policy "docs insert staff" on storage.objects for insert to authenticated with check (bucket_id='documents' and public.cnt_is_staff());
create policy "docs read staff"   on storage.objects for select to authenticated using (bucket_id='documents' and public.cnt_is_staff());
create policy "docs delete staff" on storage.objects for delete to authenticated using (bucket_id='documents' and public.cnt_is_staff());

-- verify (cols=2, bucket=1)
select
  (select count(*) from information_schema.columns where table_schema='public' and table_name='applications' and column_name in ('requirements','requirement_docs')) as cols,
  (select count(*) from storage.buckets where id='documents') as bucket;
