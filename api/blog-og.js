// ============================================================
//  CNT — blog post page with server-rendered social preview (OG) tags.
//
//  Same pattern as api/event-og.js: social crawlers don't run client JS, so
//  per-post share previews are injected server-side. vercel.json rewrites
//  /post.html?id=… to this function; it looks up the post via the public REST
//  API, reads the static post-shell.html, and injects the meta tags.
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

  // 1) Look up the post (published only) via the public REST API.
  let post = null;
  try {
    if (id) {
      const r = await fetch(SUPABASE_URL + '/rest/v1/posts?id=eq.' + encodeURIComponent(id) + '&published=eq.true&select=title,excerpt,body,cover_image,category,author', { headers: { apikey: ANON, Authorization: 'Bearer ' + ANON } });
      const rows = await r.json();
      if (Array.isArray(rows) && rows[0]) post = rows[0];
    }
  } catch (_) { /* fall back to generic preview */ }

  // 2) Grab the static shell.
  let shell = '';
  try { shell = await (await fetch(base + '/post-shell.html')).text(); } catch (_) {}
  if (!shell) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send('<!doctype html><meta http-equiv="refresh" content="0;url=/post-shell.html?id=' + esc(id) + '">');
    return;
  }

  // 3) Build the meta.
  const title = post ? (post.title + ' — CNT Insights') : 'Insights — CNT Promo & Ads Specialists, Inc.';
  let desc = post ? (post.excerpt || post.body || '') : 'Hiring insights, market notes and career advice from CNT Promo & Ads Specialists, Inc.';
  desc = String(desc).replace(/\s+/g, ' ').trim().slice(0, 200);
  const img = (post && post.cover_image) ? post.cover_image : FALLBACK_IMG;
  const url = base + '/post.html?id=' + encodeURIComponent(id);

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
