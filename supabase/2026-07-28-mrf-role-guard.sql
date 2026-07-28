-- #4 (audit): enforce "only the Account Officer approves MRFs / assigns
-- recruiters" at the DATABASE level, not just in the UI. The hr-staff RLS
-- policy lets any staff UPDATE hiring_requests, so the client-side gate was
-- bypassable via the API. A BEFORE UPDATE trigger closes that.
--
-- Guarded transitions: approving (Pending → Open) and changing the assigned
-- recruiter. Other edits (marking Filled, notes, priority, deadline) stay open
-- to any staff. super_admin (owner) is allowed; service/system context (no
-- auth.uid) passes through. Run in Supabase → SQL Editor. Also in schema.sql.

create or replace function public.cnt_mrf_guard() returns trigger
language plpgsql security definer set search_path=public as $$
declare r text;
begin
  if auth.uid() is null then return NEW; end if;      -- system/service context
  select role into r from public.profiles where id = auth.uid();
  if ( (NEW.assigned_to   is distinct from OLD.assigned_to)
    or (NEW.assigned_name is distinct from OLD.assigned_name)
    or (OLD.status = 'Pending' and NEW.status = 'Open') )
     and coalesce(r,'') not in ('account_officer','super_admin') then
    raise exception 'Only the Account Officer may approve MRFs or assign recruiters';
  end if;
  return NEW;
end; $$;

drop trigger if exists cnt_mrf_guard_trg on public.hiring_requests;
create trigger cnt_mrf_guard_trg before update on public.hiring_requests
  for each row execute function public.cnt_mrf_guard();

-- verify (fn=1, trg=1)
select (select count(*) from pg_proc    where proname='cnt_mrf_guard')       as fn,
       (select count(*) from pg_trigger where tgname='cnt_mrf_guard_trg')    as trg;
