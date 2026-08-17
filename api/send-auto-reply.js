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

const SITE = 'https://cnt-website-ats.vercel.app';
// White CNT logo (reads on the dark header); &amp; keeps the URL valid in HTML.
const BRAND_LOGO = 'https://uploads.onecompiler.io/43d4zm644/44t7ga3md/CNT%20Promo%20&amp;%20Ads%20Specialists,%20Inc.%202.png';

// Bulletproof-ish red button (table cell → works in most email clients).
const BTN = (href, label) =>
  '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:10px 0 4px;"><tr>' +
  '<td style="background:#C8102E;border-radius:8px;"><a href="' + href + '" style="display:inline-block;padding:13px 30px;color:#ffffff;font-weight:700;font-size:14px;text-decoration:none;">' + label + '</a></td></tr></table>';

// Info / callout box with a coloured left border (red default, green when safe).
const BOX = (html, green) =>
  '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0;"><tr>' +
  '<td style="background:' + (green ? '#ECFDF3' : '#FDECEF') + ';border-left:4px solid ' + (green ? '#16A34A' : '#C8102E') +
  ';border-radius:6px;padding:14px 18px;font-size:13.5px;color:' + (green ? '#12683B' : '#8A1020') + ';line-height:1.6;">' + html + '</td></tr></table>';

const SHELL = (eyebrow, heading, bodyHtml) =>
  '<!doctype html><html><body style="margin:0;padding:0;background:#f4f4f5;">' +
  '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:28px 12px;font-family:Arial,Helvetica,sans-serif;"><tr><td align="center">' +
  '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.07);">' +
  // dark header with the CNT logo + red accent line (payroll-style)
  '<tr><td style="background:#171717;border-bottom:3px solid #C8102E;padding:24px 32px;">' +
  '<img src="' + BRAND_LOGO + '" alt="CNT Promo &amp; Ads Specialists, Inc." height="34" style="height:34px;width:auto;display:block;border:0;outline:none;text-decoration:none;">' +
  '<div style="color:#9a9a9a;font-size:11px;letter-spacing:.06em;margin-top:10px;">EMPLOYMENT &amp; MANPOWER SERVICES</div></td></tr>' +
  // body
  '<tr><td style="padding:32px;color:#333333;font-size:15px;line-height:1.65;">' +
  '<span style="display:inline-block;background:#FDE7EA;color:#C8102E;font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;padding:5px 12px;border-radius:6px;">' + esc(eyebrow) + '</span>' +
  '<h1 style="font-size:22px;font-weight:700;color:#1a1a1a;margin:16px 0 14px;">' + heading + '</h1>' +
  bodyHtml + '</td></tr>' +
  // footer
  '<tr><td style="background:#fafafa;border-top:1px solid #eeeeee;padding:20px 32px;font-size:12px;color:#999999;line-height:1.6;">' +
  'CNT Promo &amp; Ads Specialists, Inc. &middot; 219 LYFE Tower, Shaw Blvd., Mandaluyong City<br>' +
  'This is an automated message &mdash; please do not reply to this email.</td></tr>' +
  '</table></td></tr></table></body></html>';

function template(type, data) {
  var name = esc((data.name || 'there').split(' ')[0] || 'there');
  if (type === 'application') {
    var role = esc(data.role || 'the role you applied for');
    return {
      subject: 'CNT Promo & Ads | Application Received',
      html: SHELL('Application Received', 'Application received!',
        '<p style="margin:0 0 14px;">Hi ' + name + ',</p>' +
        '<p style="margin:0 0 14px;">Thank you for applying for <b>' + role + '</b>. We&rsquo;ve successfully received your application, and our recruitment team will review it shortly.</p>' +
        '<p style="margin:0 0 4px;">You can check the status of your application anytime using the button below:</p>' +
        BTN(SITE + '/status.html', 'Track my application') +
        BOX('<b>Friendly reminder:</b> applying to CNT is always <b>100% free</b>. We never ask jobseekers for payment. If anyone claiming to be from CNT asks you for money, it is a scam.', true) +
        '<p style="margin:18px 0 0;">Thanks,<br><b>The CNT Recruitment Team</b></p>')
    };
  }
  return {
    subject: 'CNT Promo & Ads | We received your message',
    html: SHELL('Inquiry Received', 'We&rsquo;ve got your message',
      '<p style="margin:0 0 14px;">Hi ' + name + ',</p>' +
      '<p style="margin:0 0 14px;">Thank you for contacting CNT Promo &amp; Ads Specialists, Inc. We&rsquo;ve received your message and a member of our team will get back to you as soon as possible &mdash; usually within one business day.</p>' +
      BTN(SITE + '/services.html', 'Explore our services') +
      BOX('Need something urgent? Reach us at <b>8293-5269</b> or <a href="mailto:hrdadmin@cntpromoads.com" style="color:#C8102E;text-decoration:none;">hrdadmin@cntpromoads.com</a>.') +
      '<p style="margin:18px 0 0;">Best regards,<br><b>CNT Promo &amp; Ads Specialists, Inc.</b></p>')
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
