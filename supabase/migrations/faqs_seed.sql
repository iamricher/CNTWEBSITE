-- ============================================================
--  Seed starter FAQs (editable templates) into Content Studio → FAQ.
--  Safe to run once; the WHERE NOT EXISTS guard means it only seeds when
--  the table is still empty, so re-running (or running after you've added
--  your own) will NOT create duplicates.
-- ============================================================

insert into public.faqs (question, answer, sort_order, published)
select v.question, v.answer, v.sort_order, true
from (values
  ('Is it free to apply for a job through CNT?',
   'Yes. Applying for a job through CNT Promo &amp; Ads Specialists, Inc. is <b>100% free</b>. We never ask jobseekers for placement fees, processing fees, training bonds, or any payment at any stage. If anyone using CNT''s name asks you for money, it is a scam — do not pay, and report it to <a href="mailto:hrdadmin@cntpromoads.com">hrdadmin@cntpromoads.com</a>.',
   1),
  ('How do I apply for a job?',
   'Go to our <a href="/careers">Careers</a> page, browse the open positions, click the role you''re interested in, and submit the online application with your details and CV. You''ll receive an email confirming that we received your application.',
   2),
  ('What are the basic requirements to apply?',
   'An updated resume or CV and a valid government-issued ID are the basics. Some roles need additional credentials such as an NBI clearance, TESDA National Certificate, or PRC license. The specific requirements are listed on each job posting.',
   3),
  ('How will I know the status of my application?',
   'After you apply you''ll get a confirmation email. You can check your progress anytime on our <a href="/status">Track My Application</a> page using the email you applied with. We also email you at each key step — screening, interview, job offer, and deployment.',
   4),
  ('How long does the hiring process take?',
   'It depends on the role and the client, but typically from a few days to a few weeks. The usual stages are application screening, interview, job offer, and deployment. We keep you updated by email as your application moves forward.',
   5),
  ('What types of jobs does CNT offer?',
   'We hire across many industries — retail and FMCG, technology, banking and finance, healthcare, logistics, government, and more — from entry-level and frontline roles to supervisory and management positions.',
   6),
  ('Where are the work locations?',
   'Openings are located across Metro Manila and key provinces throughout the Philippines. Each job posting shows its specific work location.',
   7),
  ('Is CNT a legitimate, licensed agency?',
   'Yes. CNT Promo &amp; Ads Specialists, Inc. is a duly registered Philippine corporation providing manpower, recruitment, and staffing services in compliance with the Department of Labor and Employment (DOLE). You can always verify openings and communications through this official website.',
   8),
  ('Does CNT charge employers or jobseekers?',
   'Jobseekers are never charged — our service to applicants is completely free. Companies partner with CNT for recruitment and staffing under a standard service agreement.',
   9),
  ('How can a company partner with CNT for hiring?',
   'Reach out through our <a href="/#contact">Contact</a> page or email <a href="mailto:hrdadmin@cntpromoads.com">hrdadmin@cntpromoads.com</a>. Our account team will get in touch to understand your workforce needs and propose the right staffing solution.',
   10),
  ('I received a suspicious message using CNT''s name — what should I do?',
   'Do not send money, and do not share sensitive documents. Legitimate CNT communications come only through this website and our official channels. Report anything suspicious to <a href="mailto:hrdadmin@cntpromoads.com">hrdadmin@cntpromoads.com</a> so we can act on it.',
   11)
) as v(question, answer, sort_order)
where not exists (select 1 from public.faqs);

-- verify
select count(*) as faq_rows from public.faqs;
