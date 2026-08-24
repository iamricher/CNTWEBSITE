// ============================================================
//  CNT — application intake proxy (Vercel Serverless Function)
//
//  The public careers form posts here instead of straight to Supabase, so the
//  endpoint can be protected at the edge (Vercel Firewall: Bot Protection +
//  a rate-limit rule on /api/apply) and validated server-side. It inserts with
//  the PUBLIC anon key, so the tightened RLS ("apps insert anon" — fresh 'new'
//  rows only) still governs the write; the function never lets the client set
//  stage/decision fields.
//
//  Optional: if @vercel/botid is installed and BotID is enabled on the project,
//  requests flagged as bots are rejected. Fail-open so a misconfig never blocks
//  a real applicant. To fully force traffic through here later, set a service
//  key on this function + remove the "apps insert anon" policy (see docs).
// ============================================================
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://mtaknpmvvldmnsizvtuy.supabase.co';
const ANON = process.env.SUPABASE_ANON_KEY || 'sb_publishable_GYmTJWeUriWXjFkO9j2J7w_cwJNV0Au';

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  // Optional Vercel BotID check (active only when installed + enabled).
  try {
    const mod = await import('@vercel/botid/server');
    const verdict = await mod.checkBotId();
    if (verdict && verdict.isBot) { res.status(403).json({ error: 'Automated submissions are not allowed.' }); return; }
  } catch (_) { /* BotID not installed/enabled — skip, don't block real users */ }

  const b = (req.body && typeof req.body === 'object') ? req.body
          : (() => { try { return JSON.parse(req.body || '{}'); } catch { return {}; } })();

  // Honeypot: a filled company_website means a bot — pretend success, insert nothing.
  if (b.company_website) { res.status(200).json({ ok: true }); return; }

  const name  = String(b.name  || '').trim();
  const email = String(b.email || '').trim();
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'A name and a valid email are required.' }); return;
  }

  const clip = (v, n) => (v == null ? null : String(v).slice(0, n)) || null;

  // Force a fresh 'new' application — never trust client-set workflow fields.
  const row = {
    name, email,
    phone: b.phone || null, role: b.role || null, client: b.client || null,
    location: b.location || null, experience: b.experience || null,
    source: b.source || 'Website', cover_note: b.cover_note || null,
    resume_url: b.resume_url || null, job_id: (b.job_id ?? null),
    referred_by: b.referred_by || null, referral_relation: b.referral_relation || null,
    // Campaign attribution — which tagged link produced this applicant.
    utm_source: clip(b.utm_source, 60), utm_medium: clip(b.utm_medium, 60), utm_campaign: clip(b.utm_campaign, 80),
    consent_at: new Date().toISOString(), stage: 'new',
  };

  const post = (payload) => fetch(SUPABASE_URL + '/rest/v1/applications', {
    method: 'POST',
    headers: { apikey: ANON, Authorization: 'Bearer ' + ANON, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(payload),
  });

  let r;
  try {
    r = await post(row);
  } catch (e) { res.status(502).json({ error: 'Could not reach the application service.' }); return; }

  if (!r.ok) {
    const t = await r.text().catch(() => '');
    // 23505 = they already applied for this exact posting
    if (/duplicate key|unique constraint|23505/i.test(t)) { res.status(409).json({ error: 'You have already applied for this position.' }); return; }
    // If the UTM columns aren't there yet, still record the application.
    if (/column|schema cache|does not exist/i.test(t)) {
      const { utm_source, utm_medium, utm_campaign, ...core } = row;
      const r2 = await post(core).catch(() => null);
      if (r2 && r2.ok) { res.status(201).json({ ok: true }); return; }
      const t2 = r2 ? await r2.text().catch(() => '') : '';
      if (/duplicate key|unique constraint|23505/i.test(t2)) { res.status(409).json({ error: 'You have already applied for this position.' }); return; }
    }
    res.status(502).json({ error: 'Could not submit your application.' }); return;
  }
  res.status(201).json({ ok: true });
};
