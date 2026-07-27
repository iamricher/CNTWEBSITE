# Email delivery

Recruitment emails (offers, interview invitations, refusals, and the generic
stage drafts) are sent **from CNT** through the `send-email` Supabase Edge
Function, which relays via [Resend](https://resend.com). The function is
staff-gated — it reuses the same `cnt_is_staff()` check as the database RLS, so
it can never be a way around the rules — and every send is written to
`audit_log`.

Until the two secrets below are set, the app falls back to opening the
recruiter's own mail app (a `mailto:` draft) so nothing is ever silently lost.

## One-time setup (owner)

1. Create a Resend account and an API key at <https://resend.com>.
2. (Recommended) Verify your sending domain in Resend so mail comes from your
   own address. Until then you can send from `onboarding@resend.dev`.
3. In Supabase → **Edge Functions → `send-email` → Secrets**, add:

   | Secret | Value |
   | --- | --- |
   | `RESEND_API_KEY` | your Resend API key (starts with `re_…`) |
   | `MAIL_FROM` | e.g. `CNT Recruitment <careers@yourdomain.com>` — or `CNT Recruitment <onboarding@resend.dev>` before your domain is verified |

   > Never put these in the repo or client code — they live only in the function's
   > secret store. The API key is a credential; keep it out of git.

4. Redeploy the function if the dashboard doesn't pick the secrets up
   automatically (Edge Functions → `send-email` → Deploy).

## Verify it works

In the ATS: **Settings → Email Delivery → “Send test email to me.”**

- **Green “✓ Sent”** → delivery is live; recruitment emails now go out for real.
- **Red “Not configured…”** → the secrets aren't set (or the key is wrong). The
  message shows the exact reason returned by the function.

## How sending happens day to day

- **Per-stage drafts:** on an applicant profile, *Draft email* opens a message
  pre-filled from that stage's template (editable). *Send* delivers it via the
  function; *Copy* / *Mail app* are the manual fallbacks.
- **Refusals:** the refuse dialog can send the refusal email in the same way.
- **Templates:** the built-in per-stage wording lives in `assets/ats-data.js`
  (`STAGE_EMAIL`); a stage configured with its own subject/body in
  **Settings → Stages** overrides it.

## Automatic application-received confirmation

When someone submits the public careers form, they get an immediate
"we received your application" email — no recruiter action needed.

A trigger on `applications` (INSERT) asynchronously calls the `applicant-confirm`
Edge Function, which sends the email. It's driven server-side rather than from
the browser because anon users can't read a row back (SELECT is staff-only), and
because a trigger can't be skipped by closing the tab. The `perform net.http_post`
call is fire-and-forget and wrapped in an exception handler, so it can **never
block or fail an application insert**.

`applicant-confirm` is a **separate** function from `send-email` because it runs
without a signed-in user, so it's built to be safe on its own:

- **Recipient-locked** — it looks the application up by id with the service role
  and emails **only the address stored on that row**, never anything the caller
  passes. It cannot be used to send mail to arbitrary people.
- **Single-shot** — it stamps `applications.confirmation_sent_at` and refuses to
  send twice, so it can't be replayed to spam a real applicant.

### Setup (one-time, owner)

1. Deploy the function **with JWT verification off** (it does its own checks, and
   the trigger calls it without a user token):

   ```bash
   supabase functions deploy applicant-confirm --no-verify-jwt
   ```

   (Or in the dashboard: Edge Functions → `applicant-confirm` → Details →
   turn **Enforce JWT Verification** off.)
2. Run `supabase/2026-07-27-application-confirm.sql` in the SQL Editor. It adds
   the `confirmation_sent_at` column, enables `pg_net`, and installs the trigger.
   Safe, non-destructive. (If `pg_net` isn't allowed, enable it first under
   Database → Extensions.)
3. It reuses the same `RESEND_API_KEY` / `MAIL_FROM` secrets as `send-email`;
   `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically.

Until this is set up, applications still submit normally — there's just no
confirmation email yet.
