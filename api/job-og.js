// ============================================================
//  CNT — careers job page with server-rendered social preview (OG) tags.
//
//  Social crawlers (Facebook, LinkedIn, Messenger, Viber…) don't run the client
//  JS that renders a job on careers.html, so a shared job link would otherwise
//  show a generic careers preview. vercel.json rewrites careers.html?job=<id>
//  to this function: it looks up the posting, reads the static careers.html
//  shell, and injects a job-specific <title>, description and OG/Twitter tags so
//  the share card reads e.g. "Sales Promoter — URC · Bulacan · ₱18,000/mo".
//  Real browsers still run the normal SPA, which routes to the job detail.
// ============================================================
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://mtaknpmvvldmnsizvtuy.supabase.co';
const ANON = process.env.SUPABASE_ANON_KEY || 'sb_publishable_GYmTJWeUriWXjFkO9j2J7w_cwJNV0Au';
const FALLBACK_IMG = 'https://cnt-website-ats.vercel.app/assets/img/og-cover.jpg';

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

module.exports = async (req, res) => {
  const id = (req.query && (req.query.job || req.query.id)) || '';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0];
  const base = proto + '://' + host;

  // 1) Look up the posting (published/open only) via the public REST API.
  let job = null;
  try {
    if (id) {
      const r = await fetch(SUPABASE_URL + '/rest/v1/jobs?id=eq.' + encodeURIComponent(id) + '&status=eq.open&select=role,client,location,salary_range,description', { headers: { apikey: ANON, Authorization: 'Bearer ' + ANON } });
      const rows = await r.json();
      if (Array.isArray(rows) && rows[0]) job = rows[0];
    }
  } catch (_) { /* fall back to a generic careers preview */ }

  // 2) Read the static careers shell (careers.html without ?job= serves the file).
  let shell = '';
  try { shell = await (await fetch(base + '/careers.html')).text(); } catch (_) {}
  if (!shell) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send('<!doctype html><meta http-equiv="refresh" content="0;url=/careers.html">');
    return;
  }

  // 3) Build the job-specific meta.
  const SITE = 'CNT Promo & Ads Specialists, Inc.';
  const title = job ? (job.role + ' — ' + SITE) : ('Careers — ' + SITE);
  let desc;
  if (job) {
    const bits = [job.client, job.location, job.salary_range ? (job.salary_range + '/mo') : null].filter(Boolean).join(' · ');
    const extra = String(job.description || '').replace(/\s+/g, ' ').trim();
    desc = (bits + (extra ? ' — ' + extra : ' — Apply now with CNT.')).slice(0, 200);
  } else {
    desc = 'Explore open positions and apply online with CNT Promo & Ads Specialists, Inc.';
  }
  const img = FALLBACK_IMG;
  const url = base + '/careers.html?job=' + encodeURIComponent(id);

  const meta = '<title>' + esc(title) + '</title>'
    + '<meta name="description" content="' + esc(desc) + '">'
    + '<meta property="og:type" content="website">'
    + '<meta property="og:site_name" content="CNT Promo &amp; Ads Specialists, Inc.">'
    + '<meta property="og:title" content="' + esc(title) + '">'
    + '<meta property="og:description" content="' + esc(desc) + '">'
    + '<meta property="og:image" content="' + esc(img) + '">'
    + '<meta property="og:url" content="' + esc(url) + '">'
    + '<meta name="twitter:card" content="summary_large_image">'
    + '<meta name="twitter:title" content="' + esc(title) + '">'
    + '<meta name="twitter:description" content="' + esc(desc) + '">'
    + '<meta name="twitter:image" content="' + esc(img) + '">';

  // 4) Strip the shell's static title/description + any existing OG/Twitter tags,
  //    inject ours, and serve. Real browsers still run the SPA.
  let out = shell
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<meta\s+name=["']description["'][^>]*>/ig, '')
    .replace(/<meta\s+property=["']og:[^"']*["'][^>]*>/ig, '')
    .replace(/<meta\s+name=["']twitter:[^"']*["'][^>]*>/ig, '');
  out = out.replace('</head>', meta + '</head>');

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=600, stale-while-revalidate=86400');
  res.status(200).send(out);
};
