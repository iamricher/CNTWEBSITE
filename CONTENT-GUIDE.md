# CNT Website — Content Guide

Everything visible on the public site is editable in **Content Studio** — no code needed.
Open **`/content-studio`** (e.g. `https://cntpromoads.com.ph/content-studio`) and sign in with a
content-manager account. Changes go live immediately after **Save**.

---

## What you can edit, and where it shows

| Content Studio section | Controls on the website |
|---|---|
| **Services** | The 9 service detail pages (`/service?s=…`) + the "What We Offer" cards on the homepage + the Services overview page |
| **Success Stories** | The "Success Stories" case-study cards on the homepage |
| **Testimonials** | The quote carousel on the homepage (hidden if empty) |
| **Clients** | The scrolling client-logo strip ("Trusted by…") on the homepage |
| **Team** | The team member cards on the About page |
| **FAQ** | The questions on the FAQ page |
| **Locations** | The office locator on the homepage + each office page |
| **Events** | The "News & Events" cards on the homepage + each event page |
| **Messages (Inbox)** | Read inquiries submitted through the site contact form; mark handled / delete |

Each list supports **drag-to-reorder** — the order you set is the order shown on the site.
Uncheck **Published** to hide any item without deleting it.

---

## Services — the detail pages

Each service page reads as a mini "portfolio" of what CNT can do. Fields:

- **Title** — the service name. (The URL is generated automatically; the icon and category are set behind the scenes.)
- **Highlight word** — one word in the title shown in red (optional).
- **Tagline** — the one-line hero sub-heading.
- **Overview** — the "What this covers" paragraph.
- **Photo** — the hero background + the homepage card image. Upload a wide, high-quality photo.
- **Gallery photos** — the "See it in action" grid (click-to-zoom lightbox on the page).
- **Highlights** — the "What's included" cards (title + short description).
- **Who it's for** — audience chips. *One per line.*
- **Scope — what's covered** — the capability checklist. *One per line.*
- **How it helps — For your business** — client benefits. *One per line.*
- **How it helps — For candidates** — applicant benefits. *One per line.*
- **By the numbers** — the stats band. *One per line, format `value | label`* (e.g. `48h | Typical turnaround`). Leave blank to use the default company stats.

> The service pages currently show **draft copy** written as a starting point. Replace it with your real
> wording and photos whenever you're ready — anything you leave blank falls back to the draft.

---

## Photo guidance

- **Format:** JPG or PNG. **Landscape** works best for hero and card photos.
- **Size:** aim for ~1600px wide, good quality but web-optimized (under ~500 KB each where possible).
- Photos are uploaded straight in Content Studio — no need to touch the code.
- Company logos (Clients): use clean logos on a transparent or white background, roughly the same height.

---

## Company stats (30+ Years · 10,000+ Workers Deployed · 50+ Corporate Clients)

These appear on the homepage, About, Services and service pages. They're kept **uniform from one place**
in the code (`assets/site-chrome.js` → `CNT_STATS`). To change the figures site-wide, edit that one list.
Per-service stat bands can still be overridden in Content Studio → Services → "By the numbers".

---

## Real content still needed (from the team)

The site is fully built; these are the assets to drop in via Content Studio when available:

- [ ] Real **testimonials** (client quotes, names, roles)
- [ ] **Client logos** for the "Trusted by" strip
- [ ] **Team photos** + bios for the About page
- [ ] **Success stories** (real case studies with photos)
- [ ] **Service photos** to replace the placeholder images
- [ ] Any **satellite office** details (address, map, contact, photos)
- [ ] Confirmed **social media URLs** (Facebook, LinkedIn, TikTok) — used in the footer and emails

---

## Inquiries from the contact form

When someone submits the homepage contact form:

1. The message is saved to **Content Studio → Messages** (with an unread badge).
2. The sender gets an automatic confirmation email.
3. CNT staff (`hrdadmin@cntpromoads.com`) get an **alert email** with the details — reply to it to respond directly.

*(Steps 2–3 need the email service (Resend) configured with `RESEND_API_KEY`. Step 1 always works.)*
