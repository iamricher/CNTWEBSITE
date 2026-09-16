// ============================================================
//  CNT — Job Alerts: notify subscribers of a new post.
//
//  Called by Content Studio right after a new post is published. Emails every
//  ACTIVE subscriber a branded announcement (cover, title, blurb, "Read more"),
//  each with a one-click unsubscribe link. Sends through Resend, same shell as
//  api/send-auto-reply.js so all CNT mail looks identical.
//
//  Auth: the caller must be a signed-in STAFF user. Content Studio passes the
//  Supabase access token as "Authorization: Bearer <jwt>"; we verify it against
//  the very same cnt_is_staff() the RLS uses — no back door, no service-role key.
//
//  Idempotent: events.notified_at is stamped on first send, so editing a post
//  later never re-blasts everyone.
//
//  Env (Vercel):
//    RESEND_API_KEY   your Resend API key (already used by send-auto-reply)
//    RESEND_FROM      verified sender, e.g. "CNT Promo & Ads <news@mail.cntpromoads.com>"
//    SUPABASE_URL / SUPABASE_ANON_KEY  optional overrides (public anon key)
// ============================================================
const SB_URL = process.env.SUPABASE_URL || 'https://mtaknpmvvldmnsizvtuy.supabase.co';
const SB_ANON = process.env.SUPABASE_ANON_KEY || 'sb_publishable_GYmTJWeUriWXjFkO9j2J7w_cwJNV0Au';
const SITE = 'https://cnt-website-ats.vercel.app';
const BRAND_LOGO = SITE + '/assets/img/cnt-logo-white.png';

