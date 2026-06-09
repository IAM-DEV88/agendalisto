/**
 * create-wompi-transaction.ts — Crea transacción en Wompi para pago de planes
 *
 * Uso: POST /.netlify/functions/create-wompi-transaction
 * Body: { plan: 'pro' | 'premium', userId: string, userEmail: string, userName: string, userPhone?: string }
 *
 * Retorna: { success: boolean, checkoutUrl?: string, error?: string }
 */

import { Handler } from '@netlify/functions';

const WOMPI_API = process.env.WOMPI_SANDBOX === 'true'
  ? 'https://sandbox.wompi.co/v1'
  : 'https://production.wompi.co/v1';

const WOMPI_PUBLIC_KEY = process.env.WOMPI_PUBLIC_KEY || '';
const WOMPI_PRIVATE_KEY = process.env.WOMPI_PRIVATE_KEY || '';

const PLAN_PRICES: Record<string, number> = {
  pro: 49900,
  premium: 99900,
};

const INTEGRITY_SECRET = process.env.WOMPI_INTEGRITY_SECRET || '';

function generateSignature(reference: string, amountInCents: number, currency: string): string {
  const crypto = require('crypto');
  const concat = reference + amountInCents + currency + INTEGRITY_SECRET;
  return crypto.createHash('sha256').update(concat).digest('hex');
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const { plan, userId, userEmail, userName, userPhone } = JSON.parse(event.body || '{}');

    if (!plan || !userId || !userEmail || !userName) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Faltan parámetros: plan, userId, userEmail, userName' }) };
    }

    const price = PLAN_PRICES[plan];
    if (!price) {
      return { statusCode: 400, body: JSON.stringify({ error: `Plan inválido: ${plan}` }) };
    }

    const amountInCents = price * 100; // Wompi usa centavos
    const reference = `AGD-${userId}-${Date.now()}`;
    const currency = 'COP';
    const siteUrl = process.env.SITE_URL || 'https://agendalisto.com';
    const redirectUrl = `${siteUrl}/payment/success?plan=${plan}&reference=${reference}`;

    const signature = generateSignature(reference, amountInCents, currency);

    const body = {
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
      payment_method: null, // Todos los métodos disponibles
    };

    const response = await fetch(`${WOMPI_API}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WOMPI_PRIVATE_KEY}`,
      },
      body: JSON.stringify(body),
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
  } catch (err: any) {
    console.error('[wompi] Error:', err.message);
    return { statusCode: 500, body: JSON.stringify({ error: err.message || 'Error interno' }) };
  }
};
