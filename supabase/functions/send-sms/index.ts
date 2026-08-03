// ============================================================
//  CNT ATS — transactional SMS
//  Sends recruitment SMS (interview invites, reminders) on behalf
//  of a signed-in staff user. Two backends, pick whichever you set:
//
//   A) DIY Android gateway (FREE per-SMS — uses your own phone + SIM):
//        SMS_GATEWAY_URL    e.g. https://api.sms-gate.app/3rdparty/v1/message
//        SMS_GATEWAY_USER   username from the gateway app
//        SMS_GATEWAY_PASS   password from the gateway app
//      Works with SMSGate (sms-gate.app) cloud mode, or any endpoint that
//      accepts POST {message, phoneNumbers:[E164]} with Basic auth.
//
//   B) Semaphore (paid PH gateway):
//        SEMAPHORE_API_KEY  your Semaphore key
//        SEMAPHORE_SENDER   (optional) approved sender name
//
//  If SMS_GATEWAY_URL is set it wins; otherwise Semaphore is used.
//
//  Security: same cnt_is_staff() gate as the database RLS — never a back door.
// ============================================================
import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

// Normalise a PH mobile number to 639XXXXXXXXX.
function phDigits(raw: string): string | null {
  let d = String(raw).replace(/[^\d]/g, '');
  if (d.startsWith('0')) d = '63' + d.slice(1);
  else if (d.startsWith('9') && d.length === 10) d = '63' + d;
  return /^639\d{9}$/.test(d) ? d : null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Unauthorized' }, 401);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) return json({ error: 'Unauthorized' }, 401);

  const { data: isStaff, error: staffErr } = await supabase.rpc('cnt_is_staff');
  if (staffErr) return json({ error: 'Could not verify role' }, 500);
  if (!isStaff)  return json({ error: 'Forbidden — staff access required' }, 403);

  let payload: Record<string, unknown>;
  try { payload = await req.json(); }
  catch { return json({ error: 'Invalid JSON body' }, 400); }

  const number  = phDigits(String(payload.to ?? ''));   // 639XXXXXXXXX
  const message = String(payload.message ?? '').trim();
  const kind    = String(payload.kind ?? 'general');
  const ref     = payload.applicant_ref ? String(payload.applicant_ref) : null;

  if (!number)  return json({ error: 'A valid PH mobile number is required' }, 400);
  if (!message) return json({ error: '"message" is required' }, 400);

  const gatewayUrl = Deno.env.get('SMS_GATEWAY_URL');
  const apiKey     = Deno.env.get('SEMAPHORE_API_KEY');

  let ok = false, providerId: string | null = null, errText = '';

  if (gatewayUrl) {
    // A) DIY Android gateway (SMSGate-compatible): POST {message, phoneNumbers:[E164]}
    const user = Deno.env.get('SMS_GATEWAY_USER') ?? '';
    const pass = Deno.env.get('SMS_GATEWAY_PASS') ?? '';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (user || pass) headers['Authorization'] = 'Basic ' + btoa(`${user}:${pass}`);
    const res = await fetch(gatewayUrl, {
      method: 'POST', headers,
      body: JSON.stringify({ message, phoneNumbers: ['+' + number] }),
    });
    const body = await res.json().catch(() => ({}));
    ok = res.ok;
    providerId = (body && (body.id ?? body.messageId)) ?? null;
    if (!ok) { console.error('sms gateway error', res.status, body); errText = (body && (body.message || JSON.stringify(body))) || `gateway HTTP ${res.status}`; }
  } else if (apiKey) {
    // B) Semaphore
    const sender = Deno.env.get('SEMAPHORE_SENDER') ?? '';
    const form = new URLSearchParams();
    form.set('apikey', apiKey);
    form.set('number', number);
    form.set('message', message.slice(0, 640));
    if (sender) form.set('sendername', sender);
    const res = await fetch('https://api.semaphore.co/api/v4/messages', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form.toString(),
    });
    const body = await res.json().catch(() => ({}));
    ok = res.ok;
    providerId = Array.isArray(body) && body[0] ? body[0].message_id ?? null : null;
    if (!ok) { console.error('semaphore error', res.status, body); errText = (body && (body.message || JSON.stringify(body))) || `semaphore HTTP ${res.status}`; }
  } else {
    return json({
      error: 'SMS is not configured yet.',
      hint : 'Set SMS_GATEWAY_URL (+ USER/PASS) for the free DIY Android gateway, or SEMAPHORE_API_KEY for Semaphore.',
    }, 503);
  }

  if (!ok) return json({ error: errText || 'SMS provider rejected the request' }, 502);

  await supabase.from('audit_log').insert({
    actor_email: userData.user.email,
    action     : 'sms_sent',
    entity     : 'applicant',
    entity_ref : ref,
    details    : `${kind} → ${number}`,
  });

  return json({ ok: true, id: providerId });
});
