// stripe-sales.js
// A Netlify serverless Function, like square-sales.js. It runs on Netlify's
// servers, so the Stripe key stays private and is never shown to visitors.
//
// It pulls your successful Stripe payments from the last 30 days and hands back
// the same simple list Bump Pay uses for Square sales.
//
// Setup: in Netlify › Site configuration › Environment variables, add
//   STRIPE_SECRET_KEY = a Stripe "restricted key" with READ access to Charges.

exports.handler = async function () {
  const KEY = process.env.STRIPE_SECRET_KEY;
  if (!KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: "Stripe key is not configured on the server." }) };
  }

  const since = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);
  const sales = [];
  let startingAfter = "";

  try {
    // Stripe returns 100 at a time; keep asking until there are no more (max 10 pages).
    for (let page = 0; page < 10; page++) {
      const url = "https://api.stripe.com/v1/charges?limit=100&created[gte]=" + since +
        (startingAfter ? "&starting_after=" + startingAfter : "");
      const res = await fetch(url, { headers: { Authorization: "Bearer " + KEY } });
      const data = await res.json();
      if (!res.ok) return { statusCode: res.status, body: JSON.stringify({ error: data.error || data }) };

      (data.data || []).forEach((c) => {
        if (c.status !== "succeeded" || !c.paid) return;
        const refunded = (c.amount_refunded || 0) / 100;
        sales.push({
          stripeId: c.id,
          amount: (c.amount || 0) / 100 - refunded,
          date: new Date(c.created * 1000).toISOString().slice(0, 10),
          ts: c.created * 1000,
          item: c.description || (c.metadata && c.metadata.item) || "Stripe Sale",
          customer: (c.billing_details && c.billing_details.name) || "",
          email: c.receipt_email || (c.billing_details && c.billing_details.email) || "",
        });
      });

      if (!data.has_more || !data.data || !data.data.length) break;
      startingAfter = data.data[data.data.length - 1].id;
    }
    return { statusCode: 200, body: JSON.stringify({ sales }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
