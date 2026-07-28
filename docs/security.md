# Security & operations

Enterprise-hardening notes for the CNT ATS: the HTTP security headers and the
test suite.

> Two-factor authentication (TOTP) was previously enforced for staff but has
> been removed at the owner's request — login is password-only. Supabase Auth
> still supports MFA at the project level if it's wanted again later.

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

## Error monitoring (Sentry)

Production errors are captured with Sentry so failures don't die silently in the
browser console. It's **off until you set a DSN**:

1. Create a free project at <https://sentry.io> (platform: Browser / JavaScript).
2. Copy the project's **DSN** (a public URL, e.g. `https://abc@o123.ingest.us.sentry.io/456`
   — safe to embed, like the anon key).
3. Paste it into `assets/supabase-config.js` as `window.SENTRY_DSN = '…'` and redeploy.

`assets/sentry-init.js` then loads the SDK (from jsDelivr, already CSP-allowed) and
initialises it on the ATS, careers, client, and status pages. The CSP already
permits Sentry's ingest host (`connect-src … https://*.sentry.io`). Request
bodies are scrubbed before send so applicant PII isn't shipped to Sentry.

The Edge Functions still log to Supabase → Edge Functions → Logs (not Sentry).

## Tests

- `npm test` — static smoke tests, résumé-parser unit tests, client-portal
  isolation guardrails (Node, no dependencies).
- `npm run test:e2e` — Playwright end-to-end tests of the public flows and auth
  gates (installs Chromium on first run: `npm run test:e2e:install`).

CI (`.github/workflows/ci.yml`) runs all of the above plus a committed-secret
scan on every push and PR.
