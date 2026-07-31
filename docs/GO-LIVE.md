# CNT ATS — Go-Live Checklist

What's already done (code + database) vs. what only **you** can finish (accounts,
secret keys, dashboard settings). Claude can't create third-party accounts, handle
secret API keys, or enter payment details — those steps are yours.

Project ref: `mtaknpmvvldmnsizvtuy`

---

## ✅ Done (no action needed)
- Database migrations applied live: job Odoo fields, configurable refuse reasons,
  stage `auto_email`, pre-employment docs (`requirements` / `requirement_docs` +
  `documents` bucket), interview scorecard.
- Edge Functions deployed: `send-email`, `applicant-confirm`, **`send-sms`**.
- All features built & pushed (see git log): job editor, interview calendar,
  profile sidebar, bulk actions, analytics, audit-log viewer, talent-pool
  re-engagement, pre-emp uploads, SMS, scorecards, duplicate detection.

## 🔧 You must finish — activation (the app runs without these, features stay dormant until set)

### 1. Email (unlocks refusal emails, application confirmation, stage-entry automation)
- Sign up at **resend.com**, verify your sending domain (or use `onboarding@resend.dev` to start).
- Set secrets on the `send-email` function:
  - `RESEND_API_KEY` = your Resend key
  - `MAIL_FROM` = e.g. `CNT Recruitment <careers@yourdomain.com>`
- Secrets page: https://supabase.com/dashboard/project/mtaknpmvvldmnsizvtuy/functions/secrets

### 2. SMS (unlocks the SMS button + interview reminders)
- Sign up at **semaphore.co**, load credits (~₱0.50–0.80 per SMS), copy the API key.
- Set secrets on the `send-sms` function:
  - `SEMAPHORE_API_KEY` = your Semaphore key
  - `SEMAPHORE_SENDER` = e.g. `CNT` (optional; needs Semaphore approval)

### 3. Error monitoring
- Create a project at **sentry.io**, copy the DSN.
- Set `window.SENTRY_DSN` in `assets/supabase-config.js`, commit & push.

### 4. Anti-abuse on the public careers form
- In the **Vercel** dashboard: enable **Bot Protection** and add a rate-limit /
  WAF rule on `/api/apply`.

## 🧪 Recommended before announcing
- Click-through on the deployed site while signed in:
  - Background Check → upload / view a document
  - Interview tab → fill the evaluation scorecard (check the sidebar summary)
  - List view → bulk move / email / refuse; confirm the **DUP** badge
  - Reports → sanity-check the numbers
  - Settings → Audit Log, Refuse Reasons, a stage's auto-email toggle
- Send yourself a test email and a test SMS once keys are set.

---

_Order of impact: Email → SMS → Sentry → Vercel Bot Protection._
