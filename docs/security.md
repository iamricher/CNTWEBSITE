# Security & operations

Enterprise-hardening notes for the CNT ATS. Covers two-factor authentication
(MFA), the lockout-recovery procedure, and the HTTP security headers.

## Two-factor authentication (TOTP)

Staff can protect their login with a time-based one-time code from an
authenticator app (Google Authenticator, Authy, 1Password, etc.).

- **Enable it yourself:** ATS → **Settings → Two-Factor Authentication → Enable 2FA**,
  scan the QR with an authenticator app, enter the 6-digit code.
- **Required roles:** `super_admin`, `recruitment_manager`, and
  `recruitment_supervisor` **must** have 2FA. On their next sign-in without it
  they are taken straight to a mandatory setup screen — they can always enroll
  themselves (so no one is ever locked out), but cannot use the app until they do.
- **Everyone else** is opt-in.
- On each login, accounts with 2FA are asked for their code before the app loads.

The enforced roles are defined by `MFA_REQUIRED_ROLES` in `ats.html`. To change
which roles are required, edit that array.

### If someone is locked out of MFA

If a required user loses their authenticator (new phone, deleted app) they can't
pass the challenge. Recover by deleting their MFA factor in the database — they
will then be prompted to set up 2FA fresh at next sign-in:

1. Supabase → **SQL Editor**, run (replace the email):

   ```sql
   delete from auth.mfa_factors
   where user_id = (select id from auth.users where email = 'person@example.com');
   ```

2. Tell the user to sign in again — they'll be walked through setup.

Only a project owner/admin with Supabase dashboard access can do this. There is
no self-service reset, by design.

> Safety note: MFA setup **fails open** — if the enrollment API is ever
> unavailable (e.g. TOTP disabled at the project level), a required user is given
> a "Continue without 2FA" escape so a misconfiguration can't brick access.
> Keep TOTP enabled in Supabase → Authentication → providers for enforcement to
> actually apply.

## HTTP security headers

`vercel.json` sets security headers on every response:

- **Content-Security-Policy** — restricts where scripts, styles, fonts, images,
  connections, frames, and workers may come from. The allow-list covers exactly
  what the apps use: Tailwind/pdf.js/mammoth/Supabase-js from jsDelivr, GSAP from
  cdnjs, Google Fonts, applicant images from onecompiler, and Supabase (REST +
  realtime `wss` + storage + the résumé-PDF iframe). `'unsafe-inline'` /
  `'unsafe-eval'` are required because the apps are built entirely from inline
  scripts, inline event handlers, and the Tailwind browser JIT — the remaining
  directives (locked `connect-src`, `object-src 'none'`, `frame-ancestors 'none'`,
  `base-uri`, `form-action`) still block exfiltration, framing, and injection.
- **Strict-Transport-Security** — force HTTPS for a year, including subdomains.
- **X-Content-Type-Options: nosniff**, **X-Frame-Options: DENY**,
  **Referrer-Policy**, **Permissions-Policy** (camera/mic/geo denied — the Jitsi
  video interview opens in its own tab, so it keeps its own permissions), and
  **Cross-Origin-Opener-Policy**.

### If a page breaks after a headers change

A CSP that's too strict shows blocked-resource errors in the browser console
(`Refused to load … because it violates the following Content-Security-Policy…`).
Add the reported origin to the matching directive in `vercel.json` and redeploy.
To diagnose without breaking users, temporarily change the header key to
`Content-Security-Policy-Report-Only` — the browser will report violations
without enforcing them.

## Tests

- `npm test` — static smoke tests, résumé-parser unit tests, client-portal
  isolation guardrails (Node, no dependencies).
- `npm run test:e2e` — Playwright end-to-end tests of the public flows and auth
  gates (installs Chromium on first run: `npm run test:e2e:install`).

CI (`.github/workflows/ci.yml`) runs all of the above plus a committed-secret
scan on every push and PR.
