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
  const first = name.split(/\s+/)[0] || 'there';
  const role = String(app.role ?? 'the role').trim();
  const client = String(app.client ?? 'CNT').trim();
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const SITE = 'https://cnt-website-ats.vercel.app';
  const LOGO = 'https://cnt-website-ats.vercel.app/assets/img/cnt-logo-white.png';
  const YEAR = new Date().getFullYear();

  const subject = `We received your application — ${role}`;
  const text =
    `Dear ${name},\n\n` +
    `Thank you for applying for the ${role} position with CNT Recruitment (${client}). ` +
    `We have received your application and our team will review it. If you're a match, we'll reach out about next steps.\n\n` +
    `Reminder: applying to CNT is always 100% free — we never ask jobseekers for payment.\n\n` +
    `Track your application anytime at ${SITE}/status.html\n\n` +
    `Warm regards,\nThe CNT Recruitment Team`;

  // Branded HTML — the SAME modern, corporate shell as the website + ATS emails
  // (api/send-auto-reply.js, supabase send-email) so every CNT email is uniform.
  const BTN = (href: string, label: string) =>
    `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 6px;"><tr>` +
    `<td style="background:#C8102E;border-radius:9px;box-shadow:0 4px 12px rgba(200,16,46,.24);">` +
    `<a href="${href}" class="btn-a" style="display:inline-block;padding:14px 32px;color:#ffffff;font-weight:700;font-size:14px;letter-spacing:.015em;text-decoration:none;">${label} <span style="font-family:Arial,sans-serif;">&rarr;</span></a></td></tr></table>`;
  const BOX = (h: string) =>
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0 4px;"><tr>` +
    `<td style="background:#F0FBF4;border:1px solid #CDEFD9;border-left:4px solid #16A34A;border-radius:10px;padding:16px 20px;font-size:13.5px;color:#12683B;line-height:1.7;">${h}</td></tr></table>`;
  const bodyHtml =
    `<p style="margin:0 0 14px;">Hi ${esc(first)},</p>` +
    `<p style="margin:0 0 14px;">Thank you for applying for <b>${esc(role)}</b>. We&rsquo;ve successfully received your application, and our recruitment team will review it shortly.</p>` +
    `<p style="margin:0 0 4px;">You can check the status of your application anytime using the button below:</p>` +
    BTN(`${SITE}/status.html`, 'Track my application') +
    BOX('<b>Friendly reminder:</b> applying to CNT is always <b>100% free</b>. We never ask jobseekers for payment. If anyone claiming to be from CNT asks you for money, it is a scam.') +
    `<p style="margin:18px 0 0;">Thanks,<br><b>The CNT Recruitment Team</b></p>`;
  const html =
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light">` +
    `<style>@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');` +
    `body{margin:0;padding:0;background:#f3f4f6;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;}img{border:0;line-height:100%;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;}a{text-decoration:none;}` +
    `body,table,td,p,h1,div,span,a{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Helvetica,Arial,sans-serif;}` +
    `h1{font-family:'Manrope','Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Helvetica,Arial,sans-serif;}` +
    `@media only screen and (max-width:620px){.card{border-radius:0!important}.pad{padding-left:24px!important;padding-right:24px!important}.pad-y{padding-top:32px!important;padding-bottom:32px!important}.head{padding-top:32px!important;padding-bottom:32px!important}.logo{height:42px!important}.h1{font-size:22px!important}.btn-a{display:block!important;text-align:center!important}.outer{padding:0!important}}</style></head><body>` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="outer" style="background:#f3f4f6;padding:36px 12px;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Helvetica,Arial,sans-serif;"><tr><td align="center">` +
    `<table role="presentation" width="600" cellpadding="0" cellspacing="0" class="card" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #ecedf1;border-radius:14px;overflow:hidden;box-shadow:0 1px 2px rgba(16,24,40,.04),0 12px 34px rgba(16,24,40,.10);">` +
    `<tr><td class="pad head" align="center" style="background:#141418;background-image:linear-gradient(180deg,#1e1e24 0%,#121216 100%);border-bottom:3px solid #C8102E;padding:40px 34px;text-align:center;"><img src="${LOGO}" alt="CNT Promo &amp; Ads Specialists, Inc." height="50" class="logo" style="height:50px;width:auto;display:inline-block;"><div style="color:#b7bbc4;font-size:11px;font-weight:600;letter-spacing:.16em;margin-top:16px;text-transform:uppercase;">A Million Jobs for a Million Filipinos.</div></td></tr>` +
    `<tr><td class="pad pad-y" style="padding:42px 44px;color:#3a3c44;font-size:15.5px;line-height:1.75;letter-spacing:.002em;"><span style="display:inline-block;background:#FDE7EA;color:#C8102E;font-size:10.5px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;padding:6px 13px;border-radius:100px;">Application Received</span><h1 class="h1" style="font-family:'Manrope','Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:26px;font-weight:800;color:#16161a;letter-spacing:-.022em;line-height:1.22;margin:18px 0 16px;">Application received!</h1>${bodyHtml}</td></tr>` +
    `<tr><td class="pad" style="background:#fafbfc;border-top:1px solid #eef0f2;padding:32px 34px;text-align:center;"><div style="font-size:12px;color:#8a8d94;line-height:1.75;">This is an automated message from <b style="color:#4b4d54;">CNT Promo &amp; Ads Specialists, Inc.</b><br>Please do not reply to this email.</div><div style="margin-top:14px;font-size:11.5px;color:#a9acb3;line-height:1.75;letter-spacing:.01em;">219 Lyfe Tower, Shaw Blvd. corner E. Jacinto St., Barangay Bagong Silan, Mandaluyong City<br><a href="mailto:hrdadmin@cntpromoads.com" style="color:#C8102E;text-decoration:none;">hrdadmin@cntpromoads.com</a> &nbsp;&middot;&nbsp; <a href="${SITE}" style="color:#C8102E;text-decoration:none;">Visit our website</a></div><div style="margin-top:20px;padding-top:16px;border-top:1px solid #eef0f2;font-size:11px;color:#bcbfc6;letter-spacing:.01em;">&copy; ${YEAR} CNT Promo &amp; Ads Specialists, Inc. All Rights Reserved.</div></td></tr>` +
    `</table><div style="font-size:11px;color:#b3b6bd;margin-top:18px;letter-spacing:.01em;">Sent by CNT Promo &amp; Ads Specialists, Inc.</div></td></tr></table></body></html>`;

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
