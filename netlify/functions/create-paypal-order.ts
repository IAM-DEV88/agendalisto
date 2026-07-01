import type { Handler } from '@netlify/functions';
import { getPaypalAccessToken, PAYPAL_API, PLAN_PRICES_USD } from './_shared/paypal';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { plan } = JSON.parse(event.body || '{}');

    if (!plan || !['pro', 'premium'].includes(plan)) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Plan inválido' }) };
    }

    const amount = PLAN_PRICES_USD[plan];
    const accessToken = await getPaypalAccessToken();

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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    console.error('[create-paypal-order]', err);
    return { statusCode: 500, body: JSON.stringify({ error: message }) };
  }
};
