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

  // Plain text -> simple, safe HTML (escape first, then honour newlines)
  const esc = (s: string) => s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const html = `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:14px;line-height:1.6;color:#0f172a;white-space:pre-wrap;">${esc(text)}</div>`;

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
