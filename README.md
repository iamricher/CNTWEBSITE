# CNT — Website + ATS (connected)

The marketing website and the Applicant Tracking System, in one project, sharing a
single Supabase database. Someone applies on the **Careers** page → the application
appears inside the **ATS**.

```
WEBSITE_ATS/
├── index.html                 Marketing website  (adds a "Careers" nav link + Apply Now → careers)
├── careers.html               NEW — job listings + online application form (+ CV upload)
├── ats.html                   Applicant Tracking System (+ HR login + reads live applications)
├── assets/
│   └── supabase-config.js      ← paste your Supabase keys here (one time)
├── supabase/
│   └── schema.sql              run once in Supabase to create the database
└── README.md
```

## How it connects

```
Careers page  ──writes──►  SUPABASE  ──reads──►  ATS
(public)                (jobs, applications,      (HR login required)
                         resume storage)
```

- **Careers page** lists open jobs from the `jobs` table and saves each application
  (with the uploaded CV) to the `applications` table.
- **ATS** requires an HR login, then pulls those applications into the pipeline at the
  **Initial Screening** stage, tagged source `Website`. Moving a web applicant through
  stages saves back to Supabase. Each web applicant shows a **Download CV** link.
- Until you add your keys, everything runs in **preview/demo mode** (sample jobs, demo
  ATS data) so you can see it working locally.

## One-time setup (~10 minutes)

### 1. Create a free Supabase project
Go to <https://supabase.com> → **New project**. Wait for it to finish provisioning.

### 2. Create the database
Supabase dashboard → **SQL Editor** → **New query** → paste the entire contents of
`supabase/schema.sql` → **Run**. This creates the tables, security rules, the private
`resumes` storage bucket, and seeds the open positions.

### 3. Add your keys
Supabase dashboard → **Project Settings → API**. Copy:
- **Project URL**
- **anon public** key  *(safe to publish — Row Level Security protects the data)*

Paste both into `assets/supabase-config.js`:
```js
window.SUPABASE_URL      = 'https://xxxxxxxx.supabase.co';
window.SUPABASE_ANON_KEY = 'eyJhbGc...';
```
> Never put the **service_role** key here.

### 4. Create an HR login
Supabase dashboard → **Authentication → Users → Add user** → enter the HR email +
password. That's the account you'll use to sign in to `ats.html`.
(Under **Authentication → Providers**, keep **Email** enabled; you can turn off
"Confirm email" for quick internal use.)

### 5. Deploy
Commit and push these files to the git repo each site deploys from. `index.html` and
`careers.html` are the public website; `ats.html` is the private ATS.

## Test the whole flow
1. Open `careers.html`, pick a job, fill the form, attach a PDF, **Submit**.
2. Open `ats.html`, sign in with your HR account.
3. The new applicant appears under **Initial Screening** for that client, with a
   **Download CV** link. Move them along the pipeline — it persists on refresh.

## Preview locally (optional)
From this folder:
```
python -m http.server 8765
```
Then open <http://127.0.0.1:8765/careers.html> and <http://127.0.0.1:8765/ats.html>.
(Opening the files directly with `file://` won't work — the browser blocks the shared
config script. Use the local server.)

## Notes
- The ATS keeps its **demo applicants** so the charts stay populated. Real website
  applicants appear alongside them tagged `Website`. To go fully live, remove the demo
  `accountData` seed inside `ats.html`.
- Resume files live in a **private** bucket; the ATS opens them via short-lived signed
  links, so they are never publicly accessible.
- To change the open positions, edit the `jobs` table in Supabase (or re-run the seed
  section of `schema.sql`). The careers page reads them live.
