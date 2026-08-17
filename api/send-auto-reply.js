// ============================================================
//  CNT — transactional auto-reply emails via Resend.
//
//  Sends a confirmation email to whoever submits the contact form or a job
//  application. Runs server-side so the Resend API key is never exposed to
//  the browser. Configure two Vercel environment variables:
//    RESEND_API_KEY  – your Resend API key (secret)
//    RESEND_FROM     – verified sender, e.g. "CNT Promo & Ads <noreply@mail.cntpromoads.com>"
//  The sending domain/subdomain must be verified in Resend (add the DNS
//  records it gives you at GoDaddy, exactly like your payroll subdomain).
//
//  Best-effort: if the key isn't set or Resend fails, it returns 200 so the
//  form submission itself is never blocked by the email step.
// ============================================================
const esc = (s) => String(s == null ? '' : s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || ''));

function readBody(req) {
  return new Promise((resolve) => {
    if (req.body) { try { return resolve(typeof req.body === 'string' ? JSON.parse(req.body) : req.body); } catch (_) { return resolve({}); } }
    var data = '';
    req.on('data', (c) => { data += c; if (data.length > 20000) req.destroy(); });
    req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch (_) { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}

const SHELL = (title, bodyHtml) =>
  '<!doctype html><html><body style="margin:0;background:#f5f5f5;padding:24px 0;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;">' +
  '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">' +
  '<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,.08);">' +
  '<tr><td style="background:linear-gradient(135deg,#1a1a1a,#000);padding:26px 32px;">' +
  '<span style="color:#fff;font-size:19px;font-weight:800;letter-spacing:-.02em;">CNT Promo &amp; Ads Specialists, Inc.</span>' +
  '<div style="color:#E5213F;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;margin-top:4px;">' + esc(title) + '</div></td></tr>' +
  '<tr><td style="padding:32px;font-size:15px;line-height:1.65;color:#333;">' + bodyHtml + '</td></tr>' +
  '<tr><td style="padding:20px 32px;background:#fafafa;border-top:1px solid #eee;font-size:12px;color:#8a8a8a;line-height:1.6;">' +
  'CNT Promo &amp; Ads Specialists, Inc. · 219 LYFE Tower, Shaw Blvd., Mandaluyong City<br>' +
  'This is an automated message — please do not reply directly to this email.</td></tr>' +
  '</table></td></tr></table></body></html>';

function template(type, data) {
  var name = esc(data.name || 'there').split(' ')[0] || 'there';
  if (type === 'application') {
    var role = esc(data.role || 'the role you applied for');
    return {
      subject: 'We received your application — CNT Promo & Ads Specialists, Inc.',
      html: SHELL('Application Received',
        '<p>Hi ' + name + ',</p>' +
        '<p>Thank you for applying for <b>' + role + '</b>. We’ve successfully received your application, and our recruitment team will review it shortly.</p>' +
        '<p>If your profile matches the role, we’ll reach out using the contact details you provided. In the meantime, feel free to explore other openings on our website.</p>' +
        '<p style="background:#ECFDF3;border:1px solid #A6E7C3;border-radius:10px;padding:12px 16px;color:#12683B;font-size:14px;"><b>A friendly reminder:</b> applying to CNT is always <b>100% free</b>. We never ask jobseekers for payment. If anyone claiming to be from CNT asks you for money, it is a scam.</p>' +
        '<p>Best regards,<br><b>The CNT Recruitment Team</b></p>')
    };
  }
  return {
    subject: 'Thanks for reaching out — CNT Promo & Ads Specialists, Inc.',
    html: SHELL('Inquiry Received',
      '<p>Hi ' + name + ',</p>' +
      '<p>Thank you for contacting CNT Promo &amp; Ads Specialists, Inc. We’ve received your message and a member of our team will get back to you as soon as possible — usually within one business day.</p>' +
      '<p>If your concern is urgent, you may also reach us at <b>8293-5269</b> or <a href="mailto:hrdadmin@cntpromoads.com" style="color:#C8102E;">hrdadmin@cntpromoads.com</a>.</p>' +
      '<p>Best regards,<br><b>CNT Promo &amp; Ads Specialists, Inc.</b></p>')
  };
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') { res.status(405).json({ ok: false, error: 'method' }); return; }

  const body = await readBody(req);
  const type = body.type === 'application' ? 'application' : 'contact';
  const to = String(body.to || '').trim();
  if (!validEmail(to)) { res.status(200).json({ ok: false, error: 'invalid-email' }); return; }

  const KEY = process.env.RESEND_API_KEY;
  const FROM = process.env.RESEND_FROM || 'CNT Promo & Ads Specialists, Inc. <onboarding@resend.dev>';
  if (!KEY) { res.status(200).json({ ok: false, error: 'not-configured' }); return; } // no-op until set up

  const tpl = template(type, body);
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: [to], subject: tpl.subject, html: tpl.html, reply_to: 'hrdadmin@cntpromoads.com' })
    });
    const out = await r.json().catch(() => ({}));
    if (!r.ok) { res.status(200).json({ ok: false, error: (out && out.message) || 'send-failed' }); return; }
    res.status(200).json({ ok: true, id: out && out.id });
  } catch (e) {
    res.status(200).json({ ok: false, error: 'exception' });
  }
};
