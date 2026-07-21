# Client Portal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give clients a separate portal (`client.html`) to file vacancies and approve/reject candidates a recruiter has endorsed to them, without ever exposing applicant PII.

**Architecture:** New standalone page sharing the existing Supabase project. Clients are `role='client'` accounts scoped to one `client_account`. They never `SELECT` `applications` directly — an anonymised `SECURITY DEFINER` RPC reads endorsed candidates and a second RPC records the decision. Vacancies use plain RLS on `hiring_requests`. Staff become endorse-only.

**Tech Stack:** Single-file static HTML + Tailwind CDN (matches `ats.html`/`careers.html`), Supabase JS v2 (`assets/supabase-config.js`), Postgres RLS + plpgsql RPCs. No build step. Tests are Node scripts + browser DOM assertions + Supabase SQL-editor verification.

## Global Constraints

- No build step; single-file HTML, Tailwind via CDN, Material Icons **Outlined** only (the app does not load filled `material-icons`).
- Anon/publishable key `sb_publishable_GYmTJWeUriWXjFkO9j2J7w_cwJNV0Au` is safe to embed. The `service_role`/secret key must NEVER appear in client code. `.env*` stay gitignored.
- Applicant PII (name, email, phone, `resume_url`, `linkedin`, `referred_by`) must never be reachable by a client — not in an RPC result, not in a table grant, not in the page.
- All SQL migrations additive and idempotent (`add column if not exists`, `create or replace`, `drop policy if exists` before `create policy`). Mirror every DB change into `supabase/schema.sql`.
- `client` role is NOT staff: `cnt_is_staff()` / `cnt_is_manager()` must keep excluding it, so no staff policy ever grants a client access.
- Exact types: `applications.id bigint`, `applications.priority int`, `applications.client text`, `hiring_requests.account text`. `profiles.id uuid`.
- Verify DB state before changing it (REST 400-vs-empty probe or a SQL `information_schema` query); the Supabase dashboard is frequently down — warm it via project home, then the SQL editor. Run DDL by `monaco.editor.getModels()[0].setValue(...)` then Ctrl+Enter (typing corrupts via auto-brackets).
- End commit messages with the `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` trailer.

---

## File Structure

- `client.html` — **new**. The entire client portal: login, shell, My Vacancies, Endorsed Candidates. Self-contained, mirrors the structure/theme of `careers.html`.
- `supabase/schema.sql` — **modify**. Add the drifted `hiring_requests` table + endorsement columns (so the file is runnable), the two new columns, the `cnt_client_account()` helper, the two RPCs, and client RLS policies.
- `ats.html` — **modify**. Endorsement panel → endorse-only + awaiting/decided display; Settings create-user gains a client-account selector; hiring-requests list shows a "Client-submitted" tag; load `client_status`/`decided_at` are already mapped.
- `careers.html` — **modify**. Consent wording covers "sharing your profile with the prospective employer".
- `scripts/smoke-test.js` — **modify**. Cover `client.html`; add a static PII-invariant scan of `schema.sql`.
- `scripts/test-client-portal.js` — **new**. Node unit tests for the anonymised field allow-list and the portal's pure helpers.
- `.github/workflows/ci.yml` — **modify**. Run the new test script.

---

## Task 1: Sync schema.sql for hiring_requests + endorsement columns, add new columns

Pre-existing drift: `hiring_requests` and `applications.client_status/client_reason/endorsed_at/decided_at` exist in production but not in `schema.sql`. Bring the file in line and add the two new columns, in production and in the file.

**Files:**
- Modify: `supabase/schema.sql` (additive block near the other `alter table ... add column` sections)
- Verify: Supabase SQL editor

**Interfaces:**
- Produces: `profiles.client_account text`, `hiring_requests.client_submitted boolean`, and a documented `hiring_requests` table + `applications` endorsement columns in `schema.sql`.

- [ ] **Step 1: Confirm production column state (write the check first)**

