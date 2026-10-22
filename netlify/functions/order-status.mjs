// Customer order tracker: looks up one order by its Stripe Checkout session id.
import { stripe, json, orderFromIntent } from '../lib/stripe.mjs';

export default async (req) => {
  const id = new URL(req.url).searchParams.get('session_id') || '';
  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(id)) return json({ error: 'Unknown order.' }, 400);
  try {
    const s = await stripe('checkout/sessions/' + id, { params: { 'expand[]': 'payment_intent' } });
    if (!s.payment_intent || typeof s.payment_intent !== 'object') {
      return json({ paid: false, code: s.metadata && s.metadata.order });
    }
    const o = orderFromIntent(s.payment_intent);
    return json({
      paid: s.payment_status === 'paid',
      code: o.code, status: o.status, items: o.items, zone: o.zone,
      total: o.amount, address: o.address,
    });
  } catch (e) {
    return json({ error: e.message }, 502);
  }
};
