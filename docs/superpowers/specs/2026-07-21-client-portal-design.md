# Client Portal — Design Spec

**Date:** 2026-07-21
**Status:** Approved (design), pending spec review

## Goal

Give CNT's clients (SONY, HAIER, etc.) a self-service portal to:

1. **File a new vacancy** — submit their hiring need, which lands in the
   existing staff Hiring Requests queue for approval.
2. **Act on endorsed candidates** — when a recruiter endorses a candidate to a
   client, that client (and only that client) approves or rejects them.

Once a recruiter clicks **Endorse to client**, staff no longer record the
decision — the client does, in the portal.

## Non-goals (YAGNI)

- No client self-registration — super-admin creates client logins.
- No messaging/chat between client and recruiter.
- No client visibility into the full pipeline — only candidates endorsed to
  them, and only their own vacancies.
- No staff override of the client's approve/reject decision.

## Authentication & roles

- Client users are real Supabase Auth accounts with `profiles.role = 'client'`
  and a `profiles.client_account` naming the one client they represent
  (matches a `taxonomy` client name, e.g. `'SONY'`).
- Super-admin creates them in the staff app's Settings (email, password set by
  admin, client account chosen from the taxonomy), mirroring staff-user
  creation but adding the client-account field.
- A client login can only use `client.html`. If a `client`-role user somehow
  reaches `ats.html`, they are signed out / refused. Conversely, staff roles
  have no portal data (their `client_account` is null).

## Security model (the crux)

RLS is row-level and **cannot hide columns**, so clients never get direct
`SELECT` on `applications` (which holds name, email, phone, CV path).

- **Helper:** `cnt_client_account()` — `SECURITY DEFINER`, returns the caller's
  `profiles.client_account` (or null). Reused by every client-facing policy so
  the scoping rule lives in one place.
- **Reading endorsed candidates:** a dedicated `SECURITY DEFINER` RPC
  `cnt_client_candidates()` (chosen over a view so the anonymised column set is
  fixed in one function body and cannot be widened by a policy change) that
  returns **only anonymised columns** — `id`, `role`, `tags` (Expected Skills),
  `work_experience`, `education`, `languages`, `certifications`, `seminars`,
  `awards`, `priority` (evaluation), `client_status`, `endorsed_at`,
  `decided_at`, `client_reason`. It filters to
  `client = cnt_client_account() AND client_status IN ('endorsed','approved','rejected')`.
  Name, email, phone, `resume_url`, `linkedin`, `referred_by` are never
  selected, so they cannot leak even via raw network inspection.
- **Deciding:** `cnt_client_decide(app_id uuid, decision text, reason text)` —
  `SECURITY DEFINER`. Verifies the caller's `client_account` matches the
  application's `client` and that `client_status = 'endorsed'`, then sets
  `client_status` to `approved`/`rejected`, `decided_at = now()`, and
  `client_reason`. Rejects any other transition. This is the client's only
  write into `applications`.
- **Vacancies:** `hiring_requests` has no PII, so plain RLS:
  - `SELECT` where `account = cnt_client_account()`.
  - `INSERT` forced to `account = cnt_client_account()`, `status = 'Pending'`,
    `client_submitted = true`. A client cannot insert for another account or
    set a non-Pending status (enforced in the `WITH CHECK`).
  - No `UPDATE`/`DELETE` for clients — staff own the lifecycle.
- **Profiles:** a client may read only their own row.

All existing staff policies are unchanged; client policies are additive.

## Data changes

- `profiles`:
  - `add column client_account text` (null for staff).
  - `client` added to the allowed-role set used by role checks.
- `hiring_requests`:
  - `add column client_submitted boolean default false`.
- `applications`: no new columns — `client_status`, `client_reason`,
  `endorsed_at`, `decided_at` already exist.

Migration is additive (`add column if not exists`) and mirrored into
`supabase/schema.sql`.

## Pages & flows

### `client.html` (new, self-contained)

Login screen → on auth, load the profile; require `role = 'client'` and a
`client_account`, else sign out with a message. Then two tabs:

**My Vacancies**
- List `hiring_requests` for their account with status badges
  (Pending / Open / Filled) and submitted date.
- "File a vacancy" form: position (from taxonomy positions), location, headcount,
  request type, priority, target start date, notes. Submits a `Pending`,
  `client_submitted = true` request scoped to their account.

**Endorsed Candidates**
- Pending decision: cards from the anonymised read path where
  `client_status = 'endorsed'`. Each shows the anonymised profile and
  **Approve** / **Reject** (reason optional on approve, prompted on reject),
  calling `cnt_client_decide`.
- Decided: a lighter list of already approved/rejected candidates for reference.

### Staff `ats.html` changes

- **Endorsement panel** (`renderEndorsement`): after "Endorse to client", drop
  the staff "Client approved" / "Client rejected" buttons. Show status:
  `Endorsed — awaiting client decision`, and once decided,
  `Client approved` / `Client rejected (reason)`. Re-endorse remains available
  if the client rejected. `setClientStatus('endorsed', …)` stays; the
  `approved`/`rejected` staff paths are removed from the UI.
- **Settings → Users:** the create-user form gains a client-account selector,
  shown when role is `client`; creating a client user sets
  `role = 'client'` and `client_account`.
- **Hiring Requests list:** show a small "Client-submitted" tag on requests
  where `client_submitted = true` (so staff know its origin). Approval →
  auto-post flow is unchanged.

## Realtime / freshness

Client decisions land in `applications`; the staff app already reloads
applications on relevant actions. The endorsement panel reflects the client's
decision on next load of that candidate (no new realtime channel required for
v1). Same for the client seeing a vacancy move Pending → Open after staff
approval — on next portal load.

## Error handling

- Client auth failure or wrong role → clear message, no data loaded.
- `cnt_client_decide` on a non-endorsed / non-owned candidate → RPC returns an
  error; portal shows "This candidate is no longer awaiting your decision" and
  refreshes.
- Vacancy insert failure → surfaced inline; nothing partially written.
- Portal degrades to a plain message if Supabase is unreachable.

## Testing

- **Smoke:** `client.html` inline scripts parse; required element IDs present;
  handlers resolve; no secrets; extend the existing `scripts/smoke-test.js`.
- **Isolation (manual/staged):** a SONY client sees only SONY vacancies and
  SONY-endorsed candidates; `cnt_client_decide` refuses a HAIER candidate.
- **Anonymity:** the client read path exposes no name/email/phone/CV — assert
  the selected column set in a test.
- **Decision transitions:** approve/reject only from `endorsed`; re-endorse
  after reject works.
- **Staff side:** endorsement panel no longer offers staff approve/reject; the
  status reflects the client's decision.

## Rollout

1. Schema migration (additive) → production + `schema.sql`.
2. RLS policies + helper + RPCs.
3. `client.html`.
4. Staff-side changes (endorsement panel, settings, request tag).
5. Super-admin creates the first client user; verify isolation with two
   accounts before going live.

## Open questions / risks

- **Consent basis:** even anonymised, sharing candidate profiles with a client
  should be covered by the careers-page consent wording. Confirm the current
  RA 10173 notice covers "sharing your profile with the prospective employer";
  update it if not.
- Column-hiding depends entirely on the read path never selecting PII — this is
  the single most important invariant and must be covered by a test.
