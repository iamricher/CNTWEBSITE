// ============================================================
//  CNT ATS — transactional email
//  Sends recruitment email (offers, refusals, interview invites)
//  via Resend, on behalf of a signed-in staff user.
//
//  Secrets required (set these in the dashboard, never in code):
//    RESEND_API_KEY   your Resend API key
//    MAIL_FROM        e.g. "CNT Recruitment <careers@yourdomain.com>"
//                     (until your domain is verified with Resend you can use
//                      "CNT Recruitment <onboarding@resend.dev>")
//
//  Security: the caller must be a signed-in user whose profile carries a
//  staff role. We reuse the very same cnt_is_staff() helper the RLS uses,
//  so this endpoint can never be a way around the database rules.
// ============================================================
import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Unauthorized' }, 401);

  // Act as the calling user so RLS + role checks apply exactly as in the app
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) return json({ error: 'Unauthorized' }, 401);

  // Same gate as the database policies — no privileged back door here
  const { data: isStaff, error: staffErr } = await supabase.rpc('cnt_is_staff');
  if (staffErr) return json({ error: 'Could not verify role' }, 500);
  if (!isStaff)  return json({ error: 'Forbidden — staff access required' }, 403);

  let payload: Record<string, unknown>;
  try { payload = await req.json(); }
  catch { return json({ error: 'Invalid JSON body' }, 400); }

  const to      = String(payload.to ?? '').trim();
  const subject = String(payload.subject ?? '').trim();
  const text    = String(payload.text ?? '').trim();
  const kind    = String(payload.kind ?? 'general');
  const ref     = payload.applicant_ref ? String(payload.applicant_ref) : null;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return json({ error: 'A valid "to" address is required' }, 400);
  if (!subject)                                return json({ error: '"subject" is required' }, 400);
  if (!text)                                   return json({ error: '"text" is required' }, 400);

  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) {
    return json({
      error: 'Email is not configured yet.',
      hint : 'Set the RESEND_API_KEY secret on this function, then try again.',
    }, 503);
  }
  const from = Deno.env.get('MAIL_FROM') ?? 'CNT Recruitment <onboarding@resend.dev>';

  // Plain text -> branded HTML (matches the website's transactional emails).
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const LOGO = 'https://uploads.onecompiler.io/43d4zm644/44t7ga3md/CNT%20Promo%20&amp;%20Ads%20Specialists,%20Inc.%202.png';
  const YEAR = new Date().getFullYear();
  const linkify = (s: string) => s.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#C8102E;font-weight:600;">$1</a>');
  const paras = esc(text).split(/\n{2,}/).map((blk) => `<p style="margin:0 0 14px;">${linkify(blk.trim().replace(/\n/g, '<br>'))}</p>`).join('');
  const html =
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<style>@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@600;700;800&family=Inter:wght@400;500;600&display=swap');body{margin:0;padding:0;background:#f4f4f5;}img{border:0;}@media only screen and (max-width:620px){.card{border-radius:0!important}.pad{padding-left:22px!important;padding-right:22px!important}}</style></head><body>` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:26px 10px;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;"><tr><td align="center">` +
    `<table role="presentation" width="600" cellpadding="0" cellspacing="0" class="card" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 6px 28px rgba(16,24,40,.10);">` +
    `<tr><td class="pad" style="background:#161616;border-bottom:3px solid #C8102E;padding:26px 34px;"><img src="${LOGO}" alt="CNT Promo & Ads Specialists, Inc." height="32" style="height:32px;width:auto;display:block;"><div style="color:#8f8f8f;font-size:11px;letter-spacing:.1em;margin-top:11px;">RECRUITMENT &middot; APPLICANT SERVICES</div></td></tr>` +
    `<tr><td class="pad" style="padding:34px;color:#3a3a3a;font-size:15px;line-height:1.65;"><span style="display:inline-block;background:#FDE7EA;color:#C8102E;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:5px 12px;border-radius:6px;">CNT Recruitment</span><div style="margin-top:16px;">${paras}</div></td></tr>` +
    `<tr><td class="pad" style="background:#fafafa;border-top:1px solid #ededed;padding:26px 34px;text-align:center;"><div style="font-size:12px;color:#8a8a8a;line-height:1.7;">This is an automated message from <b style="color:#555;">CNT Promo &amp; Ads Specialists, Inc.</b><br>Please do not reply to this email.</div><div style="margin-top:14px;font-size:11.5px;color:#aeaeae;line-height:1.7;">219 LYFE Tower, Shaw Blvd., Mandaluyong City<br><a href="mailto:hrdadmin@cntpromoads.com" style="color:#C8102E;text-decoration:none;">hrdadmin@cntpromoads.com</a></div><div style="margin-top:16px;padding-top:15px;border-top:1px solid #ededed;font-size:11px;color:#bdbdbd;">&copy; ${YEAR} CNT Promo &amp; Ads Specialists, Inc. All Rights Reserved.</div></td></tr>` +
    `</table></td></tr></table></body></html>`;

  const res = await fetch('https://api.resend.com/emails', {
    method : 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body   : JSON.stringify({ from, to: [to], subject, text, html }),
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    console.error('resend error', res.status, body);
    return json({ error: body?.message ?? 'Email provider rejected the request', status: res.status }, 502);
  }

  // Append to the tamper-evident audit trail (insert-only by policy)
  await supabase.from('audit_log').insert({
    actor_email: userData.user.email,
    action     : 'email_sent',
    entity     : 'applicant',
    entity_ref : ref,
    details    : `${kind} → ${to} · ${subject}`,
  });

  return json({ ok: true, id: body?.id ?? null });
});
