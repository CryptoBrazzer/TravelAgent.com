/* Early-access intake.
 *
 * The site posts an application here. This decides where it actually goes.
 * Configure ONE destination in the Vercel project's environment variables:
 *
 *   WAITLIST_FORWARD_URL    POST the application as JSON to your own API
 *   WAITLIST_FORWARD_TOKEN  optional bearer token for that call
 * or
 *   RESEND_API_KEY          deliver it as email through Resend
 *   WAITLIST_TO             inbox that receives it
 *   WAITLIST_FROM           a verified sender on your Resend domain
 *
 * With none of them set this answers 503 {configured:false} and the form
 * falls back to handing the visitor a prefilled email. That is deliberate:
 * a form that accepts an address into a black hole is worse than one that
 * says it cannot take it yet.
 */

const LIMITS = { name: 120, email: 254, message: 2000, platform: 16, lang: 8 };
const PLATFORMS = ['ios', 'android', 'any'];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Best-effort throttle. Serverless instances are not shared, so this trims
// the obvious floods rather than pretending to be a real rate limiter.
const seen = new Map();
function tooMany(ip) {
  const now = Date.now();
  const recent = (seen.get(ip) || []).filter(function (t) { return now - t < 60000; });
  recent.push(now);
  seen.set(ip, recent);
  if (seen.size > 4000) seen.clear();
  return recent.length > 5;
}

function clean(v, max) {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

async function forward(entry) {
  const r = await fetch(process.env.WAITLIST_FORWARD_URL, {
    method: 'POST',
    headers: Object.assign(
      { 'Content-Type': 'application/json' },
      process.env.WAITLIST_FORWARD_TOKEN
        ? { Authorization: 'Bearer ' + process.env.WAITLIST_FORWARD_TOKEN }
        : {}
    ),
    body: JSON.stringify(entry)
  });
  if (!r.ok) {
    const detail = await r.text().catch(function () { return ''; });
    throw new Error('forward responded ' + r.status + ' ' + detail.slice(0, 300));
  }
}

async function email(entry) {
  const lines = [
    'Name: ' + entry.name,
    'Email: ' + entry.email,
    'Platform: ' + entry.platform,
    entry.message ? 'Message: ' + entry.message : null,
    '',
    'Interface language: ' + entry.lang,
    'Received: ' + entry.at
  ].filter(Boolean);

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + process.env.RESEND_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: process.env.WAITLIST_FROM,
      to: [process.env.WAITLIST_TO],
      reply_to: entry.email,
      subject: 'ESCAPE! waitlist — ' + entry.name,
      text: lines.join('\n')
    })
  });
  if (!r.ok) {
    const detail = await r.text().catch(function () { return ''; });
    throw new Error('resend responded ' + r.status + ' ' + detail.slice(0, 300));
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  const forwarding = !!process.env.WAITLIST_FORWARD_URL;
  const mailing = !!(process.env.RESEND_API_KEY && process.env.WAITLIST_TO && process.env.WAITLIST_FROM);

  // The form asks before it promises, so its button can name what pressing it
  // will actually do rather than finding out afterwards.
  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      configured: forwarding || mailing,
      mode: forwarding ? 'forward' : (mailing ? 'email' : 'none')
    });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  if (!forwarding && !mailing) {
    return res.status(503).json({ ok: false, configured: false });
  }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (tooMany(ip)) return res.status(429).json({ ok: false, error: 'too_many' });

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = null; }
  }
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ ok: false, error: 'bad_body' });
  }

  // Bots fill every field they find. A human never sees this one.
  if (clean(body.company, 200)) return res.status(200).json({ ok: true });

  const entry = {
    name: clean(body.name, LIMITS.name),
    email: clean(body.email, LIMITS.email).toLowerCase(),
    platform: clean(body.platform, LIMITS.platform),
    message: clean(body.message, LIMITS.message),
    lang: clean(body.lang, LIMITS.lang) || 'ru',
    at: new Date().toISOString()
  };
  if (PLATFORMS.indexOf(entry.platform) < 0) entry.platform = 'any';

  if (!entry.name) return res.status(422).json({ ok: false, error: 'name_required' });
  if (!EMAIL.test(entry.email)) return res.status(422).json({ ok: false, error: 'email_invalid' });

  try {
    if (forwarding) await forward(entry); else await email(entry);
  } catch (err) {
    // Never echo the address back into the log line.
    console.error('waitlist delivery failed:', err.message);
    return res.status(502).json({ ok: false, error: 'delivery_failed' });
  }

  return res.status(200).json({ ok: true });
};
