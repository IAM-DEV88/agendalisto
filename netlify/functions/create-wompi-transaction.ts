import { Handler } from '@netlify/functions';
import { generateWompiSignature, WOMPI_API, PLAN_PRICES_IN_CENTS } from './_shared/wompi';

const WOMPI_PRIVATE_KEY = process.env.WOMPI_PRIVATE_KEY || '';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const { plan, userId, userEmail, userName, userPhone } = JSON.parse(event.body || '{}');

    if (!plan || !userId || !userEmail || !userName) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Faltan parámetros: plan, userId, userEmail, userName' }) };
    }

    const amountInCents = PLAN_PRICES_IN_CENTS[plan];
    if (!amountInCents) {
      return { statusCode: 400, body: JSON.stringify({ error: `Plan inválido: ${plan}` }) };
    }

    const reference = `AGD-${userId}-${Date.now()}`;
    const currency = 'COP';
    const siteUrl = process.env.SITE_URL || process.env.URL || '';
    const redirectUrl = `${siteUrl}/payment/success?plan=${plan}&reference=${reference}`;

    const signature = generateWompiSignature(reference, amountInCents, currency);

    const response = await fetch(`${WOMPI_API}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WOMPI_PRIVATE_KEY}`,
      },
      body: JSON.stringify({
        amount_in_cents: amountInCents,
        currency,
        reference,
        signature,
        customer_data: {
          email: userEmail,
          full_name: userName,
          phone: userPhone || undefined,
        },
        redirect_url: redirectUrl,
        payment_method: null,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.data) {
      console.error('[wompi] Error creating transaction:', JSON.stringify(data));
      return {
        statusCode: 500,
        body: JSON.stringify({ error: data.message || 'Error al crear transacción en Wompi' }),
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        checkoutUrl: data.data.redirect_url,
        transactionId: data.data.id,
        reference,
      }),
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error interno';
    console.error('[wompi] Error:', message);
    return { statusCode: 500, body: JSON.stringify({ error: message }) };
  }
};
