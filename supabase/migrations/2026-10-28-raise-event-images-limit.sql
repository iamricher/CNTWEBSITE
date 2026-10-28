-- Raise the event-images bucket file size limit from 5 MB to 25 MB so Content
-- Studio can upload larger photos (service heroes/galleries, events, stories, team).
-- Content-studio client checks were raised to 25 MB to match (content-studio.html).

update storage.buckets
   set file_size_limit = 26214400   -- 25 * 1024 * 1024
 where id = 'event-images';

-- verify (expect 26214400)
select id, file_size_limit from storage.buckets where id = 'event-images';