const esc = (s) => String(s == null ? '' : s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

function readBody(req) {
  return new Promise((resolve) => {
    if (req.body) { try { return resolve(typeof req.body === 'string' ? JSON.parse(req.body) : req.body); } catch (_) { return resolve({}); } }
    let data = '';
    req.on('data', (c) => { data += c; if (data.length > 20000) req.destroy(); });
    req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch (_) { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}

// Supabase REST helpers — plain fetch, acting AS the calling staff user so RLS
// applies exactly as in the app (the anon key is the public apikey header).
function sb(path, jwt, init) {
  return fetch(SB_URL + '/rest/v1/' + path, Object.assign({}, init, {
    headers: Object.assign({
      apikey: SB_ANON,
      Authorization: 'Bearer ' + jwt,
      'Content-Type': 'application/json',
    }, (init && init.headers) || {}),
  }));
}
function sbRpc(fn, jwt, args) {
  return fetch(SB_URL + '/rest/v1/rpc/' + fn, {
    method: 'POST',
    headers: { apikey: SB_ANON, Authorization: 'Bearer ' + jwt, 'Content-Type': 'application/json' },
    body: JSON.stringify(args || {}),
  });
}

const BTN = (href, label) =>
  '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 6px;"><tr>' +
  '<td style="background:#C8102E;border-radius:9px;box-shadow:0 4px 12px rgba(200,16,46,.24);">' +
  '<a href="' + href + '" class="btn-a" style="display:inline-block;padding:14px 32px;color:#ffffff;font-weight:700;font-size:14px;letter-spacing:.015em;text-decoration:none;">' + label +
  ' <span style="font-family:Arial,sans-serif;">&rarr;</span></a></td></tr></table>';

// Branded announcement email — mirrors the shell in api/send-auto-reply.js.
function announcementHtml(ev, unsubUrl) {
  const url = SITE + '/event?id=' + encodeURIComponent(ev.id);
  const cat = ev.category ? esc(ev.category) : 'Update';
  const date = ev.event_date ? esc(ev.event_date) : '';
  const kicker = cat + (date ? ' &nbsp;&middot;&nbsp; ' + date : '');
  const cover = ev.image_url
    ? '<tr><td style="padding:0;"><img src="' + esc(ev.image_url) + '" alt="' + esc(ev.title || '') + '" width="600" style="width:100%;max-width:600px;height:auto;display:block;border:0;"></td></tr>'
    : '';
  const summary = ev.summary ? '<p style="margin:0 0 6px;">' + esc(ev.summary) + '</p>' : '';
  return '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light">' +
    "<style>@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');" +
    'body{margin:0;padding:0;background:#f3f4f6;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;}' +
    'img{border:0;line-height:100%;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;}a{text-decoration:none;}' +
    "body,table,td,p,h1,div,span,a{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Helvetica,Arial,sans-serif;}" +
    "h1{font-family:'Manrope','Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Helvetica,Arial,sans-serif;}" +
    '@media only screen and (max-width:620px){.card{border-radius:0!important}.pad{padding-left:24px!important;padding-right:24px!important}.pad-y{padding-top:32px!important;padding-bottom:32px!important}.logo{height:38px!important}.hide-sm{display:none!important}.h1{font-size:22px!important}.btn-a{display:block!important;text-align:center!important}.outer{padding:0!important}}</style></head>' +
    '<body><table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="outer" style="background:#f3f4f6;padding:36px 12px;"><tr><td align="center">' +
    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" class="card" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #ecedf1;border-radius:14px;overflow:hidden;box-shadow:0 1px 2px rgba(16,24,40,.04),0 12px 34px rgba(16,24,40,.10);">' +
    // header
    '<tr><td class="pad" style="background:#14161b;background-image:linear-gradient(120deg,#1c1e25 0%,#111318 100%);border-bottom:3px solid #C8102E;padding:28px 34px;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>' +
    '<td align="left" valign="middle"><img src="' + BRAND_LOGO + '" alt="CNT Promo &amp; Ads Specialists, Inc." height="44" class="logo" style="height:44px;width:auto;display:block;"></td>' +
    '<td align="right" valign="middle" class="hide-sm" style="color:rgba(255,255,255,.6);font-size:10px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;line-height:1.6;">A Million Jobs<br>for a Million Filipinos<br><span style="color:#e5213f;">#TatakCNT</span></td>' +
    '</tr></table></td></tr>' +
    cover +
    // body
    '<tr><td class="pad pad-y" style="padding:42px 44px;color:#3a3c44;font-size:15.5px;line-height:1.75;">' +
    '<span style="display:inline-block;background:#FDE7EA;color:#C8102E;font-size:10.5px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;padding:6px 13px;border-radius:100px;">' + kicker + '</span>' +
    '<h1 class="h1" style="font-size:26px;font-weight:800;color:#16161a;letter-spacing:-.022em;line-height:1.22;margin:18px 0 16px;">' + esc(ev.title || '') + '</h1>' +
    summary +
    BTN(url, 'Read the full update') +
    '<p style="margin:22px 0 0;">Salamat sa pagsubscribe,<br><b>The CNT Team</b></p></td></tr>' +
    // footer
    '<tr><td class="pad" style="background:#14161b;background-image:linear-gradient(180deg,#191b21 0%,#111318 100%);padding:30px 34px 26px;text-align:center;">' +
    '<div style="font-size:10px;color:#71767f;text-transform:uppercase;letter-spacing:.14em;font-weight:700;">Stay connected</div>' +
    '<div style="margin:13px 0 0;">' +
    '<a href="https://www.facebook.com/CntPromoAds" style="display:inline-block;margin:0 5px;"><img src="' + SITE + '/assets/img/email/fb.png" width="38" height="38" alt="Facebook" style="width:38px;height:38px;border:0;"></a>' +
    '<a href="https://www.linkedin.com/company/cnt-promo-ads-specialists-inc/" style="display:inline-block;margin:0 5px;"><img src="' + SITE + '/assets/img/email/li.png" width="38" height="38" alt="LinkedIn" style="width:38px;height:38px;border:0;"></a>' +
    '<a href="https://www.tiktok.com/@cnt.jobhiring" style="display:inline-block;margin:0 5px;"><img src="' + SITE + '/assets/img/email/tt.png" width="38" height="38" alt="TikTok" style="width:38px;height:38px;border:0;"></a></div>' +
    '<div style="margin:18px 0 0;font-size:11.5px;color:#7f858e;line-height:1.7;">You are receiving this because you subscribed to CNT job alerts &amp; announcements.<br>' +
    '<a href="' + unsubUrl + '" style="color:#cfd3da;text-decoration:underline;">Unsubscribe</a> <span style="color:#4a4e57;">&nbsp;&middot;&nbsp;</span> <a href="' + SITE + '" style="color:#cfd3da;">Visit our website</a></div>' +
    '</td></tr>' +
    '<tr><td style="height:3px;background:#C8102E;background-image:linear-gradient(90deg,#A50D24 0%,#E5213F 50%,#A50D24 100%);font-size:0;line-height:0;">&nbsp;</td></tr>' +
    '<tr><td style="background:#0d0f13;padding:15px 34px;text-align:center;font-size:10.5px;color:#7a7f88;line-height:1.7;">' +
    '<b style="color:#e5213f;">Beware of scams.</b> CNT never charges applicants any fee at any stage.<br>' +
    '<span style="color:#5b606a;">&copy; ' + new Date().getFullYear() + ' CNT Promo &amp; Ads Specialists, Inc. All Rights Reserved.</span></td></tr>' +
    '</table></td></tr></table></body></html>';
}

// "Just posted" / "N days ago" from an ISO timestamp.
function timeAgo(iso) {
  if (!iso) return '';
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (isNaN(d)) return '';
  if (d < 3600) return 'Just posted';
  if (d < 86400) { const h = Math.max(1, Math.floor(d / 3600)); return h + (h === 1 ? ' hour ago' : ' hours ago'); }
  if (d < 2592000) { const dd = Math.floor(d / 86400); return dd + (dd === 1 ? ' day ago' : ' days ago'); }
  try { return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }); } catch (_) { return ''; }
}

// One Indeed-style job card (whole card links to the posting).
function jobCard(j, featured) {
  const url = SITE + '/job?job=' + encodeURIComponent(j.id);
  const role = esc(j.role || 'Open role');
  const sub = [j.location ? esc(j.location) : null, (j.department || j.industry) ? esc(j.department || j.industry) : null].filter(Boolean).join(' &nbsp;&middot;&nbsp; ');
  const sal = (!j.hide_salary && j.salary_range)
    ? '<span style="display:inline-block;background:#F1F3F6;color:#16161a;font-size:12px;font-weight:700;padding:4px 10px;border-radius:6px;margin-top:9px;">' + esc(j.salary_range) + '</span><br>'
    : '';
  const when = timeAgo(j.created_at);
  const border = featured ? '#F3C6CE' : '#E7EAF0';
  const bg = featured ? '#FFF7F8' : '#ffffff';
  const leftRule = featured ? 'border-left:3px solid #C8102E;' : '';
  return '<a href="' + url + '" style="display:block;text-decoration:none;margin:0 0 12px;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ' + border + ';' + leftRule + 'border-radius:12px;background:' + bg + ';"><tr><td style="padding:16px 18px;">' +
    (featured ? '<span style="display:inline-block;background:#C8102E;color:#ffffff;font-size:9px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;padding:3px 8px;border-radius:5px;margin-bottom:9px;">New</span><br>' : '') +
    '<span style="font-family:\'Manrope\',\'Inter\',sans-serif;font-size:16px;font-weight:800;color:#16161a;letter-spacing:-.01em;">' + role + '</span><br>' +
    (sub ? '<span style="font-size:13px;color:#6b7280;">' + sub + '</span><br>' : '') +
    sal +
    '<div style="margin-top:10px;"><span style="color:#C8102E;font-weight:700;font-size:13px;">Easily apply &rarr;</span>' + (when ? '<span style="color:#9aa3b2;font-size:12px;">&nbsp;&middot;&nbsp;' + when + '</span>' : '') + '</div>' +
    '</td></tr></table></a>';
}

// Indeed-style JOB DIGEST email: the new posting up top (badged "New"),
// then more open jobs for the subscriber. `others` = array of other open jobs.
function jobHtml(job, unsubUrl, others) {
  const list = Array.isArray(others) ? others : [];
  const total = 1 + list.length;
  const dept = job.department || job.industry || '';
  const headline = total + (total === 1 ? ' job hiring now at CNT' : ' jobs hiring now at CNT');
  const subtitle = list.length
    ? ('A new role just opened' + (dept ? ' &mdash; plus more ' + esc(dept) + ' openings hiring now.' : ' &mdash; here are more openings for you.'))
    : 'A new opening just went live. Tap below to view the details and apply.';
  const cards = jobCard(job, true) + list.map((j) => jobCard(j, false)).join('');
  return '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light">' +
    "<style>@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');" +
    'body{margin:0;padding:0;background:#f3f4f6;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;}' +
    'img{border:0;line-height:100%;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;}a{text-decoration:none;}' +
    "body,table,td,p,h1,div,span,a{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Helvetica,Arial,sans-serif;}" +
    "h1{font-family:'Manrope','Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Helvetica,Arial,sans-serif;}" +
    '@media only screen and (max-width:620px){.card{border-radius:0!important}.pad{padding-left:22px!important;padding-right:22px!important}.pad-y{padding-top:30px!important;padding-bottom:30px!important}.logo{height:38px!important}.hide-sm{display:none!important}.h1{font-size:22px!important}.btn-a{display:block!important;text-align:center!important}.outer{padding:0!important}}</style></head>' +
    '<body><table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="outer" style="background:#f3f4f6;padding:36px 12px;"><tr><td align="center">' +
    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" class="card" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #ecedf1;border-radius:14px;overflow:hidden;box-shadow:0 1px 2px rgba(16,24,40,.04),0 12px 34px rgba(16,24,40,.10);">' +
    // header
    '<tr><td class="pad" style="background:#14161b;background-image:linear-gradient(120deg,#1c1e25 0%,#111318 100%);border-bottom:3px solid #C8102E;padding:28px 34px;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>' +
    '<td align="left" valign="middle"><img src="' + BRAND_LOGO + '" alt="CNT Promo &amp; Ads Specialists, Inc." height="44" class="logo" style="height:44px;width:auto;display:block;"></td>' +
    '<td align="right" valign="middle" class="hide-sm" style="color:rgba(255,255,255,.6);font-size:10px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;line-height:1.6;">A Million Jobs<br>for a Million Filipinos<br><span style="color:#e5213f;">#TatakCNT</span></td>' +
    '</tr></table></td></tr>' +
    // headline + cards
    '<tr><td class="pad pad-y" style="padding:38px 40px;color:#3a3c44;">' +
    '<h1 class="h1" style="font-size:24px;font-weight:800;color:#16161a;letter-spacing:-.022em;line-height:1.2;margin:0 0 4px;text-align:center;">' + headline + '</h1>' +
    '<p style="margin:0 0 24px;font-size:14px;color:#6b7280;text-align:center;">' + subtitle + '</p>' +
    cards +
    BTN(SITE + '/careers', 'See all openings') +
    '<p style="margin:20px 0 0;font-size:12.5px;color:#6b7280;text-align:center;">Applying to CNT is always <b style="color:#16161a;">100% free</b>. We never ask jobseekers for payment.</p></td></tr>' +
    // footer
    '<tr><td class="pad" style="background:#14161b;background-image:linear-gradient(180deg,#191b21 0%,#111318 100%);padding:30px 34px 26px;text-align:center;">' +
    '<div style="font-size:10px;color:#71767f;text-transform:uppercase;letter-spacing:.14em;font-weight:700;">Stay connected</div>' +
    '<div style="margin:13px 0 0;">' +
    '<a href="https://www.facebook.com/CntPromoAds" style="display:inline-block;margin:0 5px;"><img src="' + SITE + '/assets/img/email/fb.png" width="38" height="38" alt="Facebook" style="width:38px;height:38px;border:0;"></a>' +
    '<a href="https://www.linkedin.com/company/cnt-promo-ads-specialists-inc/" style="display:inline-block;margin:0 5px;"><img src="' + SITE + '/assets/img/email/li.png" width="38" height="38" alt="LinkedIn" style="width:38px;height:38px;border:0;"></a>' +
    '<a href="https://www.tiktok.com/@cnt.jobhiring" style="display:inline-block;margin:0 5px;"><img src="' + SITE + '/assets/img/email/tt.png" width="38" height="38" alt="TikTok" style="width:38px;height:38px;border:0;"></a></div>' +
    '<div style="margin:18px 0 0;font-size:11.5px;color:#7f858e;line-height:1.7;">You are receiving this because you subscribed to CNT job alerts &amp; announcements.<br>' +
    '<a href="' + unsubUrl + '" style="color:#cfd3da;text-decoration:underline;">Unsubscribe</a> <span style="color:#4a4e57;">&nbsp;&middot;&nbsp;</span> <a href="' + SITE + '" style="color:#cfd3da;">Visit our website</a></div>' +
    '</td></tr>' +
    '<tr><td style="height:3px;background:#C8102E;background-image:linear-gradient(90deg,#A50D24 0%,#E5213F 50%,#A50D24 100%);font-size:0;line-height:0;">&nbsp;</td></tr>' +
    '<tr><td style="background:#0d0f13;padding:15px 34px;text-align:center;font-size:10.5px;color:#7a7f88;line-height:1.7;">' +
    '<b style="color:#e5213f;">Beware of scams.</b> CNT never charges applicants any fee at any stage.<br>' +
    '<span style="color:#5b606a;">&copy; ' + new Date().getFullYear() + ' CNT Promo &amp; Ads Specialists, Inc. All Rights Reserved.</span></td></tr>' +
    '</table></td></tr></table></body></html>';
}

// Per-type config: which table/columns to read, how to tell it's live, and how
// to build the subject + email body.
const KINDS = {
  event: {
    table: 'events',
    select: 'id,title,summary,category,event_date,image_url,published,notified_at',
    isLive: (r) => !!r.published,
    subject: (r) => (r.title ? 'CNT News · ' + r.title : 'A new update from CNT'),
    html: announcementHtml,
  },
  job: {
    table: 'jobs',
    select: 'id,role,location,salary_range,employment_type,department,industry,about,hide_salary,status,created_at,notified_at',
    isLive: (r) => r.status === 'open',
    subject: (r) => (r.role ? 'CNT is hiring · ' + r.role : 'New job opening at CNT'),
    html: jobHtml,
  },
};

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') { res.status(405).json({ ok: false, error: 'method' }); return; }

  const jwt = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (!jwt) { res.status(401).json({ ok: false, error: 'unauthorized' }); return; }

  const body = await readBody(req);
  // Accept { type:'event'|'job', id } and the legacy { event_id } shape.
  const type = body.type || (body.event_id != null ? 'event' : (body.job_id != null ? 'job' : ''));
  const recId = body.id != null ? body.id : (type === 'event' ? body.event_id : body.job_id);
  const kind = KINDS[type];
  if (!kind) { res.status(400).json({ ok: false, error: 'invalid type' }); return; }
  if (recId == null || recId === '') { res.status(400).json({ ok: false, error: 'id required' }); return; }

  const KEY = process.env.RESEND_API_KEY;
  const FROM = process.env.RESEND_FROM || 'CNT Promo & Ads Specialists, Inc. <onboarding@resend.dev>';
  if (!KEY) { res.status(200).json({ ok: false, error: 'not-configured' }); return; }

  const patch = (obj) => sb(kind.table + '?id=eq.' + encodeURIComponent(recId), jwt, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(obj) });

  try {
    // 1) Verify the caller may act — ATS staff (jobs) OR a content manager
    //    (events published in Content Studio). Same gates as the RLS policies.
    const [staffRes, contentRes] = await Promise.all([
      sbRpc('cnt_is_staff', jwt),
      sbRpc('cnt_can_manage_content', jwt),
    ]);
    const isStaff = await staffRes.json().catch(() => false);
    const canContent = await contentRes.json().catch(() => false);
    if (!(isStaff === true || canContent === true)) { res.status(403).json({ ok: false, error: 'forbidden' }); return; }

    // 2) Load the record. Skip if not live or already notified (idempotent guard).
    const recRes = await sb(kind.table + '?id=eq.' + encodeURIComponent(recId) + '&select=' + kind.select + '&limit=1', jwt);
    const recRows = await recRes.json().catch(() => []);
    const rec = Array.isArray(recRows) ? recRows[0] : null;
    if (!rec) { res.status(404).json({ ok: false, error: 'not-found' }); return; }
    if (!kind.isLive(rec)) { res.status(200).json({ ok: false, error: 'not-live', sent: 0 }); return; }
    if (rec.notified_at) { res.status(200).json({ ok: true, already: true, sent: 0 }); return; }

    // 2b) For a job, gather RELATED open jobs — same department (or industry if
    //     the post has no department) — so the digest stays on-topic. If none
    //     match, the featured job simply stands alone.
    let extra = null;
    if (type === 'job') {
      const field = rec.department ? 'department' : (rec.industry ? 'industry' : '');
      const cat = rec.department || rec.industry || '';
      let more = [];
      if (field && cat) {
        const q = 'jobs?status=eq.open&id=neq.' + encodeURIComponent(recId) +
          '&' + field + '=eq.' + encodeURIComponent(cat) +
          '&select=id,role,location,salary_range,employment_type,department,industry,hide_salary,created_at&order=created_at.desc&limit=6';
        const r = await sb(q, jwt);
        const d = await r.json().catch(() => []);
        more = Array.isArray(d) ? d : [];
      }
      extra = more;
    }

    // 3) Fetch active subscribers (staff-only select).
    const subRes = await sb('subscribers?active=eq.true&select=email,unsubscribe_token', jwt);
    const subs = await subRes.json().catch(() => []);
    if (!subRes.ok) { res.status(502).json({ ok: false, error: 'subscribers-read-failed' }); return; }
    if (!Array.isArray(subs) || !subs.length) {
      // Nobody to email — still stamp so we don't re-check forever.
      await patch({ notified_at: new Date().toISOString() });
      res.status(200).json({ ok: true, sent: 0 }); return;
    }

    const subject = kind.subject(rec);
    const messages = subs.filter((s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s.email || ''))).map((s) => {
      const unsubUrl = SITE + '/unsubscribe?token=' + encodeURIComponent(s.unsubscribe_token);
      return {
        from: FROM,
        to: [s.email],
        subject,
        html: kind.html(rec, unsubUrl, extra),
        reply_to: 'hrdadmin@cntpromoads.com',
        headers: { 'List-Unsubscribe': '<' + unsubUrl + '>', 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
      };
    });

    // 4) Send in batches of 100 (Resend batch limit).
    let sent = 0;
    for (let i = 0; i < messages.length; i += 100) {
      const chunk = messages.slice(i, i + 100);
      const r = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify(chunk),
      });
      if (r.ok) sent += chunk.length;
      else { const e = await r.json().catch(() => ({})); console.error('resend batch error', r.status, e); }
    }

    // 5) Stamp the record so it never re-blasts.
    await patch({ notified_at: new Date().toISOString() });

    res.status(200).json({ ok: true, sent, total: subs.length });
  } catch (e) {
    console.error('notify-subscribers exception', e);
    res.status(200).json({ ok: false, error: 'exception' });
  }
};

// Exposed for local email-template previews (does not affect the Vercel handler).
module.exports.jobHtml = jobHtml;
module.exports.announcementHtml = announcementHtml;
