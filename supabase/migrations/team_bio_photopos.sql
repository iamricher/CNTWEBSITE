-- ============================================================
--  Team members: add optional short bio + photo focus (crop position)
--  Run once in Supabase → SQL Editor. Safe to re-run (IF NOT EXISTS).
--  Existing rows keep working: bio stays null, and about.html falls back
--  to a face/top crop ('50% 20%') when photo_pos is null.
-- ============================================================

alter table public.team_members add column if not exists bio       text;
alter table public.team_members add column if not exists photo_pos text;
