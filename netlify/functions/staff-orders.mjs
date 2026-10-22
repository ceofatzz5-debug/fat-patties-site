// Staff dashboard feed: recent paid Fat Patties Eats orders. Requires the STAFF_PIN header.
import { stripe, json, staffCheck, orderFromIntent } from '../lib/stripe.mjs';

export default async (req) => {
  const denied = staffCheck(req);
  if (denied) return denied;
  try {
    const since = Math.floor(Date.now() / 1000) - 7 * 24 * 3600;
    const list = await stripe('payment_intents', { params: { limit: '100', 'created[gte]': String(since) } });
    const orders = list.data
      .filter((pi) => pi.status === 'succeeded' && pi.metadata && pi.metadata.source === 'fpeats')
      .map(orderFromIntent);
    return json({ orders, testMode: String(process.env.STRIPE_SECRET_KEY).startsWith('sk_test_') });
  } catch (e) {
    return json({ error: e.message }, 502);
  }
};