In the Supabase SQL editor run:
```sql
select
  (select count(*) from information_schema.columns where table_name='hiring_requests') as hr_cols,
  (select count(*) from information_schema.columns where table_name='applications' and column_name='client_status') as has_client_status,
  (select count(*) from information_schema.columns where table_name='profiles' and column_name='client_account') as has_client_account;
```
Expected: `hr_cols` > 0, `has_client_status` = 1, `has_client_account` = 0 (not yet added).

- [ ] **Step 2: Add the new columns in production**

```sql
alter table public.profiles        add column if not exists client_account text;
alter table public.hiring_requests add column if not exists client_submitted boolean default false;
```
Run. Expected: "Success. No rows returned."

- [ ] **Step 3: Verify with the REST probe (independent of the dashboard)**

In the in-app browser console:
```js
const KEY='sb_publishable_GYmTJWeUriWXjFkO9j2J7w_cwJNV0Au';
const p=async(t,c)=>{const r=await fetch(`https://mtaknpmvvldmnsizvtuy.supabase.co/rest/v1/${t}?select=${c}&limit=1`,{headers:{apikey:KEY,Authorization:'Bearer '+KEY}});return `${t}.${c}: ${r.status===400?'MISSING':'present'}`;};
console.log(await p('profiles','client_account'), await p('hiring_requests','client_submitted'));
```
Expected: both `present`.

- [ ] **Step 4: Mirror into schema.sql**

Add the `hiring_requests` table definition (matching production columns: `id bigint identity pk, req_id text, account text, role text, location text, type text, count int, priority text, status text, date date, deadline date, requestor text, notes text, assigned_to uuid, assigned_name text, client_submitted boolean default false, created_at timestamptz default now()`), the `applications` endorsement columns in the additive block (`client_status text default 'none', client_reason text, endorsed_at timestamptz, decided_at timestamptz`), and `profiles.client_account text`. Use `create table if not exists` / `add column if not exists`.

- [ ] **Step 5: Commit**

```bash
git add supabase/schema.sql
git commit -m "Sync schema.sql for hiring_requests + endorsement; add client columns"
```

---

## Task 2: `cnt_client_account()` helper + profile self-read + hiring_requests client RLS

**Files:**
- Modify: `supabase/schema.sql` (after `cnt_is_manager()`, and in the policies section)
- Verify: Supabase SQL editor

**Interfaces:**
- Produces: `public.cnt_client_account() returns text` (the caller's client account, null for staff/anon); client `SELECT`/`INSERT` policies on `hiring_requests`; a self-read policy on `profiles`.

- [ ] **Step 1: Create the helper (idempotent)**

```sql
create or replace function public.cnt_client_account()
returns text language sql stable security definer set search_path = public as $$
  select client_account from public.profiles where id = auth.uid();
$$;
```
Run in the SQL editor. Expected: success.

- [ ] **Step 2: Confirm it does not turn a client into staff**

```sql
select proname, prosrc from pg_proc where proname in ('cnt_is_staff','cnt_is_manager');
```
Expected: neither references `'client'` — a client role returns false from both. (No change needed; this is a guard check.)

- [ ] **Step 3: Add client policies (drop-then-create for idempotency)**

```sql
drop policy if exists profiles_self_read on public.profiles;
create policy profiles_self_read on public.profiles
  for select to authenticated using (id = auth.uid());

drop policy if exists hr_client_read on public.hiring_requests;
create policy hr_client_read on public.hiring_requests
  for select to authenticated
  using (account is not null and account = public.cnt_client_account());

drop policy if exists hr_client_insert on public.hiring_requests;
create policy hr_client_insert on public.hiring_requests
  for insert to authenticated
  with check (
    account = public.cnt_client_account()
    and status = 'Pending'
    and client_submitted = true
  );
