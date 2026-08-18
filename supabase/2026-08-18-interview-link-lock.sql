-- ============================================================
--  Server-side lock for the generated interview meeting link.
--
--  Mirrors the ATS UI rule (assets/ats-ui.js): once applications.interview_link
--  holds an ONLINE MEETING URL (http/https), only a Super Admin may change or
--  clear it. A physical venue (plain text, not a URL) stays freely editable, so
--  the first-time set of a link is allowed for any staff member — only later
--  edits to an existing link are locked.
--
--  RLS is row-level and can't make a single column immutable-except-for-a-role,
--  so this is enforced with a BEFORE UPDATE trigger. It calls the existing
--  cnt_is_super_admin() helper, which reads the caller's profile via auth.uid().
--  Idempotent.
-- ============================================================

create or replace function public.cnt_guard_interview_link()
returns trigger
language plpgsql
as $$
begin
  -- Only act when interview_link is actually changing.
  if new.interview_link is distinct from old.interview_link then
    -- Locked only when the EXISTING value is a real meeting link (a URL).
    -- If the old value is null / blank / a plain-text venue, the change is a
    -- first-time link or a venue edit — allowed for any staff member.
    if old.interview_link ~* '^\s*https?://' and not public.cnt_is_super_admin() then
      raise exception 'interview_link is locked — only a Super Admin can change the generated interview link'
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists cnt_guard_interview_link on public.applications;
create trigger cnt_guard_interview_link
  before update of interview_link on public.applications
  for each row
  execute function public.cnt_guard_interview_link();

-- verify
select
  (select count(*) from pg_proc    where proname = 'cnt_guard_interview_link') as fn,
  (select count(*) from pg_trigger where tgname  = 'cnt_guard_interview_link') as trg;
