-- ============================================================
--  CNT — client-capped salary for job postings
--
--  Adds the Base Salary and the Client Maximum Salary to each posting. The ATS
--  auto-generates a ±10% range from the base and HARD-CAPS the maximum at the
--  client's approved figure — the public salary_range, candidate offers and the
--  final compensation may never exceed it. See the salary-cap logic in the ATS
--  (assets/ats-ui.js / assets/ats-data.js).
--
--  Run once in Supabase → SQL editor.
-- ============================================================
alter table public.jobs add column if not exists base_salary       numeric;   -- target base (₱/month)
alter table public.jobs add column if not exists client_max_salary numeric;   -- HARD cap — never exceed
