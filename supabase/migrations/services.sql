-- ============================================================
--  Services manager for Content Studio.
--  Public reads published rows; content managers (cnt_can_manage_content) write.
--  Powers the per-service detail pages (service.html?s=<slug>) and the services
--  overview cards. Then seeds the 9 services that were hardcoded. Idempotent.
-- ============================================================

create table if not exists public.services (
  id          bigint generated always as identity primary key,
  slug        text    not null unique,     -- e.g. 'training' → /service?s=training
  category    text,                        -- Staffing Solutions | Corporate Services | Talent Solutions
  title       text    not null,
  red_word    text,                        -- word within the title shown in the brand gradient
  tagline     text,                        -- hero sub-line
  overview    text,                        -- "What this covers" paragraph
  icon        text,                        -- icon key: search|team|badge|people|peso|shield|cap|verify|chart
  image_url   text,                        -- optional hero photo (Content Studio upload)
  highlights  jsonb   not null default '[]'::jsonb,  -- [{"t":"...","d":"..."}, ...]
  sort_order  int     not null default 0,
  published   boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.services enable row level security;

drop policy if exists "services public read" on public.services;
drop policy if exists "services write content" on public.services;
create policy "services public read" on public.services
  for select using (published = true);
create policy "services write content" on public.services
  for all to authenticated using (public.cnt_can_manage_content()) with check (public.cnt_can_manage_content());

-- Seed the previously-hardcoded services (guarded by slug so re-runs don't
-- duplicate and your own edits are never overwritten).
insert into public.services (slug, category, title, red_word, tagline, overview, icon, highlights, sort_order)
select v.slug, v.category, v.title, v.red_word, v.tagline, v.overview, v.icon, v.highlights::jsonb, v.sort_order
from (values
  ('executive-search','Staffing Solutions','Executive Search','Search',
   'Discreet, research-driven headhunting for the C-suite, director, and senior-management roles you can’t afford to get wrong.',
   'A single mis-hire at the top is one of the most expensive mistakes a business can make. Our executive search practice runs a confidential, structured process — mapping the market, engaging passive leaders, and assessing them rigorously — so you meet only a tight shortlist of people who can genuinely do the job and fit the culture.',
   'search',
   '[{"t":"Confidential search & market mapping","d":"We identify and approach leaders discreetly — including passive candidates who aren’t actively looking."},{"t":"Rigorous assessment & referencing","d":"Structured, competency-based interviews plus thorough reference and track-record checks."},{"t":"Pre-qualified shortlist","d":"You review only a short list of vetted, genuinely interested candidates — no noise."},{"t":"Post-placement follow-through","d":"We stay engaged through onboarding to protect the placement and ensure a lasting fit."}]',1),
  ('mass-hiring','Staffing Solutions','Mass & Bulk Hiring','Bulk Hiring',
   'Large-scale recruitment campaigns managed end to end — scale your workforce fast without sacrificing candidate quality.',
   'Opening a branch, ramping for peak season, or standing up a new account? We run high-volume hiring as a managed campaign: nationwide sourcing, a screening pipeline built for volume, and job fairs and walk-in drives — all tracked so your time-to-fill stays fast and predictable.',
   'team',
   '[{"t":"Nationwide sourcing reach","d":"Metro Manila, Luzon, Visayas, and Mindanao — online, referral, and on-ground channels."},{"t":"High-volume screening pipeline","d":"A structured funnel that filters hundreds of applicants down to qualified, deployable hires."},{"t":"Job fairs & walk-in drives","d":"On-site and mall-based hiring events that put your brand in front of talent fast."},{"t":"Fast, predictable time-to-fill","d":"Clear headcount targets and reporting so you always know where the campaign stands."}]',2),
  ('contractual-staffing','Staffing Solutions','Contractual Staffing','Staffing',
   'Project-based, seasonal, and contractual deployment — a fully managed engagement, from payroll to labor compliance.',
   'Flex your headcount up or down without the administrative load. We deploy contractual and project-based staff under a fully managed engagement — we handle the payroll, statutory benefits, and DOLE-compliant contracts, so you get the people you need with the paperwork handled correctly.',
   'badge',
   '[{"t":"Flexible, scalable headcount","d":"Add or reduce staff for projects, seasons, or ramp-ups — without long-term overhead."},{"t":"Fully managed engagement","d":"We own the employment relationship, timekeeping, and day-to-day HR admin."},{"t":"Payroll & benefits handled","d":"Salaries, SSS, PhilHealth, Pag-IBIG, and 13th-month all processed on time."},{"t":"DOLE-compliant contracts","d":"Engagements structured to align with Philippine labor regulations."}]',3),
  ('hr-outsourcing','Corporate Services','HR Outsourcing','Outsourcing',
   'Full-service HR function management — from recruitment and onboarding to performance and employee relations.',
   'Hand the weight of day-to-day people operations to a partner who does it every day. We run your HR function — or the parts you choose — accurately and on time, so your leaders can focus on the business instead of the admin.',
   'people',
   '[{"t":"End-to-end people operations","d":"Recruitment, onboarding, records, and offboarding managed as one service."},{"t":"Onboarding & records management","d":"201 files, contracts, and employee data kept organized and audit-ready."},{"t":"Performance & employee relations","d":"Support for appraisals, discipline, and day-to-day employee concerns."},{"t":"Lower overhead, less admin","d":"A leaner internal team and predictable HR cost."}]',4),
  ('payroll','Corporate Services','Payroll Management','Management',
   'Accurate, on-time, fully compliant payroll for your entire workforce — down to the last government remittance.',
   'Payroll errors cost trust and money. We run your payroll precisely and on schedule, with every statutory computation and remittance handled — so your people are paid correctly and your business stays compliant.',
   'peso',
   '[{"t":"Timely salary disbursement","d":"Cut-offs and pay dates hit consistently, every cycle."},{"t":"Statutory computations","d":"SSS, PhilHealth, Pag-IBIG, and BIR withholding computed correctly."},{"t":"Payslip generation","d":"Clear, itemized payslips for every employee, every payout."},{"t":"Government remittances filed","d":"Contributions and taxes remitted and reported on deadline."}]',5),
  ('compliance','Corporate Services','Compliance Advisory','Advisory',
   'Practical guidance on DOLE and Philippine labor law so your operations stay protected and audit-ready.',
   'Labor rules change and mistakes are costly. Our advisory keeps your contracts, policies, and practices aligned with current regulations — practical guidance you can actually apply, not just a legal memo.',
   'shield',
   '[{"t":"Labor law advisory","d":"Plain-language guidance on DOLE rules and how they apply to your setup."},{"t":"Contract & policy review","d":"Employment contracts and handbooks reviewed for compliance and clarity."},{"t":"DOLE compliance support","d":"Preparation and support for inspections and reportorial requirements."},{"t":"Risk mitigation","d":"Spot and close gaps before they become disputes or penalties."}]',6),
  ('training','Talent Solutions','Training & Development','Development',
   'Upskilling programs that raise the performance and retention of your workforce — from new-hire orientation to leadership.',
   'People perform better when they’re set up to succeed. We design and run training that lifts capability and keeps good people longer — starting at onboarding and extending to product knowledge, service standards, and leadership growth.',
   'cap',
   '[{"t":"Onboarding & orientation","d":"New hires get up to speed on the role, brand, and standards from day one."},{"t":"Skills & product training","d":"Role-specific and product knowledge sessions that show up in performance."},{"t":"Leadership development","d":"Grow supervisors and managers who can lead teams, not just do tasks."},{"t":"Customized modules","d":"Programs built around your business, accounts, and goals — not off-the-shelf."}]',7),
  ('background-screening','Talent Solutions','Background Screening','Screening',
   'Thorough pre-employment verification so every hire is someone you can trust from day one.',
   'Trust starts before day one. We verify the people you’re about to bring on board — employment, education, character, and clearances — with a fast turnaround that doesn’t slow your hiring down.',
   'verify',
   '[{"t":"Employment & education checks","d":"Confirm work history and credentials against what candidates declared."},{"t":"Character & reference checks","d":"Structured references that surface how someone actually works."},{"t":"NBI / clearance verification","d":"Validate NBI and other clearances as part of onboarding."},{"t":"Fast turnaround","d":"Results delivered quickly so verified hires can start on schedule."}]',8),
  ('consulting','Talent Solutions','Workforce Consulting','Consulting',
   'Strategic workforce planning aligned to your business goals — so you scale with the right people at the right time.',
   'Hiring is easier when it’s planned. We help you map the workforce your strategy actually needs — the roles, the structure, the market rates, and the timing — so growth doesn’t outrun your people plan.',
   'chart',
   '[{"t":"Manpower planning","d":"Forecast the headcount and roles your targets will require."},{"t":"Org & role design","d":"Structures and role definitions that scale cleanly as you grow."},{"t":"Market & salary benchmarking","d":"Know what talent costs so your offers land competitively."},{"t":"Scalability strategy","d":"A staffing plan that keeps pace with expansion."}]',9)
) as v(slug, category, title, red_word, tagline, overview, icon, highlights, sort_order)
where not exists (select 1 from public.services s where s.slug = v.slug);

-- verify
select slug, title, sort_order, published, jsonb_array_length(highlights) as n_highlights from public.services order by sort_order;
