-- Raise the event-images bucket file size limit to 50 MB so Content Studio can
-- upload large photos (service heroes/galleries, events, stories, team).
-- Content-studio client checks were raised to 50 MB to match (content-studio.html).

update storage.buckets
   set file_size_limit = 52428800   -- 50 * 1024 * 1024
 where id = 'event-images';

-- verify (expect 52428800)
select id, file_size_limit from storage.buckets where id = 'event-images';
