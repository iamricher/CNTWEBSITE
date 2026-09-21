# CNT Website — Launch Checklist

A step-by-step guide to taking the site live. Work top to bottom; nothing here
touches the live site until **Step 5 (Deploy)**. Tick each box as you go.

---

## 1. Code readiness (local)

- [ ] All work committed to `main` (currently 2 local commits ahead of origin, not yet pushed).
- [ ] Decide on `assets/img/hero-people.png` (the transparent professionals cutout) — commit it if you'll use it, or leave it out. It's currently uncommitted.
- [ ] Final local smoke test: `node scripts/serve.js 3000`, then click through every page + submit the contact form once.

## 2. Domain swap in the code  ✅ done (commit `5c642ca`, local, not yet pushed)

All `cnt-website-ats.vercel.app` references were replaced with the production
domain **`www.cntpromoads.com.ph`** (www is primary — the apex 308-redirects to
it). Covered: HTML canonical/OG/Twitter tags + JSON-LD, `sitemap.xml`,
`robots.txt`, the `/api` OG + email routes, and the Supabase Edge Functions.

- [x] Replaced across every HTML/XML/txt/js/ts site file (21 files).
- [x] `sitemap.xml` `<loc>` and `robots.txt` sitemap line updated.
- [x] Committed locally (`5c642ca`). Ships on the next push / at launch.
- [ ] If the final canonical is the **apex** (`cntpromoads.com.ph`) instead of
      `www`, re-run the swap with that host and flip the Vercel redirect direction.

## 3. Vercel — project + environment variables

- [ ] Confirm the repo is linked to the Vercel project and set to deploy from `main`.
- [ ] Set these **Environment Variables** in Vercel (Project → Settings → Environment Variables), for **Production**:
  - [ ] `SUPABASE_URL` — `https://mtaknpmvvldmnsizvtuy.supabase.co`
  - [ ] `SUPABASE_ANON_KEY` — the project anon key
  - [ ] `RESEND_API_KEY` — your Resend API key (for all transactional email)
  - [ ] `RESEND_FROM` — a **verified** sender, e.g. `CNT Promo & Ads <noreply@mail.cntpromoads.com>`
  - [ ] `STAFF_INBOX` — where new-inquiry alerts go (defaults to `hrdadmin@cntpromoads.com`)
  - [ ] `INBOUND_EMAIL_SECRET` — only if you use the inbound-application email webhook
- [ ] `vercel.json` is already configured (cleanUrls, security headers/CSP, redirects, rewrites) — no change needed.

## 4. Supabase (project `mtaknpmvvldmnsizvtuy`)

- [ ] **Migrations** — all are already applied to prod (offices, faqs/team, subscribers, jobs, content-studio roles, services + services-portfolio). Nothing to re-run.
- [ ] **Storage buckets** exist and are public-read where needed: `event-images` (photos), `resumes` (applications, private).
- [ ] **Edge Functions** — these do **NOT** deploy on git push; deploy them manually in the Supabase dashboard (Code tab → paste → Deploy): `applicant-confirm`, `send-email`, `send-sms`. Set their secrets (Resend key, etc.) in the dashboard.
- [ ] Confirm the DB webhook that triggers `applicant-confirm` on a new `applications` insert is enabled.

## 5. Email (Resend + DNS)

- [ ] In Resend, verify the sending domain/subdomain (e.g. `mail.cntpromoads.com`) — add the DNS records (SPF, DKIM) it gives you at your DNS host.
- [ ] `RESEND_FROM` uses an address on that verified domain.

## 6. Domain / DNS

- [ ] Add `cntpromoads.com.ph` (and `www`) to the Vercel project (Settings → Domains).
- [ ] Point the domain's DNS to Vercel (A / CNAME records Vercel shows you) at your registrar.
- [ ] Wait for SSL to provision (Vercel does this automatically).

## 7. Deploy 🚀

- [ ] Push `main` to origin → Vercel auto-builds and deploys. (Or run `vercel --prod` if you use the CLI.)
- [ ] Watch the Vercel build log — confirm it finishes green.

## 8. Post-deploy verification (on the LIVE site)

- [ ] Every page loads: `/`, `/careers`, `/about`, `/services`, `/service?s=…`, `/faq`, `/events`, `/office?id=…`, `/privacy`, `/terms`, `/content-studio`, `/ats`.
- [ ] Images load (no 404s) — especially the homepage case photos and service photos.
- [ ] **Contact form** → shows "Inquiry sent", you receive the auto-reply, and `hrdadmin@` receives the staff alert; the message appears in Content Studio → Messages.
- [ ] **Job application** → uploads résumé, shows success, appears in the ATS, applicant gets the confirmation email.
- [ ] **Subscribe form** (footer + events page) → adds to subscribers.
- [ ] A bad URL shows the custom **404 page**; `/sitemap.xml`, `/robots.txt`, `/favicon.ico` all serve.
- [ ] Share a link in Messenger/Slack — the **OG preview** (title, description, image) looks right.
- [ ] Test on a **real phone** (not just emulation).

## 9. SEO & monitoring

- [ ] **Google Search Console** — add the property. To verify by HTML tag: in
      `index.html` `<head>`, uncomment the `google-site-verification` meta and
      paste your code. Then **submit `sitemap.xml`**.
- [ ] **Google Analytics 4 (optional)** — in `assets/site-chrome.js` set
      `GA_MEASUREMENT_ID = 'G-XXXXXXXXXX'` (from Analytics → Admin → Data
      Streams). It loads on every page, only after cookie consent, and never on
      localhost or for bots. The GA domains are already allowed in `vercel.json`
      (CSP). The site also keeps its own first-party analytics (Content Studio →
      Dashboard) regardless.
- [ ] **Registration numbers (trust)** — in `assets/site-chrome.js` fill
      `LICENSE = { dole, dti, sec }` with your real numbers; a footer line
      appears automatically (blank fields stay hidden). Important for PH
      recruitment credibility.
- [ ] **Google Jobs** — careers already emits `JobPosting` structured data;
      the homepage emits `EmploymentAgency` (LocalBusiness) data. Verify both
      with Google's Rich Results Test after launch.

## 10. Content (via Content Studio) — see `CONTENT-GUIDE.md`

- [ ] Real testimonials, client logos, team photos + bios.
- [ ] Real service photos (replace placeholders).
- [ ] Publish current events / hiring drives.
- [ ] Confirm office locations, addresses, and social links.

---

**Reminder:** committing and even pushing to a *preview* branch never affects the live
domain — only a production deploy of `main` on the connected domain does. Take Steps 1–6
at your own pace; Step 7 is the moment it goes live.
