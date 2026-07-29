# CNT ATS — Production-Readiness Audit

_Date: 2026-07-29 · Scope: `ats.html`, `careers.html`, `client.html`, `status.html`, `assets/*.js`, `api/*`, `supabase/*`, `vercel.json`, CI/tests._

**Verdict: Ship-ready for a controlled launch, with a short list of must-do items (mostly configuration you own) before wide production use.** The security foundation is solid; the main gaps are operational (monitoring, secrets, rate-limiting) and a few non-functional UI stubs.

Legend: 🔴 blocker · 🟠 should-fix-soon · 🟡 nice-to-have · ✅ already good

---

## 1. Security

- ✅ **No secrets in client code.** `service_role` never ships; smoke test (`scripts/smoke-test.js`) enforces this on every run.
- ✅ **PII isolation via RLS + `SECURITY DEFINER` RPCs.** Clients can't read `applications` directly; `cnt_client_candidates` / `cnt_client_decide` scope access. Verified by `scripts/test-rls-anon.js` and `scripts/test-client-portal.js`.
- ✅ **Security headers** in `vercel.json` (CSP, HSTS, frame/mime protections).
- ✅ **Stored-XSS hardening.** Applicant-controlled fields pass through `_escForm()` at every render sink; smoke test guards against regressions.
- ✅ **Public-insert hardened.** Anon can only insert a fresh `new` application; storage bucket capped at 5 MB + MIME-restricted.
- 🟠 **Login is password-only.** MFA was removed on request. Acceptable if admin accounts use strong, unique passwords, but reconsider MFA (or SSO) for admin roles before wide rollout. → _decision to own_
- 🟠 **`/api/apply` rate-limiting is not enforced server-side.** There's a 30 s client throttle + optional `checkBotId()` (fail-open). Enable **Vercel Bot Protection** + a rate-limit/WAF rule on `/api/apply`. → _config you own_
- 🟡 CSP allows `'unsafe-inline'`/`'unsafe-eval'` for CDN scripts (Tailwind/pdf.js). Acceptable for a CDN-based static app; tightenable later with a build step + nonces.

## 2. Observability & error handling

- 🔴 **No error monitoring active.** Sentry is wired (`assets/sentry-init.js`) but `window.SENTRY_DSN` is empty in `assets/supabase-config.js`. **Set a DSN before launch** so client errors are captured. → _config you own_
- ✅ **No swallowed DB errors.** Scanned for empty `catch{}` — none. DB writes log + surface a toast on failure (e.g. job sync, applicant persist).
- 🟡 Optimistic UI reconciles with the backend asynchronously; on a failed write the in-memory row can be briefly ahead of the DB. Errors are toasted, but there's no automatic rollback. Low risk at current scale.

## 3. Non-functional / placeholder UI  _(fixed in this pass — see §7)_

- 🟠 **"Sync Calendar"** (`ats.html`) showed a fake "synced with Google Calendar" toast with no real action.
- 🟠 **Checklist "Save Progress"** showed a fake "Checklist saved" toast; the checkboxes already auto-persist, so the button was misleading.

## 4. Data & migrations

- 🟠 **Manual, ordered SQL migrations** (`supabase/*.sql`), no migration runner. They're idempotent, but a fresh environment must apply them in order. Keep applying via the dashboard SQL editor or add `supabase db` to CI.
- ✅ Schema drift for job/milestone columns has been reconciled; the latest `2026-07-29-job-odoo-fields.sql` is applied (verified: 6 columns present).

## 5. Performance & scale

- 🟡 **Full-table client fetches.** `applications` and `jobs` load with `select('*')` (all rows) into the browser. Fine for hundreds of records; add server-side pagination / date-window filters before thousands. `localStorage` cache gives instant warm loads.
- 🟡 Render functions rebuild large `innerHTML` strings on every `renderAll()`. Fine now; virtualize the kanban/list if record counts grow large.

## 6. Accessibility

- 🟡 Most actions are real `<button>`s (good). Some clickable `<div>`/`<span>` (kanban cards, chips) use `onclick` without `role="button"`/`tabindex`/keyboard handlers. Add for keyboard/screen-reader parity.
- 🟡 Color is sometimes the only status signal (stage badges); pair with text (mostly already done).

## 7. Testing & CI

- ✅ Strong for a static app: `smoke-test` (15 checks), `test-rls-anon`, `test-client-portal`, `test-resume-parser`, plus a Playwright E2E suite wired into CI.
- 🟡 No automated a11y or Lighthouse budget in CI. Optional.

---

## Must-do before launch (you own these)

1. 🔴 Set **`SENTRY_DSN`** in `assets/supabase-config.js` (error monitoring).
2. 🟠 Enable **Vercel Bot Protection** + a rate-limit rule on `/api/apply`.
3. 🟠 Set the email secrets (**`RESEND_API_KEY`**, **`MAIL_FROM`**) and deploy the `applicant-confirm` edge function, if confirmation/stage emails should send.
4. 🟠 Decide on **MFA/SSO for admin** accounts.

## Fixed in this pass (code)

- Replaced the fake **Sync Calendar** with a real **Export to Calendar (.ics)** that downloads scheduled interviews as a standard calendar file.
- Replaced the misleading checklist **Save Progress** button with a truthful **"Saved automatically"** indicator (the checkboxes already persist on toggle).

---

## Appendix — Odoo 19 Recruitment parity

Grounded against the [Odoo 19 Recruitment docs](https://www.odoo.com/documentation/19.0/applications/hr/recruitment.html).

**Have (at parity or close):** configurable kanban **stages** + stage config UI · **job positions** (Odoo-style editor: department, industry, skills, interviewers, contract template, published toggle) · **interview scheduling** (day/week/month time-grid) · **refuse** flow with reason · **CV storage** + résumé viewer + **résumé digitization (OCR)** · **expected skills** (tags) · **offer letter** · **onboarding checklist** · **applicant analysis / reports**.

**Gaps vs Odoo (candidate backlog — prioritize with owner):**
- Kanban card **status** signal: _In Progress / Ready for Next Stage / Blocked_ (Odoo's green/red/grey dot). — not present
- **Stage-entry email automation** (send templated email when a card enters a stage). — partial (send-email function exists; per-stage automation not fully wired)
- **Configurable refusal reasons** list (managed in settings). — refuse exists; reasons not yet a managed list
- **"Folded in kanban"** stages (hide late stages by default). — not present
- **Interview surveys** sent to applicants. — not present
- **SMS** to applicants. — not present (requires an SMS provider + credits)
- **Send by email** from the applicant record (compose to the candidate). — partial

_This appendix is a menu, not a commitment — pick the slices that matter for CNT's workflow._
