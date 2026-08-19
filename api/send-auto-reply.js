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
const BRAND_LOGO = 'https://cnt-website-ats.vercel.app/assets/img/cnt-logo-white.png';

// Bulletproof-ish red button (table cell → works in most email clients).
const BTN = (href, label) =>
  '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 6px;"><tr>' +
  '<td style="background:#C8102E;border-radius:9px;box-shadow:0 4px 12px rgba(200,16,46,.24);">' +
  '<a href="' + href + '" class="btn-a" style="display:inline-block;padding:14px 32px;color:#ffffff;font-weight:700;font-size:14px;letter-spacing:.015em;text-decoration:none;">' + label +
  ' <span style="font-family:Arial,sans-serif;">&rarr;</span></a></td></tr></table>';

// Info / callout box with a coloured left border (red default, green when safe).
const BOX = (html, green) =>
  '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0 4px;"><tr>' +
  '<td style="background:' + (green ? '#F0FBF4' : '#FEF2F4') + ';border:1px solid ' + (green ? '#CDEFD9' : '#F7D4DB') +
  ';border-left:4px solid ' + (green ? '#16A34A' : '#C8102E') +
  ';border-radius:12px;padding:16px 20px;font-size:13.5px;color:' + (green ? '#12683B' : '#8A1020') + ';line-height:1.65;">' + html + '</td></tr></table>';

const SHELL = (eyebrow, heading, bodyHtml) =>
  '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width,initial-scale=1">' +
  '<meta name="color-scheme" content="light">' +
  '<style>' +
  "@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');" +
  'body{margin:0;padding:0;background:#f3f4f6;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;}' +
  'img{border:0;line-height:100%;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;}' +
  'a{text-decoration:none;}' +
  'body,table,td,p,h1,div,span,a{font-family:\'Inter\',-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,\'Helvetica Neue\',Helvetica,Arial,sans-serif;}' +
  'h1{font-family:\'Manrope\',\'Inter\',-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,\'Helvetica Neue\',Helvetica,Arial,sans-serif;}' +
  '@media only screen and (max-width:620px){' +
  '.card{border-radius:0!important;}' +
  '.pad{padding-left:24px!important;padding-right:24px!important;}' +
  '.pad-y{padding-top:32px!important;padding-bottom:32px!important;}' +
  '.head{padding-top:32px!important;padding-bottom:32px!important;}' +
  '.logo{height:42px!important;}' +
  '.h1{font-size:22px!important;}' +
  '.btn-a{display:block!important;text-align:center!important;}' +
  '.outer{padding:0!important;}' +
  '}</style></head>' +
  '<body>' +
  '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="outer" style="background:#f3f4f6;padding:36px 12px;font-family:\'Inter\',-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,\'Helvetica Neue\',Helvetica,Arial,sans-serif;"><tr><td align="center">' +
  '<table role="presentation" width="600" cellpadding="0" cellspacing="0" class="card" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #ecedf1;border-radius:14px;overflow:hidden;box-shadow:0 1px 2px rgba(16,24,40,.04),0 12px 34px rgba(16,24,40,.10);">' +
  // refined dark header: centred logo, thin red accent line, cool-gray tagline
  '<tr><td class="pad head" align="center" style="background:#141418;background-image:linear-gradient(180deg,#1e1e24 0%,#121216 100%);border-bottom:3px solid #C8102E;padding:40px 34px;text-align:center;">' +
  '<img src="' + BRAND_LOGO + '" alt="CNT Promo &amp; Ads Specialists, Inc." height="50" class="logo" style="height:50px;width:auto;display:inline-block;">' +
  '<div style="color:#b7bbc4;font-size:11px;font-weight:600;letter-spacing:.16em;margin-top:16px;text-transform:uppercase;">A Million Jobs for a Million Filipinos.</div>' +
  '<div style="color:#e5213f;font-size:11px;font-weight:800;letter-spacing:.14em;margin-top:8px;">#TatakCNT</div></td></tr>' +
  // body — eyebrow label, tight display heading, airy body copy
  '<tr><td class="pad pad-y" style="padding:42px 44px;color:#3a3c44;font-size:15.5px;line-height:1.75;letter-spacing:.002em;">' +
  '<span style="display:inline-block;background:#FDE7EA;color:#C8102E;font-size:10.5px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;padding:6px 13px;border-radius:100px;">' + esc(eyebrow) + '</span>' +
  '<h1 class="h1" style="font-family:\'Manrope\',\'Inter\',-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,\'Helvetica Neue\',Helvetica,Arial,sans-serif;font-size:26px;font-weight:800;color:#16161a;letter-spacing:-.022em;line-height:1.22;margin:18px 0 16px;">' + heading + '</h1>' +
  bodyHtml + '</td></tr>' +
  // footer
  '<tr><td class="pad" style="background:#fafbfc;border-top:1px solid #eef0f2;padding:32px 34px;text-align:center;">' +
  '<div style="font-size:12px;color:#8a8d94;line-height:1.75;">This is an automated message from <b style="color:#4b4d54;">CNT Promo &amp; Ads Specialists, Inc.</b><br>Please do not reply to this email.</div>' +
  '<div style="margin-top:14px;font-size:11.5px;color:#a9acb3;line-height:1.75;letter-spacing:.01em;">219 Lyfe Tower, Shaw Blvd. corner E. Jacinto St., Barangay Bagong Silang, Mandaluyong City<br>' +
  '<a href="mailto:hrdadmin@cntpromoads.com" style="color:#C8102E;">hrdadmin@cntpromoads.com</a> &nbsp;&middot;&nbsp; <a href="' + SITE + '" style="color:#C8102E;">Visit our website</a></div>' +
  '<div style="margin-top:20px;padding-top:16px;border-top:1px solid #eef0f2;font-size:11px;color:#bcbfc6;letter-spacing:.01em;">&copy; ' + new Date().getFullYear() + ' CNT Promo &amp; Ads Specialists, Inc. All Rights Reserved.</div>' +
  '</td></tr>' +
  '</table>' +
  '<div style="font-size:11px;color:#b3b6bd;margin-top:18px;letter-spacing:.01em;">Sent by CNT Promo &amp; Ads Specialists, Inc.</div>' +
  '</td></tr></table></body></html>';

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
