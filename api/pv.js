// ============================================================
//  CNT — page-view logger with coarse geo (Vercel Serverless Function)
//
//  The site's pageview beacon POSTs here instead of writing to Supabase
//  directly, so the server can attach the visitor's country / region / city
//  from Vercel's edge geo-IP headers. Only those coarse fields are stored —
//  never the raw IP address. Then it inserts one row into public.page_views
//  with the same anon key + RLS the client used.
//
//  No setup needed: SUPABASE_URL / SUPABASE_ANON_KEY already exist, and Vercel
//  populates the x-vercel-ip-* headers automatically on every request.
//  Run supabase/2026-08-20-pageview-geo.sql once to add the geo columns.
// ============================================================
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://mtaknpmvvldmnsizvtuy.supabase.co';
const ANON = process.env.SUPABASE_ANON_KEY || 'sb_publishable_GYmTJWeUriWXjFkO9j2J7w_cwJNV0Au';

const clip = (v, n) => (v == null ? null : String(v).slice(0, n)) || null;

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const b = (req.body && typeof req.body === 'object') ? req.body
          : (() => { try { return JSON.parse(req.body || '{}'); } catch { return {}; } })();

  const h = req.headers || {};
  const dec = (v) => { try { return v ? decodeURIComponent(v) : null; } catch { return v || null; } };

  const row = {
    path:       clip(b.path || '/', 300),
    visitor_id: clip(b.visitor_id, 80),
    referrer:   clip(b.referrer, 200),
    // Vercel edge geo — coarse only, no raw IP is ever stored.
    country:    clip(h['x-vercel-ip-country'], 4),
    region:     clip(h['x-vercel-ip-country-region'], 12),
    city:       clip(dec(h['x-vercel-ip-city']), 120),
    // Campaign attribution — where a shared link sent them from.
    utm_source:   clip(b.utm_source, 60),
    utm_medium:   clip(b.utm_medium, 60),
    utm_campaign: clip(b.utm_campaign, 80),
  };

  try {
    const r = await fetch(SUPABASE_URL + '/rest/v1/page_views', {
      method: 'POST',
      headers: { apikey: ANON, Authorization: 'Bearer ' + ANON, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(row),
    });
    if (!r.ok) {
      // If the geo columns aren't there yet, still log the core view.
      const t = await r.text().catch(() => '');
      if (/column|schema cache|does not exist/i.test(t)) {
        // Drop the campaign fields first (keep geo) in case only the UTM
        // migration hasn't run yet; fall back to the core row if geo is also new.
        const noUtm = { path: row.path, visitor_id: row.visitor_id, referrer: row.referrer, country: row.country, region: row.region, city: row.city };
        const r2 = await fetch(SUPABASE_URL + '/rest/v1/page_views', {
          method: 'POST',
          headers: { apikey: ANON, Authorization: 'Bearer ' + ANON, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
          body: JSON.stringify(noUtm),
        }).catch(() => null);
        if (!r2 || !r2.ok) {
          await fetch(SUPABASE_URL + '/rest/v1/page_views', {
            method: 'POST',
            headers: { apikey: ANON, Authorization: 'Bearer ' + ANON, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
            body: JSON.stringify({ path: row.path, visitor_id: row.visitor_id, referrer: row.referrer }),
          }).catch(() => {});
        }
      }
    }
  } catch (_) { /* never let analytics break a page */ }

  res.status(204).end();
};
