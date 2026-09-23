// ============================================================
//  CNT — lightweight protection for PUBLIC POST endpoints.
//
//  Two dependency-free layers, computed in-process:
//    1. Origin allowlist — the request must come from the CNT site. A real
//       browser form post always sends an Origin/Referer header; scripted abuse
//       from another host (to send CNT-branded email to arbitrary victims, or
//       burn the Resend quota / flood the HR inbox) does not match and is
//       rejected with 403.
//    2. Sliding-window rate limit — per-IP burst cap plus a coarse per-instance
//       global cap that protects the Resend quota.
//
//  This is a DETERRENT that rides UNDER Vercel's edge layer (Firewall rate
//  rules + BotID), not a replacement: the counters live in memory per warm
//  instance, so also add a Vercel Firewall rate-limit rule on these paths for a
//  durable, cross-instance limit. Fail-safe: a bug here never blocks real users.
// ============================================================
const ALLOWED = new Set([
  'cntpromoads.com.ph', 'www.cntpromoads.com.ph',
  'localhost', '127.0.0.1',
]);

function hostOf(u) { try { return new URL(u).hostname.toLowerCase(); } catch (_) { return ''; } }

function originHost(req) {
  const h = req.headers || {};
  return hostOf(h.origin) || hostOf(h.referer) || hostOf(h.referrer) || '';
}

// A real same-origin browser form post carries Origin (and/or Referer). Accept
// the custom domain, its sub-domains, and Vercel preview/prod deploys.
function originOk(req) {
  const host = originHost(req);
  if (!host) return false;
  if (ALLOWED.has(host)) return true;
  if (host.endsWith('.cntpromoads.com.ph')) return true;
  if (host.endsWith('.vercel.app')) return true;
  return false;
}

function ipOf(req) {
  const h = req.headers || {};
  const xff = String(h['x-forwarded-for'] || '').split(',')[0].trim();
  return xff || h['x-real-ip'] || (req.socket && req.socket.remoteAddress) || 'unknown';
}

// ip -> [timestamps within window]; GLOBAL is a coarse per-instance ring.
const HITS = new Map();
let GLOBAL = [];

function slide(arr, now, windowMs) { let i = 0; while (i < arr.length && now - arr[i] >= windowMs) i++; return i ? arr.slice(i) : arr; }

function rateOk(ip, max, windowMs, globalMax) {
  const now = Date.now();
  const arr = slide(HITS.get(ip) || [], now, windowMs);
  arr.push(now); HITS.set(ip, arr);
  GLOBAL = slide(GLOBAL, now, windowMs); GLOBAL.push(now);
  if (HITS.size > 5000) { for (const [k, v] of HITS) { if (!v.length || now - v[v.length - 1] >= windowMs) HITS.delete(k); } }
  if (globalMax && GLOBAL.length > globalMax) return false;
  return arr.length <= max;
}

// Returns true if the request was BLOCKED (a response was already sent) — the
// caller should `return` immediately. Returns false to proceed.
function guard(req, res, opts) {
  opts = opts || {};
  try {
    if (opts.origin !== false && !originOk(req)) { res.status(403).json({ ok: false, error: 'bad-origin' }); return true; }
    const max = opts.max || 6, windowMs = opts.windowMs || 60000, globalMax = opts.globalMax || 0;
    if (!rateOk(ipOf(req), max, windowMs, globalMax)) { res.status(429).json({ ok: false, error: 'rate-limited' }); return true; }
  } catch (_) { return false; } // never block real users on a guard bug
  return false;
}

module.exports = guard;
module.exports.originOk = originOk;
module.exports.ipOf = ipOf;
module.exports.rateOk = rateOk;
