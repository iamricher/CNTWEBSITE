-- ============================================================
--  GO-LIVE migration — applies every pending change at once.
--  Run in Supabase → SQL Editor. Idempotent & additive; safe to
--  re-run. A "destructive operations" confirmation appears because
--  of the drop policy — that is expected; click Run query.
--  Everything here is also captured in schema.sql.
-- ============================================================

-- 1. interview_link column (online meeting link) -------------
alter table public.applications add column if not exists interview_link text;

-- 2. Client CV access fix ------------------------------------
--  Ownership check must run in a SECURITY DEFINER function, else the
--  storage policy's read of applications is blocked by that table's RLS
--  and no CV ever loads for a client.
create or replace function public.cnt_client_can_read_cv(p_path text)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(
    select 1 from public.applications a
    where a.resume_url = p_path
      and a.client = public.cnt_client_account()
      and a.client_status in ('endorsed','approved','rejected')
  );
$$;
revoke all on function public.cnt_client_can_read_cv(text) from public, anon;
grant execute on function public.cnt_client_can_read_cv(text) to authenticated;

drop policy if exists "resumes read client" on storage.objects;
create policy "resumes read client" on storage.objects for select to authenticated
  using (bucket_id='resumes' and public.cnt_client_can_read_cv(storage.objects.name));

-- 3. Client audit logging (RA 10173 accountability) ----------
create or replace function public.cnt_client_log(p_action text, p_ref text default null)
returns void language plpgsql security definer set search_path=public as $$
declare acct text;
begin
  acct := public.cnt_client_account();
  if acct is null then return; end if;
  insert into public.audit_log(actor_email, actor_role, action, entity, entity_ref, details)
  values ((select email from public.profiles where id=auth.uid()), 'client',
          left(coalesce(p_action,'client_event'),40), 'client_portal', left(p_ref,120), acct);
end;
$$;
revoke all on function public.cnt_client_log(text, text) from public, anon;
grant execute on function public.cnt_client_log(text, text) to authenticated;

create or replace function public.cnt_client_decide(app_id bigint, decision text, reason text default null)
returns text language plpgsql security definer set search_path=public as $$
declare acct text; cur text;
begin
  acct := public.cnt_client_account();
  if acct is null then raise exception 'Not a client account'; end if;
  if decision not in ('approved','rejected') then raise exception 'Invalid decision'; end if;
  select client_status into cur from public.applications where id=app_id and client=acct for update;
  if cur is null then raise exception 'Candidate not found for your account'; end if;
  if cur <> 'endorsed' then raise exception 'Candidate is not awaiting your decision'; end if;
  update public.applications
    set client_status=decision, decided_at=now(),
        client_reason=case when decision='rejected' then reason else null end
    where id=app_id and client=acct;
  insert into public.audit_log(actor_email, actor_role, action, entity, entity_ref, details)
  values ((select email from public.profiles where id=auth.uid()), 'client',
          'client_'||decision, 'applicant', app_id::text, acct||coalesce(' — '||reason,''));
  return decision;
end;
$$;
revoke all on function public.cnt_client_decide(bigint, text, text) from public, anon;
grant execute on function public.cnt_client_decide(bigint, text, text) to authenticated;

-- 4. Backfill old interview labels to the new vocabulary -----
--  Kind (medium): Phone Call | Video | Onsite / Face-to-Face Interview
update public.applications set interview_type='Phone Call'                      where interview_type='Phone Interview';
update public.applications set interview_type='Video'                           where interview_type='Video Interview';
update public.applications set interview_type='Onsite / Face-to-Face Interview' where interview_type in ('Face-to-Face Interview','Panel Interview');
--  Round (stage): Initial | Second | Client | Final
update public.applications set interview_round='Initial Interview' where interview_round='1st Interview';
update public.applications set interview_round='Second Interview'  where interview_round in ('2nd Interview','3rd Interview');
-- 'Final Interview' and 'Client Interview' already match the new vocabulary.

-- 5. Verify --------------------------------------------------
select
  (select count(*) from information_schema.columns where table_name='applications' and column_name='interview_link') as interview_link,
  (select count(*) from pg_proc where proname='cnt_client_can_read_cv')                                              as cv_fn,
  (select count(*) from pg_policies where tablename='objects' and policyname='resumes read client')                  as cv_policy,
  (select count(*) from pg_proc where proname='cnt_client_log')                                                      as log_fn,
  (select count(*) from public.applications where interview_type in ('Phone Interview','Video Interview','Face-to-Face Interview','Panel Interview')) as old_kinds_left,
  (select count(*) from public.applications where interview_round in ('1st Interview','2nd Interview','3rd Interview')) as old_rounds_left;
