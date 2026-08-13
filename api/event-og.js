// ============================================================
//  CNT — event page with server-rendered social preview (OG) tags.
//
//  Social crawlers (Facebook, LinkedIn, X, Messenger, Viber…) do NOT run the
//  client JS that renders event.html, so per-event share previews must be
//  injected server-side. vercel.json rewrites /event.html?id=… to this
//  function: it fetches the event from Supabase (public anon key), grabs the
//  static event.html shell, and injects <title>, description and OG/Twitter
//  tags before serving it. Real browsers still run the normal client JS.
// ============================================================
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://mtaknpmvvldmnsizvtuy.supabase.co';
const ANON = process.env.SUPABASE_ANON_KEY || 'sb_publishable_GYmTJWeUriWXjFkO9j2J7w_cwJNV0Au';
const FALLBACK_IMG = 'https://uploads.onecompiler.io/43d4zm644/44q9vbk23/cnt_front.png';

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

module.exports = async (req, res) => {
  const id = (req.query && req.query.id) || '';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0];
  const base = proto + '://' + host;

  // 1) Look up the event (published only) via the public REST API.
  let ev = null;
  try {
    if (id) {
      const r = await fetch(SUPABASE_URL + '/rest/v1/events?id=eq.' + encodeURIComponent(id) + '&published=eq.true&select=title,summary,body,image_url,event_date', { headers: { apikey: ANON, Authorization: 'Bearer ' + ANON } });
      const rows = await r.json();
      if (Array.isArray(rows) && rows[0]) ev = rows[0];
    }
  } catch (_) { /* fall back to generic preview */ }

  // 2) Grab the static event.html shell (no ?id → not rewritten → static file).
  let shell = '';
  try { shell = await (await fetch(base + '/event.html')).text(); } catch (_) {}
  if (!shell) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send('<!doctype html><meta http-equiv="refresh" content="0;url=/event.html?id=' + esc(id) + '">');
    return;
  }

  // 3) Build the meta.
  const title = ev ? (ev.title + ' — CNT Promo & Ads Specialists, Inc.') : 'Event — CNT Promo & Ads Specialists, Inc.';
  let desc = ev ? (ev.summary || ev.body || '') : 'Latest events and updates from CNT Promo & Ads Specialists, Inc.';
  desc = String(desc).replace(/\s+/g, ' ').trim().slice(0, 200);
  const img = (ev && ev.image_url) ? ev.image_url : FALLBACK_IMG;
  const url = base + '/event.html?id=' + encodeURIComponent(id);

  const meta = '<title>' + esc(title) + '</title>'
    + '<meta name="description" content="' + esc(desc) + '">'
    + '<meta property="og:type" content="article">'
    + '<meta property="og:site_name" content="CNT Promo &amp; Ads Specialists, Inc.">'
    + '<meta property="og:title" content="' + esc(title) + '">'
    + '<meta property="og:description" content="' + esc(desc) + '">'
    + '<meta property="og:image" content="' + esc(img) + '">'
    + '<meta property="og:url" content="' + esc(url) + '">'
    + '<meta name="twitter:card" content="summary_large_image">'
    + '<meta name="twitter:title" content="' + esc(title) + '">'
    + '<meta name="twitter:description" content="' + esc(desc) + '">'
    + '<meta name="twitter:image" content="' + esc(img) + '">';

  // 4) Strip the shell's static title/description, inject ours, and serve.
  let out = shell.replace(/<title>[\s\S]*?<\/title>/i, '').replace(/<meta\s+name=["']description["'][^>]*>/i, '');
  out = out.replace('</head>', meta + '</head>');

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=600, stale-while-revalidate=86400');
  res.status(200).send(out);
};
