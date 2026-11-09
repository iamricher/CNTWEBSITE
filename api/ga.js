// ============================================================
//  CNT — Google Analytics 4 Data API proxy (Vercel Serverless Function)
//
//  Returns aggregate GA4 metrics so the Content Studio dashboard can show the
//  real Google Analytics numbers natively — no Looker iframe, no GA website.
//  Signs a JWT with Node's built-in crypto and exchanges it for an access
//  token, so there are NO npm dependencies to install.
//
//  ONE-TIME SETUP — add these Project env vars in Vercel, then redeploy:
//    GA_PROPERTY_ID      the GA4 property id, digits only (e.g. 555203404)
//    GA_SA_CLIENT_EMAIL  the service account email (…@….iam.gserviceaccount.com)
//    GA_SA_PRIVATE_KEY   the service account private key (-----BEGIN PRIVATE KEY----- …)
//  …and grant that service account "Viewer" on the GA4 property
//  (GA Admin → Property Access Management). Until the env vars are set this
//  returns { configured:false } so the dashboard quietly keeps its own data.
//
//  Returns only aggregate, non-personal counts. Response is edge-cached 5 min.
// ============================================================
const crypto = require('crypto');

const PROPERTY_ID = (process.env.GA_PROPERTY_ID || '').replace(/\D/g, '');
const SA_EMAIL = process.env.GA_SA_CLIENT_EMAIL || '';
const SA_KEY = (process.env.GA_SA_PRIVATE_KEY || '').replace(/\\n/g, '\n');

const b64url = (buf) =>
  Buffer.from(buf).toString('base64').replace(/=+$/g, '').replace(/\+/g, '-').replace(/\//g, '_');

async function accessToken() {
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64url(JSON.stringify({
    iss: SA_EMAIL,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now, exp: now + 3600,
  }));
  const signed = head + '.' + claim;
  const sig = b64url(crypto.createSign('RSA-SHA256').update(signed).sign(SA_KEY));
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + signed + '.' + sig,
  });
  const j = await r.json();
  if (!j.access_token) throw new Error('auth failed: ' + (j.error_description || j.error || 'no token'));
  return j.access_token;
}

const api = (token, method, body) =>
  fetch('https://analyticsdata.googleapis.com/v1beta/properties/' + PROPERTY_ID + ':' + method, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then((r) => r.json());

const rows = (rep) => (rep && rep.rows) || [];
const n = (v) => Number(v || 0);

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=900');
  if (!PROPERTY_ID || !SA_EMAIL || !SA_KEY) { res.status(200).json({ configured: false }); return; }

  const days = Math.min(Math.max(parseInt((req.query && req.query.days) || '28', 10) || 28, 1), 365);
  const dateRanges = [{ startDate: days + 'daysAgo', endDate: 'today' }];

  try {
    const token = await accessToken();
    const [totals, trend, pages, countries, rt] = await Promise.all([
      api(token, 'runReport', { dateRanges, metrics: [{ name: 'screenPageViews' }, { name: 'totalUsers' }, { name: 'sessions' }, { name: 'newUsers' }] }),
      api(token, 'runReport', { dateRanges, dimensions: [{ name: 'date' }], metrics: [{ name: 'screenPageViews' }, { name: 'totalUsers' }], orderBys: [{ dimension: { dimensionName: 'date' } }] }),
      api(token, 'runReport', { dateRanges, dimensions: [{ name: 'pagePath' }], metrics: [{ name: 'screenPageViews' }], orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }], limit: 15 }),
      api(token, 'runReport', { dateRanges, dimensions: [{ name: 'country' }], metrics: [{ name: 'totalUsers' }], orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }], limit: 10 }),
      api(token, 'runRealtimeReport', { metrics: [{ name: 'activeUsers' }] }).catch(() => ({})),
    ]);

    const err = totals && totals.error;
    if (err) { res.status(200).json({ configured: true, error: (err.message || 'GA API error') }); return; }

    const tv = (rows(totals)[0] && rows(totals)[0].metricValues) || [];
    res.status(200).json({
      configured: true,
      days,
      totals: {
        views: n(tv[0] && tv[0].value),
        users: n(tv[1] && tv[1].value),
        sessions: n(tv[2] && tv[2].value),
        newUsers: n(tv[3] && tv[3].value),
      },
      active: rows(rt)[0] ? n(rows(rt)[0].metricValues[0].value) : 0,
      trend: rows(trend).map((r) => ({ date: r.dimensionValues[0].value, views: n(r.metricValues[0].value), users: n(r.metricValues[1].value) })),
      topPages: rows(pages).map((r) => ({ path: r.dimensionValues[0].value, views: n(r.metricValues[0].value) })),
      topCountries: rows(countries).map((r) => ({ country: r.dimensionValues[0].value, users: n(r.metricValues[0].value) })),
    });
  } catch (e) {
    res.status(200).json({ configured: true, error: String((e && e.message) || e) });
  }
};
