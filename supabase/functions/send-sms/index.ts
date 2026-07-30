// ============================================================
//  CNT ATS — transactional SMS
//  Sends recruitment SMS (interview invites, reminders) via
//  Semaphore (a Philippine SMS gateway), on behalf of a signed-in
//  staff user. Semaphore is used because PH applicants respond to
//  SMS far more than email.
//
//  Secrets required (set in the dashboard, never in code):
//    SEMAPHORE_API_KEY   your Semaphore API key
//    SEMAPHORE_SENDER    (optional) approved sender name; defaults to Semaphore's
//
//  Security: same cnt_is_staff() gate as the database RLS, so this
//  endpoint can never be a back door around the rules.
// ============================================================
import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

// Normalise a PH mobile number to Semaphore's 639XXXXXXXXX form.
function phDigits(raw: string): string | null {
  let d = String(raw).replace(/[^\d]/g, '');
  if (d.startsWith('0')) d = '63' + d.slice(1);
  else if (d.startsWith('9') && d.length === 10) d = '63' + d;
  else if (d.startsWith('639')) { /* already good */ }
  else if (d.startsWith('63')) { /* assume ok */ }
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

  const number  = phDigits(String(payload.to ?? ''));
  const message = String(payload.message ?? '').trim();
  const kind    = String(payload.kind ?? 'general');
  const ref     = payload.applicant_ref ? String(payload.applicant_ref) : null;

  if (!number)  return json({ error: 'A valid PH mobile number is required' }, 400);
  if (!message) return json({ error: '"message" is required' }, 400);

  const apiKey = Deno.env.get('SEMAPHORE_API_KEY');
  if (!apiKey) {
    return json({ error: 'SMS is not configured yet.', hint: 'Set the SEMAPHORE_API_KEY secret on this function, then try again.' }, 503);
  }
  const sender = Deno.env.get('SEMAPHORE_SENDER') ?? '';

  const form = new URLSearchParams();
  form.set('apikey', apiKey);
  form.set('number', number);
  form.set('message', message.slice(0, 640));   // Semaphore splits into segments
  if (sender) form.set('sendername', sender);

  const res = await fetch('https://api.semaphore.co/api/v4/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  });
  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    console.error('semaphore error', res.status, body);
    return json({ error: (body && (body.message || JSON.stringify(body))) || 'SMS provider rejected the request', status: res.status }, 502);
  }

  await supabase.from('audit_log').insert({
    actor_email: userData.user.email,
    action     : 'sms_sent',
    entity     : 'applicant',
    entity_ref : ref,
    details    : `${kind} → ${number}`,
  });

  return json({ ok: true, id: Array.isArray(body) && body[0] ? body[0].message_id ?? null : null });
});