```
Run. Expected: success. (Existing staff policies remain; policies are OR'd, so staff are unaffected and a client with null account matches nothing.)

- [ ] **Step 4: Mirror into schema.sql** (helper next to the other `cnt_*` functions; policies in the RLS section).

- [ ] **Step 5: Commit**

```bash
git add supabase/schema.sql
git commit -m "Client RLS: cnt_client_account helper, profile self-read, hiring_requests scope"
```

---

## Task 3: `cnt_client_candidates()` anonymised read RPC + PII-invariant test

**Files:**
- Modify: `supabase/schema.sql`
- Create: `scripts/test-client-portal.js`
- Modify: `scripts/smoke-test.js`

**Interfaces:**
- Produces: `public.cnt_client_candidates()` returning ONLY `(id bigint, role text, tags text, work_experience text, education text, languages text, certifications text, seminars text, awards text, priority int, client_status text, endorsed_at timestamptz, decided_at timestamptz, client_reason text)` for the caller's account where `client_status in ('endorsed','approved','rejected')`.

- [ ] **Step 1: Write the failing static test (the PII invariant)**

Create `scripts/test-client-portal.js`:
```js
#!/usr/bin/env node
// The one invariant everything rests on: the client read path must never
// expose applicant PII. This scans the cnt_client_candidates() body in
// schema.sql and fails if a forbidden column appears in it.
const fs = require('fs');
const path = require('path');
const sql = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'schema.sql'), 'utf8');
let failures = 0, checks = 0;
const ok = n => { checks++; console.log('  \x1b[32m✓\x1b[0m ' + n); };
const fail = (n, w) => { checks++; failures++; console.log('  \x1b[31m✗\x1b[0m ' + n + '\n      ' + w); };

