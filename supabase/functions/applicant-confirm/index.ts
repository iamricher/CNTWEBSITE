// ============================================================
//  CNT ATS — applicant confirmation email
//  Sends a "we received your application" email the moment someone
//  applies on the public careers page.
//
//  Why a separate function from send-email:
//    send-email is staff-gated (only signed-in recruiters may send, to any
//    address). This one is called by the PUBLIC careers page, so it must be
//    safe without a login. It is:
//      • recipient-locked — it emails ONLY the address stored on the
//        application row it looks up by id (never an address from the caller),
//        so it can't be used to send mail to arbitrary people;
//      • single-shot — it stamps confirmation_sent_at and refuses to send
//        twice, so it can't be replayed to spam a real applicant;
//      • self-authorising via the service role (injected by Supabase), so it
//        never trusts caller input for anything but the row id.
//
//  Deploy with JWT verification DISABLED (it does its own validation):
//    supabase functions deploy applicant-confirm --no-verify-jwt
//
//  Secrets (shared with send-email): RESEND_API_KEY, MAIL_FROM.
//  SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.
// ============================================================
import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let payload: Record<string, unknown>;
  try { payload = await req.json(); }
  catch { return json({ error: 'Invalid JSON body' }, 400); }

  // Accept either { application_id } or a DB-webhook shape { record: { id } }.
  const rec = (payload.record ?? null) as Record<string, unknown> | null;
  const rawId = payload.application_id ?? (rec ? rec.id : undefined);
  const id = Number(rawId);
  if (!Number.isFinite(id) || id <= 0) return json({ error: 'A valid application_id is required' }, 400);

  const url = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(url, serviceKey);

  // Look the row up ourselves — the recipient is whatever is stored here, never
  // anything the caller sent. Only send once.
  const { data: app, error: selErr } = await admin
    .from('applications')
    .select('id, name, email, role, client, location, confirmation_sent_at')
    .eq('id', id)
    .maybeSingle();
  if (selErr) return json({ error: 'Lookup failed' }, 500);
  if (!app) return json({ error: 'Not found' }, 404);
  if (app.confirmation_sent_at) return json({ ok: true, skipped: 'already_sent' });
  if (!app.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(app.email))) {
    return json({ ok: true, skipped: 'no_email' });
  }

  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) return json({ error: 'Email is not configured', hint: 'Set RESEND_API_KEY' }, 503);
  const from = Deno.env.get('MAIL_FROM') ?? 'CNT Recruitment <onboarding@resend.dev>';

  const name = String(app.name ?? '').trim() || 'there';
  const role = String(app.role ?? 'the role').trim();
  const client = String(app.client ?? 'CNT').trim();
  const subject = `We received your application — ${role}`;
  const text =
    `Dear ${name},\n\n` +
    `Thank you for applying for the ${role} position with CNT Recruitment (${client}). ` +
    `We have received your application and our team will review it. If you're a match, we'll reach out about next steps.\n\n` +
    `You can check your application status any time at your convenience.\n\n` +
    `Warm regards,\nCNT Recruitment Team`;
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const html = `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:14px;line-height:1.6;color:#0f172a;white-space:pre-wrap;">${esc(text)}</div>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [String(app.email)], subject, text, html }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('resend error', res.status, body);
    return json({ error: body?.message ?? 'Email provider rejected the request' }, 502);
  }

  // Stamp so it can never be sent twice, and leave an audit trail.
  await admin.from('applications').update({ confirmation_sent_at: new Date().toISOString() }).eq('id', id);
  await admin.from('audit_log').insert({
    actor_email: 'system',
    action: 'application_confirmation_sent',
    entity: 'applicant',
    entity_ref: String(id),
    details: `auto-confirmation → ${app.email}`,
  }).then(() => {}, () => {}); // best-effort

  return json({ ok: true, id: body?.id ?? null });
});
