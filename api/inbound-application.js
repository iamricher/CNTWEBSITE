// ============================================================
//  CNT — email application intake (Vercel Serverless Function)
//
//  Turns an emailed application into an ATS applicant. Point an inbound-email
//  service at this endpoint and it parses the message + creates a 'new'
//  application; the DB insert trigger then emails the branded confirmation to
//  the applicant (recipient-locked), exactly like a website application.
//
//  SETUP (one time):
//   1. Set two Vercel env vars on the project:
//        INBOUND_EMAIL_SECRET  – any long random string you choose (the shared key)
//        (SUPABASE_URL / SUPABASE_ANON_KEY already exist from the apply proxy)
//   2. Create an inbound route at your email provider that forwards a mailbox
//      (e.g. jobs@cntpromoads.com) to:
//        POST https://cnt-website-ats.vercel.app/api/inbound-application?token=YOUR_SECRET
//      Providers that POST JSON or url-encoded form fields work out of the box —
//      Mailgun Routes ("store and notify"), CloudMailin (JSON format), Postmark
//      inbound, etc. (SendGrid Inbound Parse posts multipart/form-data, which
//      Vercel doesn't parse by default — prefer a JSON/url-encoded provider.)
//
//  SECURITY: without INBOUND_EMAIL_SECRET set, every request is rejected
//  (fail-closed), so the endpoint is inert until you deliberately configure it.
//  It only ever inserts a fresh 'new' row with the public anon key, so the same
//  RLS that governs the website form governs this too.
// ============================================================
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://mtaknpmvvldmnsizvtuy.supabase.co';
const ANON = process.env.SUPABASE_ANON_KEY || 'sb_publishable_GYmTJWeUriWXjFkO9j2J7w_cwJNV0Au';
const SECRET = process.env.INBOUND_EMAIL_SECRET || '';

// First non-empty value among a list of candidate keys.
function pick(obj, keys) {
  if (!obj) return '';
  for (const k of keys) { const v = obj[k]; if (v != null && String(v).trim() !== '') return String(v); }
  return '';
}
// "Juan Dela Cruz" <juan@email.com>  ·  Juan <juan@email.com>  ·  juan@email.com
function parseFrom(from) {
  const s = String(from || '');
  const m = s.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  if (m) return { name: m[1].trim(), email: m[2].trim() };
  const em = s.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
  return { name: '', email: em ? em[0] : '' };
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  // Shared-secret gate — only your configured inbound route may post here.
  const token = (req.query && req.query.token) || (req.headers && req.headers['x-inbound-token']) || '';
  if (!SECRET || token !== SECRET) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const b = (req.body && typeof req.body === 'object') ? req.body
          : (() => { try { return JSON.parse(req.body || '{}'); } catch { return {}; } })();

  // Sender / subject / body across common provider field names.
  const fromRaw = pick(b, ['from', 'From', 'sender', 'envelope_from']) || pick(b.envelope || {}, ['from']);
  const { name: fromName, email } = parseFrom(fromRaw);
  const subject = pick(b, ['subject', 'Subject']) || pick(b.headers || {}, ['subject', 'Subject']);
  const body = pick(b, ['text', 'body-plain', 'stripped-text', 'plain', 'TextBody', 'body']);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { res.status(400).json({ error: 'No valid sender email found.' }); return; }
  const name = (fromName || email.split('@')[0]).slice(0, 120);

  // Try to read the role out of the subject ("Applying for Merchandiser", "Application - Cashier").
  let role = null;
  const rm = subject.match(/(?:applic\w*|applying|position|role of|for the role of|for)\s*[:\-]?\s*(.+)$/i);
  if (rm && rm[1]) {
    const r = rm[1]
      .replace(/^(?:\s*(?:for|the|a|an|to|role|position|of)\b)+/i, '') // strip leading connectives ("for the role of")
      .replace(/\bposition\b|\bapplication\b|\brole\b/ig, '')          // drop filler words
      .replace(/^[.\-–—:\s]+|[.\-–—:\s]+$/g, '')                       // trim punctuation both ends
      .trim();
    if (r) role = r.slice(0, 120);
  }

  // Phone from the body (PH-aware — same shape as the résumé parser).
  const phoneRaw = (String(body).match(/(?:\+?63|0)\s?9\d{2}[\s.\-]?\d{3}[\s.\-]?\d{4}/) || [])[0] || '';
  const phone = phoneRaw ? phoneRaw.replace(/\s+/g, ' ').trim() : null;

  const attCount = Array.isArray(b.attachments) ? b.attachments.length
                 : (parseInt(b.attachments || b['attachment-count'] || 0, 10) || 0);
  const note = ('Received by email' + (subject ? (' — subject: ' + subject) : '') +
    (attCount ? ('\n[' + attCount + ' attachment(s) in the original email — attach the CV manually]') : '') +
    (body ? ('\n\n' + String(body).slice(0, 4000)) : '')).slice(0, 6000);

  const row = {
    name, email, phone, role,
    source: 'Email', cover_note: note, stage: 'new',
    consent_at: new Date().toISOString(),
  };

  let r;
  try {
    r = await fetch(SUPABASE_URL + '/rest/v1/applications', {
      method: 'POST',
      headers: { apikey: ANON, Authorization: 'Bearer ' + ANON, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(row),
    });
  } catch (e) { res.status(502).json({ error: 'Could not reach the application service.' }); return; }

  if (!r.ok) {
    const t = await r.text().catch(() => '');
    if (/duplicate key|unique constraint|23505/i.test(t)) { res.status(200).json({ ok: true, note: 'duplicate — already applied' }); return; }
    console.error('inbound-application insert', r.status, t);
    res.status(502).json({ error: 'Could not create the application.' }); return;
  }
  res.status(201).json({ ok: true });
};
