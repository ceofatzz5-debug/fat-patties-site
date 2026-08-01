// square-sales.js
// A Netlify serverless Function. This runs on Netlify's servers, NOT in the
// browser — so the Square access token stays private and is never exposed
// to anyone visiting the site.
//
// It fetches your Square location, then your recent completed payments,
// and hands back a simple list Bump Pay can add to the ledger.

exports.handler = async function () {
  const ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN1;

  if (!ACCESS_TOKEN) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Square access token is not configured on the server." }),
    };
  }

  const headers = {
    Authorization: `Bearer ${ACCESS_TOKEN}`,
    "Square-Version": "2024-07-17",
    "Content-Type": "application/json",
  };

  try {
    // 1. Find the Square location (where the sales happen)
    const locRes = await fetch("https://connect.squareup.com/v2/locations", { headers });
    const locData = await locRes.json();

    if (!locRes.ok) {
      return { statusCode: locRes.status, body: JSON.stringify({ error: locData }) };
    }
    if (!locData.locations || locData.locations.length === 0) {
      return { statusCode: 200, body: JSON.stringify({ sales: [] }) };
    }
    const locationId = locData.locations[0].id;

    // 2. Pull completed payments from the last 30 days
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const payUrl =
      `https://connect.squareup.com/v2/payments?location_id=${locationId}` +
      `&begin_time=${encodeURIComponent(since)}&sort_order=DESC`;

    const payRes = await fetch(payUrl, { headers });
    const payData = await payRes.json();

    if (!payRes.ok) {
      return { statusCode: payRes.status, body: JSON.stringify({ error: payData }) };
    }

    const payments = (payData.payments || []).filter((p) => p.status === "COMPLETED");

    // 3. Shape each payment into a simple sale record
    const sales = payments.map((p) => ({
      squareId: p.id,
      amount: (p.amount_money && p.amount_money.amount ? p.amount_money.amount : 0) / 100,
      date: p.created_at ? p.created_at.slice(0, 10) : "",
      item: "Square Sale", // Item-level detail isn't in the payment itself;
                           // this can be refined later using the Orders API.
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({ sales }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
