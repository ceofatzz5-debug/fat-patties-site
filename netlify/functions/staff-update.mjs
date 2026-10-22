// Staff/driver action: set an order's status (and driver name). Requires the STAFF_PIN header.
import { stripe, json, staffCheck } from '../lib/stripe.mjs';
import { STATUSES } from '../lib/menu.mjs';

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Use POST.' }, 405);
  const denied = staffCheck(req);
  if (denied) return denied;
  let b;
  try { b = await req.json(); } catch { return json({ error: 'Bad request.' }, 400); }
  if (!/^pi_[A-Za-z0-9]+$/.test(b.id || '')) return json({ error: 'Unknown order.' }, 400);
  if (!STATUSES.includes(b.status)) return json({ error: 'Unknown status.' }, 400);
  const p = new URLSearchParams();
  p.set('metadata[status]', b.status);
  if (typeof b.driver === 'string') p.set('metadata[driver]', b.driver.trim().slice(0, 40));
  try {
    const cur = await stripe('payment_intents/' + b.id);
    if (!cur.metadata || cur.metadata.source !== 'fpeats') return json({ error: 'Not an Eats order.' }, 400);
    const pi = await stripe('payment_intents/' + b.id, { method: 'POST', params: p });
    return json({ ok: true, status: pi.metadata.status, driver: pi.metadata.driver || '' });
  } catch (e) {
    return json({ error: e.message }, 502);
  }
};
