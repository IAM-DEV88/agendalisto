const PAYPAL_API = process.env.PAYPAL_SANDBOX === 'true'
  ? 'https://api-m.sandbox.paypal.com'
  : 'https://api-m.paypal.com';

async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID!;
  const clientSecret = process.env.PAYPAL_SECRET!;

  if (!clientId || !clientSecret) {
    const similares = Object.keys(process.env).filter(k => /paypal/i.test(k));
    throw new Error(`Faltan PAYPAL_CLIENT_ID o PAYPAL_SECRET. Similares encontradas: ${similares.length ? similares.join(', ') : 'ninguna'}`);
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
    const { amount, currency, serviceName, businessName } = JSON.parse(event.body || '{}');

    if (!amount || amount <= 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Monto inválido' }) };
    }

    const amountUsd = currency === 'COP'
      ? parseFloat((Number(amount) / 4000).toFixed(2))
      : parseFloat(Number(amount).toFixed(2));

    if (!amountUsd || amountUsd <= 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Monto inválido después de conversión' }) };
    }

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
          description: `${serviceName || 'Servicio'} - ${businessName || 'AgendaYa'}`,
          amount: { currency_code: 'USD', value: String(amountUsd) },
        }],
      }),
    });

    const order = await orderRes.json();
    if (!order.id) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Error al crear orden PayPal', details: order }) };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: order.id }),
    };
  } catch (err: any) {
    console.error('[create-service-paypal-order]', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message || 'Internal error' }) };
  }
};