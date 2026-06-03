const PAYPAL_API = process.env.PAYPAL_SANDBOX === 'true'
  ? 'https://api-m.sandbox.paypal.com'
  : 'https://api-m.paypal.com';

async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID!;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET!;

  if (!clientId || !clientSecret) {
    throw new Error('Faltan PAYPAL_CLIENT_ID o PAYPAL_CLIENT_SECRET en las variables de entorno');
  }

  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await res.json();

  if (!res.ok || !data.access_token) {
    throw new Error(`PayPal auth error: ${data.error_description || data.error || res.statusText}`);
  }

  return data.access_token;
}

export const handler = async (event: any) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { plan } = JSON.parse(event.body || '{}');

    if (!plan || !['pro', 'premium'].includes(plan)) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Plan inválido' }) };
    }

    const amounts: Record<string, number> = {
      pro: 49.90,
      premium: 99.90,
    };

    const amount = amounts[plan];
    const accessToken = await getAccessToken();

    const orderRes = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          description: `AgendaYa - Plan ${plan.charAt(0).toUpperCase() + plan.slice(1)}`,
          amount: {
            currency_code: 'USD',
            value: amount.toFixed(2),
          },
        }],
      }),
    });

    const order = await orderRes.json();

    if (!order.id) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Error al crear la orden en PayPal', details: order }) };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: order.id }),
    };
  } catch (err: any) {
    console.error('[create-paypal-order]', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message || 'Internal error' }) };
  }
};
