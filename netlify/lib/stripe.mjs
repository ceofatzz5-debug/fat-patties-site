// Tiny Stripe API helper (no npm packages needed). Uses STRIPE_SECRET_KEY from Netlify env vars.

export async function stripe(path, { method = 'GET', params } = {}) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set in Netlify.');
  const qs = params ? new URLSearchParams(params).toString() : '';
  let url = 'https://api.stripe.com/v1/' + path;
  const init = {
    method,
    headers: {
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  };
  if (method === 'GET') { if (qs) url += (url.includes('?') ? '&' : '?') + qs; }
  else init.body = qs;
  const res = await fetch(url, init);
  const data = await res.json();
  if (!res.ok) throw new Error((data.error && data.error.message) || 'Stripe request failed');
  return data;
}

export function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

// Staff-only routes check the STAFF_PIN env var.
export function staffCheck(req) {
  const pin = process.env.STAFF_PIN;
  if (!pin) return json({ error: 'STAFF_PIN is not set in Netlify yet.' }, 503);
  if ((req.headers.get('x-staff-pin') || '') !== pin) return json({ error: 'Wrong PIN.' }, 401);
  return null;
}

export function orderFromIntent(pi) {
  const m = pi.metadata || {};
  return {
    id: pi.id,
    created: pi.created,
    amount: pi.amount_received || pi.amount,
    code: m.order,
    status: m.status || 'received',
    driver: m.driver || '',
    name: m.name,
    phone: m.phone,
    address: m.address,
    notes: m.notes || '',
    zone: m.zone,
    items: m.items,
    food: +m.food_cents || 0,
    fee: +m.fee_cents || 0,
    driverPay: +m.driver_cents || 0,
    tip: +m.tip_cents || 0,
    byRest: safeParse(m.by_rest),
  };
}

function safeParse(s) { try { return JSON.parse(s || '{}'); } catch { return {}; } }
