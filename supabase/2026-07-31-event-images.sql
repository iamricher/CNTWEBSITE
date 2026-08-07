-- Public image bucket for Events & Updates (achievements, event photos).
-- Public = readable by anyone (the images appear on the public website); only
-- super_admin can upload/delete. Idempotent.

insert into storage.buckets (id, name, public) values ('event-images','event-images', true)
  on conflict (id) do nothing;
update storage.buckets
   set file_size_limit = 5242880,
       allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif']
 where id='event-images';

drop policy if exists "event img insert super" on storage.objects;
drop policy if exists "event img delete super" on storage.objects;
drop policy if exists "event img read all"     on storage.objects;
create policy "event img insert super" on storage.objects for insert to authenticated with check (bucket_id='event-images' and public.cnt_is_super_admin());
create policy "event img delete super" on storage.objects for delete to authenticated using (bucket_id='event-images' and public.cnt_is_super_admin());
create policy "event img read all"     on storage.objects for select to anon, authenticated using (bucket_id='event-images');

-- verify (expect 1)
select count(*) as bucket from storage.buckets where id='event-images';
