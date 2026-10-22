// Creates a Stripe Checkout page for a Fat Patties Eats order.
// The browser sends item keys + quantities; prices are looked up here so they can't be tampered with.
import { MENU, RESTAURANTS, SIZE_NAMES, ADDONS, ZONES, TIPS, cents } from '../lib/menu.mjs';
import { stripe, json } from '../lib/stripe.mjs';

const clip = (s, n) => String(s || '').trim().slice(0, n);

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Use POST.' }, 405);
  let b;
  try { b = await req.json(); } catch { return json({ error: 'Bad request.' }, 400); }

  const zone = ZONES.find((z) => z.id === Number(b.zone));
  if (!zone) return json({ error: 'Pick a delivery zone.' }, 400);
  const tip = TIPS[Number(b.tip)] ?? 0;
  const name = clip(b.name, 80), phone = clip(b.phone, 30), address = clip(b.address, 200), notes = clip(b.notes, 200);
  if (!name || !phone || !address) return json({ error: 'Name, phone and address are required.' }, 400);

  const lines = [];
  const byRest = {};
  let food = 0;
  for (const c of Array.isArray(b.cart) ? b.cart.slice(0, 40) : []) {
    const [r, iid, size, extras] = String(c.key || '').split('|');
    const it = MENU[r] && MENU[r][iid];
    if (!it) return json({ error: 'An item in your order is no longer on the menu. Please refresh.' }, 400);
    const qty = Math.max(1, Math.min(20, parseInt(c.qty, 10) || 1));
    let base = it.price, label = it.name;
    if (it.sizes) {
      const s = parseInt(size, 10);
      if (!(s >= 0 && s < it.sizes.length)) return json({ error: 'Pick a burger size.' }, 400);
      base = it.sizes[s]; label += ' · ' + SIZE_NAMES[s];
    }
    const ex = (extras || '').split(',').filter(Boolean);
    let extra = 0;
    for (const e of ex) {
      if (!it.addons || !(e in ADDONS)) return json({ error: 'That add-on is not available.' }, 400);
      extra += ADDONS[e];
    }
    if (ex.length) label += ' + ' + ex.join(', ');
    const unit = base + extra;
    lines.push({ label: label + ' (' + RESTAURANTS[r] + ')', short: label, unit, qty });
    food += unit * qty;
    byRest[r] = (byRest[r] || 0) + cents(unit * qty);
  }
  if (!lines.length) return json({ error: 'Your order is empty.' }, 400);
  if (food < zone.min) return json({ error: `${zone.label} needs at least $${zone.min} in food.` }, 400);

  const code = 'FP-' + String(Math.floor(1000 + Math.random() * 9000));
  const origin = process.env.URL || new URL(req.url).origin;
  const p = new URLSearchParams();
  p.set('mode', 'payment');
  p.set('success_url', origin + '/?session_id={CHECKOUT_SESSION_ID}');
  p.set('cancel_url', origin + '/?canceled=1');
  let i = 0;
  const addLine = (title, amount, qty) => {
    p.set(`line_items[${i}][price_data][currency]`, 'usd');
    p.set(`line_items[${i}][price_data][product_data][name]`, title);
    p.set(`line_items[${i}][price_data][unit_amount]`, String(cents(amount)));
    p.set(`line_items[${i}][quantity]`, String(qty));
    i++;
  };
  lines.forEach((l) => addLine(l.label, l.unit, l.qty));
  addLine('Delivery · ' + zone.label, zone.fee, 1);
  if (tip > 0) addLine('Driver tip (100% to your driver)', tip, 1);

  const meta = {
    source: 'fpeats',
    order: code,
    status: 'received',
    name, phone, address, notes,
    zone: zone.label,
    items: lines.map((l) => `${l.qty}x ${l.short}`).join('; ').slice(0, 480),
    food_cents: String(cents(food)),
    fee_cents: String(cents(zone.fee)),
    driver_cents: String(cents(zone.driver)),
    tip_cents: String(cents(tip)),
    by_rest: JSON.stringify(byRest),
  };
  for (const [k, v] of Object.entries(meta)) {
    p.set(`metadata[${k}]`, v);
    p.set(`payment_intent_data[metadata][${k}]`, v);
  }
  p.set('payment_intent_data[description]', `Fat Patties Eats ${code}`);

  try {
    const s = await stripe('checkout/sessions', { method: 'POST', params: p });
    return json({ url: s.url, code });
  } catch (e) {
    return json({ error: 'Checkout could not start: ' + e.message }, 502);
  }
};