const m = sql.match(/create\s+or\s+replace\s+function\s+public\.cnt_client_candidates[\s\S]*?\$\$;/i);
if (!m) { fail('cnt_client_candidates present in schema.sql', 'function not found'); }
else {
  ok('cnt_client_candidates present');
  const body = m[0];
  const FORBIDDEN = ['name', 'email', 'phone', 'resume_url', 'linkedin', 'referred_by', 'referral_relation'];
  const leaked = FORBIDDEN.filter(c => new RegExp('\\b' + c + '\\b').test(body));
  leaked.length ? fail('no PII columns in client read path', 'found: ' + leaked.join(', '))
                : ok('no PII columns (name/email/phone/resume_url/linkedin/referred_by) in client read path');
  /security\s+definer/i.test(body) ? ok('runs security definer') : fail('security definer', 'missing');
  /client_status\s+in\s*\(\s*'endorsed'/i.test(body) ? ok('filters to endorsed+') : fail('status filter', 'missing');
}
console.log('\n' + '─'.repeat(52));
if (failures) { console.log('\x1b[31m' + failures + ' of ' + checks + ' FAILED\x1b[0m'); process.exit(1); }
console.log('\x1b[32mAll ' + checks + ' checks passed\x1b[0m');
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node scripts/test-client-portal.js`
Expected: FAIL — "function not found" (not written into schema.sql yet).

- [ ] **Step 3: Create the RPC in production**

```sql
create or replace function public.cnt_client_candidates()
returns table (
  id bigint, role text, tags text, work_experience text, education text,
  languages text, certifications text, seminars text, awards text,
  priority int, client_status text, endorsed_at timestamptz,
  decided_at timestamptz, client_reason text
) language sql stable security definer set search_path = public as $$
  select a.id, a.role, a.tags, a.work_experience, a.education, a.languages,
         a.certifications, a.seminars, a.awards, a.priority, a.client_status,
         a.endorsed_at, a.decided_at, a.client_reason
  from public.applications a
  where public.cnt_client_account() is not null
    and a.client = public.cnt_client_account()
    and a.client_status in ('endorsed','approved','rejected');
$$;
revoke all on function public.cnt_client_candidates() from public, anon;
grant execute on function public.cnt_client_candidates() to authenticated;
```
Run in the SQL editor. Expected: success.

- [ ] **Step 4: Write the same definition into schema.sql**, verbatim, next to the other functions.

- [ ] **Step 5: Run the test to verify it passes**

Run: `node scripts/test-client-portal.js`
Expected: PASS (all checks).

- [ ] **Step 6: Add it to smoke-test.js**

In `scripts/smoke-test.js`, extend the file loop so `client.html` is parsed and its handlers resolved (add `'client.html'` to the file arrays used in checks 1 and 3), and add `client.html` required IDs once the page exists (Task 5 fills these — leave a note). Commit that wiring here.

- [ ] **Step 7: Commit**

```bash
git add supabase/schema.sql scripts/test-client-portal.js scripts/smoke-test.js
git commit -m "Anonymised client read RPC + PII-invariant test"
```

---

## Task 4: `cnt_client_decide()` decision RPC

**Files:**
- Modify: `supabase/schema.sql`
- Verify: Supabase SQL editor

**Interfaces:**
- Consumes: `cnt_client_account()`.
- Produces: `public.cnt_client_decide(app_id bigint, decision text, reason text default null) returns text` — sets `client_status` to `approved`/`rejected` only from `endorsed`, only for the caller's account.

- [ ] **Step 1: Create the RPC in production**

```sql
create or replace function public.cnt_client_decide(app_id bigint, decision text, reason text default null)
returns text language plpgsql security definer set search_path = public as $$
declare acct text; cur text;
begin
  acct := public.cnt_client_account();
  if acct is null then raise exception 'Not a client account'; end if;
  if decision not in ('approved','rejected') then raise exception 'Invalid decision'; end if;
  select client_status into cur from public.applications
    where id = app_id and client = acct for update;
  if cur is null then raise exception 'Candidate not found for your account'; end if;
  if cur <> 'endorsed' then raise exception 'Candidate is not awaiting your decision'; end if;
  update public.applications
    set client_status = decision, decided_at = now(),
        client_reason = case when decision = 'rejected' then reason else null end
    where id = app_id and client = acct;
  return decision;
end;
$$;
revoke all on function public.cnt_client_decide(bigint, text, text) from public, anon;
grant execute on function public.cnt_client_decide(bigint, text, text) to authenticated;
```
Run. Expected: success.

- [ ] **Step 2: Manual guard verification (staged, after a client account exists in Task 9)**

Note in the plan: once two client accounts exist, verify from a SONY session that `select cnt_client_decide(<haier_app_id>,'approved')` raises "Candidate not found for your account", and that deciding a non-endorsed candidate raises "not awaiting your decision".

- [ ] **Step 3: Mirror into schema.sql.**

- [ ] **Step 4: Commit**

```bash
git add supabase/schema.sql
git commit -m "Client decision RPC (approve/reject, gated to own account + endorsed only)"
```

---

## Task 5: `client.html` — login shell + auth/role gate

**Files:**
- Create: `client.html`
- Modify: `scripts/smoke-test.js` (required IDs)

**Interfaces:**
- Consumes: `assets/supabase-config.js` (`window.getSupabase()`), `cnt_client_account()` indirectly via the profile row.
- Produces: a page that authenticates a Supabase user, loads their `profiles` row, and only proceeds if `role==='client'` and `client_account` is set; else signs out with a message. Exposes `#client-login`, `#client-app`, `#client-email`, `#client-password`, `#client-login-btn`, `#client-msg`, `#client-account-name`, `#tab-vacancies`, `#tab-candidates`, tab buttons, and `#client-logout`.

- [ ] **Step 1: Scaffold the page** (copy `careers.html`'s head/theme, Supabase config include). Build the login card and a hidden `#client-app` shell with two tab buttons and two empty tab panels. Add a logout button.

- [ ] **Step 2: Wire auth**

```js
async function clientLogin(){
  const email=$('#client-email').value.trim(), pw=$('#client-password').value;
  const msg=$('#client-msg'); msg.textContent='';
  const { data, error } = await sb.auth.signInWithPassword({ email, password: pw });
  if(error){ msg.textContent='Sign-in failed. Check your email and password.'; return; }
  const { data: prof } = await sb.from('profiles').select('role,client_account,full_name').eq('id',data.user.id).maybeSingle();
  if(!prof || prof.role!=='client' || !prof.client_account){
    await sb.auth.signOut();
    msg.textContent='This login is not set up for the client portal. Contact CNT.';
    return;
  }
  window.cntClientAccount = prof.client_account;
  $('#client-account-name').textContent = prof.client_account;
  $('#client-login').classList.add('hidden'); $('#client-app').classList.remove('hidden');
  showClientTab('candidates');
  loadClientVacancies(); loadClientCandidates();
}
```
(`sb`, `$`, `showClientTab`, `loadClientVacancies`, `loadClientCandidates` defined across this and Tasks 6–7. Password handling is the user's own login — never prefilled or logged.)

- [ ] **Step 3: Session restore + logout**

On load, `sb.auth.getSession()` → if a session exists, run the same profile-gate path so a returning client isn't asked to log in again. `clientLogout()` calls `sb.auth.signOut()` and reloads.

- [ ] **Step 4: Add required IDs to smoke-test.js**

Add a `client.html`-specific required-id list (`client-login`, `client-app`, `client-email`, `client-password`, `tab-vacancies`, `tab-candidates`) checked when the file exists.

- [ ] **Step 5: Verify parse + IDs**

Run: `node scripts/smoke-test.js`
Expected: PASS including the new `client.html` checks.

- [ ] **Step 6: Commit**

```bash
git add client.html scripts/smoke-test.js
git commit -m "Client portal: login shell + role/account gate"
```

---

## Task 6: `client.html` — My Vacancies (list + file form)

**Files:**
- Modify: `client.html`

**Interfaces:**
- Consumes: `sb`, `window.cntClientAccount`, `hiring_requests` (RLS-scoped), `taxonomy` positions/locations (read via a small public/allowed path — clients may read taxonomy; if taxonomy is staff-only, hardcode the position/location options passed at account setup, OR add a `taxonomy` client-read policy scoped to nothing sensitive). Decision: add `taxonomy read authenticated` for `client` is unnecessary — instead the vacancy form uses free-typed position/location `text` inputs with a datalist seeded from the client's existing vacancies. (Keeps taxonomy staff-only.)
- Produces: `loadClientVacancies()`, `fileClientVacancy()`, `#client-vacancy-list`, `#cv-position`, `#cv-location`, `#cv-count`, `#cv-type`, `#cv-priority`, `#cv-date`, `#cv-notes`, `#cv-submit`.

- [ ] **Step 1: Render the list**

```js
async function loadClientVacancies(){
  const el=$('#client-vacancy-list'); el.innerHTML='Loading…';
  const { data, error } = await sb.from('hiring_requests')
    .select('req_id,role,location,count,type,priority,status,date,created_at')
    .order('created_at',{ascending:false});
  if(error){ el.textContent='Could not load your vacancies.'; return; }
  el.innerHTML = (data||[]).length
    ? data.map(v=>vacancyRow(v)).join('')
    : '<p class="muted">No vacancies yet. File your first below.</p>';
}
```
`vacancyRow` renders position, location, count, a status badge (Pending=amber, Open=green, Filled=slate) and submitted date.

- [ ] **Step 2: File-vacancy form**

```js
async function fileClientVacancy(e){
  e.preventDefault();
  const role=$('#cv-position').value.trim(), location=$('#cv-location').value.trim();
  const count=parseInt($('#cv-count').value)||1;
  if(!role||!location){ /* inline msg */ return; }
  const rec={ req_id:'CLT-'+Date.now(), account:window.cntClientAccount, role, location,
    count, type:$('#cv-type').value, priority:$('#cv-priority').value, status:'Pending',
    date:new Date().toISOString().slice(0,10), deadline:$('#cv-date').value||null,
    requestor:$('#client-account-name').textContent, notes:$('#cv-notes').value||null,
    client_submitted:true };
  const { error } = await sb.from('hiring_requests').insert(rec);
  if(error){ /* inline msg: submit failed */ return; }
  e.target.reset(); loadClientVacancies(); /* success toast */
}
```
(RLS `hr_client_insert` forces `account`/`status`/`client_submitted`; the client cannot spoof another account.)

- [ ] **Step 3: Browser verification (logic-level, unauthenticated pane)**

In the in-app browser, stub `sb.from().insert` to capture the record; assert `account===cntClientAccount`, `status==='Pending'`, `client_submitted===true`, and that missing position/location blocks submit. (Full round-trip is a staged step with a real client login.)

- [ ] **Step 4: Verify + commit**

Run: `node scripts/smoke-test.js` → PASS.
```bash
git add client.html && git commit -m "Client portal: My Vacancies list + file form"
```

---

## Task 7: `client.html` — Endorsed Candidates (anonymised cards + approve/reject)

**Files:**
- Modify: `client.html`

**Interfaces:**
- Consumes: `sb.rpc('cnt_client_candidates')`, `sb.rpc('cnt_client_decide',{app_id,decision,reason})`.
- Produces: `loadClientCandidates()`, `clientDecide(id, decision)`, `#client-candidate-list`, a pending section and a decided section.

- [ ] **Step 1: Load via the RPC (never the table)**

```js
async function loadClientCandidates(){
  const el=$('#client-candidate-list'); el.innerHTML='Loading…';
  const { data, error } = await sb.rpc('cnt_client_candidates');
  if(error){ el.textContent='Could not load candidates.'; return; }
  const pending=(data||[]).filter(c=>c.client_status==='endorsed');
  const decided=(data||[]).filter(c=>c.client_status!=='endorsed');
  el.innerHTML = renderPending(pending) + renderDecided(decided);
}
```
`renderPending` cards show role, Expected Skills (via the same `_uniformSkills`-style display — reimplement a tiny title-case inline; do NOT import ats.html), experience, education, evaluation stars from `priority`, and **Approve** / **Reject** buttons. No name/email/phone anywhere (the RPC doesn't return them).

- [ ] **Step 2: Decide**

```js
async function clientDecide(id, decision){
  let reason=null;
  if(decision==='rejected'){ reason=prompt('Reason (optional):'); if(reason===null) return; }
  else if(!confirm('Approve this candidate?')) return;
  const { data, error } = await sb.rpc('cnt_client_decide', { app_id:id, decision, reason });
  if(error){ /* "no longer awaiting your decision" */ loadClientCandidates(); return; }
  loadClientCandidates();
}
```

- [ ] **Step 3: Browser verification (logic-level)**

Stub `sb.rpc` to return a fixed anonymised set; assert cards render, contain no PII keys, split pending/decided correctly, and that `clientDecide` calls `cnt_client_decide` with the right args and re-loads on error.

- [ ] **Step 4: Verify + commit**

Run: `node scripts/smoke-test.js` → PASS.
```bash
git add client.html && git commit -m "Client portal: endorsed candidates, approve/reject via RPC"
```

---

## Task 8: Staff ATS — endorsement panel becomes endorse-only

**Files:**
- Modify: `ats.html` (`renderEndorsement`, `setClientStatus`)

**Interfaces:**
- Consumes: existing `renderEndorsement(app)`, `_atOfferStage`, `_endorseBadge`.
- Produces: an endorsement panel that offers only "Endorse to client" (and "Re-endorse" after a client rejection); shows "Awaiting client decision" once endorsed and the client's outcome once decided. The staff `approve`/`reject` buttons are removed.

- [ ] **Step 1: Edit `renderEndorsement`**

Remove the branch that renders the `approve`/`reject` staff buttons (`st==='endorsed'||…` → `Client approved`/`Client rejected`). Keep the `endorse` button for `st==='none'` and a `Re-endorse` for `st==='rejected'`. When `st==='endorsed'`, render a static line: `Awaiting client decision`. Keep `_endorseBadge(st)` for the status pill. Leave `setClientStatus(app,'endorsed')` intact; delete the `approve`/`reject` dispatch cases from the click handler.

- [ ] **Step 2: Browser verification**

In the in-app browser, call `renderEndorsement` with `client_status` of `none`, `endorsed`, `approved`, `rejected`; assert: `none`→Endorse button; `endorsed`→no approve/reject buttons, "Awaiting client decision" text; `approved`/`rejected`→status only (+reason for rejected); `rejected`→Re-endorse present.

- [ ] **Step 3: Verify + commit**

Run: `node scripts/smoke-test.js` → PASS (handlers still resolve).
```bash
git add ats.html && git commit -m "Staff endorsement is endorse-only; client records the decision"
```

---

## Task 9: Staff ATS — create client users in Settings

**Files:**
- Modify: `ats.html` (the create-user form + handler in the Users/Settings area)

**Interfaces:**
- Consumes: existing create-user flow (`ROLE_LABELS`, the create handler that inserts an auth user + profile), `_taxNames('client')`.
- Produces: a client-account `<select>` shown only when the chosen role is `client`; creating a `client` user writes `role='client'` and `client_account`.

- [ ] **Step 1: Add `client` to `ROLE_LABELS`** as `client:'Client (portal)'`.

- [ ] **Step 2: Add a `#cnt-nu-client-account` select** (options from `_taxNames('client')`), hidden unless role is `client`; wire a role `change` listener to toggle it.

- [ ] **Step 3: In the create handler**, when role is `client`, require an account and set `client_account` on the inserted profile; for non-client roles leave it null. Reuse the existing auth-user creation path.

- [ ] **Step 4: Browser verification**

Assert the account select appears only for `client`, and the record built for insert has `role:'client'` + the chosen `client_account`; and is null/absent for a `recruiter`.

- [ ] **Step 5: Verify + commit**

Run: `node scripts/smoke-test.js` → PASS.
```bash
git add ats.html && git commit -m "Settings: create client-portal users scoped to an account"
```

---

## Task 10: Staff ATS — "Client-submitted" tag on hiring requests

**Files:**
- Modify: `ats.html` (hiring-requests list render + the row mapping that loads `hiring_requests`)

**Interfaces:**
- Consumes: the hiring-requests loader/render.
- Produces: `client_submitted` carried into the in-memory request object and a small "Client-submitted" pill on those rows.

- [ ] **Step 1:** In the `hiring_requests` select/map, include `client_submitted` and store it on the request object.

- [ ] **Step 2:** In the request row render, when `client_submitted`, add a pill: `<span …>Client-submitted</span>`.

- [ ] **Step 3: Browser verification** — a request with `client_submitted:true` renders the pill; a staff-created one does not.

- [ ] **Step 4: Verify + commit**

```bash
git add ats.html && git commit -m "Flag client-submitted hiring requests in the staff list"
```

---

## Task 11: Consent wording for sharing profiles with clients

**Files:**
- Modify: `careers.html` (the RA 10173 consent block)

**Interfaces:**
- Produces: consent copy that explicitly covers sharing the applicant's profile with the prospective employer/client.

- [ ] **Step 1:** Update the consent sentence to include, e.g., "…and that my profile may be shared with the prospective employer for the role I applied to." Keep `name="consent"`, `consent_at`, `RA 10173` intact (smoke-test safeguards).

- [ ] **Step 2: Verify** `node scripts/smoke-test.js` → the 5 privacy/anti-spam safeguards still pass.

- [ ] **Step 3: Commit**

```bash
git add careers.html && git commit -m "Consent covers sharing applicant profile with the client"
```

---

## Task 12: CI + full verification pass

**Files:**
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1:** Add a step running `node scripts/test-client-portal.js` after the smoke tests.

- [ ] **Step 2:** Run locally: `node scripts/smoke-test.js && node scripts/test-client-portal.js && node scripts/test-resume-parser.js` → all PASS.

- [ ] **Step 3: Staged isolation verification (manual, with the user).** Create two client accounts (e.g. SONY + HAIER) in Settings. From each portal session confirm: only that account's vacancies and endorsed candidates appear; `cnt_client_decide` on the other account's candidate raises; approving a candidate flips `client_status` and the staff panel shows "Client approved" on next load; the anonymised cards show no PII (inspect the network response for `cnt_client_candidates`).

- [ ] **Step 4: Commit + push**

```bash
git add .github/workflows/ci.yml
git commit -m "CI: run client-portal tests"
git push origin main
```

---

## Self-Review notes

- **Spec coverage:** auth/roles → T1,T2,T5,T9; anonymised read → T3; decision RPC → T4; My Vacancies → T6; Endorsed Candidates → T7; staff endorse-only → T8; client-submitted tag → T10; consent → T11; testing/rollout → T3,T12. All spec sections map to a task.
- **PII invariant** is enforced by an automated test (T3) plus a staged network check (T12).
- **Taxonomy stays staff-only:** T6 deliberately avoids granting clients taxonomy read by using free-text + datalist, so no new read surface is opened.
- **Type consistency:** `app_id bigint` used in both RPCs and the portal; `cnt_client_account()` returns `text` matched against `applications.client` and `hiring_requests.account` (both text).
