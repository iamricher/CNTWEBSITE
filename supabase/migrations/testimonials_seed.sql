-- ============================================================
--  Seed DRAFT testimonial templates into Content Studio → Testimonials.
--  published = false, so NONE of these appear on the public site — they are
--  editable placeholders you replace with real client quotes, then publish.
--  Per-author guard: re-running won't duplicate, and it never touches your
--  own real testimonials.
-- ============================================================

insert into public.testimonials (quote, author, role, rating, sort_order, published)
select v.quote, v.author, v.role, v.rating, v.sort_order, false
from (values
  ('Replace this with a real client quote — what CNT delivered, the roles filled, speed, and results.',
   'Template — replace me (1)', 'Position · Company', 5, 1),
  ('Replace this with a real client quote — how partnering with CNT helped your hiring and operations.',
   'Template — replace me (2)', 'Position · Company', 5, 2),
  ('Replace this with a real client quote — why you would recommend CNT to other employers.',
   'Template — replace me (3)', 'Position · Company', 5, 3)
) as v(quote, author, role, rating, sort_order)
where not exists (select 1 from public.testimonials t where t.author = v.author);

-- verify
select id, author, published, sort_order from public.testimonials order by sort_order, created_at;
