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
