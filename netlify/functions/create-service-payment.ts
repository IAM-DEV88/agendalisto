import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PAYPAL_API = process.env.PAYPAL_SANDBOX === 'true'
  ? 'https://api-m.sandbox.paypal.com'
  : 'https://api-m.paypal.com';

const WOMPI_API = process.env.WOMPI_SANDBOX === 'true'
  ? 'https://sandbox.wompi.co/v1'
  : 'https://production.wompi.co/v1';

const WOMPI_PRIVATE_KEY = process.env.WOMPI_PRIVATE_KEY || '';
const WOMPI_INTEGRITY_SECRET = process.env.WOMPI_INTEGRITY_SECRET || '';

function generateWompiSignature(reference: string, amountInCents: number, currency: string): string {
  const crypto = require('crypto');
  const concat = reference + amountInCents + currency + WOMPI_INTEGRITY_SECRET;
  return crypto.createHash('sha256').update(concat).digest('hex');
}

async function getPaypalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID!;
  const clientSecret = process.env.PAYPAL_SECRET!;
  if (!clientId || !clientSecret) {
    throw new Error('Faltan PAYPAL_CLIENT_ID o PAYPAL_SECRET');
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
    const body = JSON.parse(event.body || '{}');
    const { provider, amount, currency, serviceName, businessName, userId, action, actionData } = body;

    if (!provider || !amount || amount <= 0 || !userId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Faltan parámetros: provider, amount, userId' }) };
    }

    const siteUrl = process.env.URL || process.env.SITE_URL || 'https://agendaya.netlify.app';

    // ─── PayPal: crear orden ──────────────────────────────────
    if (provider === 'paypal') {
      const accessToken = await getPaypalAccessToken();
      const amountUsd = parseFloat((currency === 'COP' ? amount / 4000 : amount).toFixed(2));

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
            custom_id: `${action}:${userId}`,
          }],
        }),
      });

      const order = await orderRes.json();
      if (!order.id) {
        return { statusCode: 500, body: JSON.stringify({ error: 'Error al crear orden PayPal', details: order }) };
      }

      return {
        statusCode: 200,
        body: JSON.stringify({
          provider: 'paypal',
          orderId: order.id,
          amount: amountUsd,
          currency: 'USD',
          action,
        }),
      };
    }

    // ─── Wompi: crear transacción + pending payment ────────────
    if (provider === 'wompi') {
      const amountInCents = Math.round(amount * 100);
      const refCurrency = currency === 'USD' ? 'USD' : 'COP';
      const reference = `SRV-${userId}-${Date.now().toString(36).toUpperCase()}`;

      // Guardar pending payment
      const { error: ppError } = await supabase
        .from('agendaya_pending_payments')
        .insert({
          reference,
          provider: 'wompi',
          action: action || 'create_gift',
          payload: {
            ...(actionData || body),
            userId,
            amount,
            currency: refCurrency,
          },
          status: 'pending',
        });

      if (ppError) {
        console.error('[create-service-payment] Error saving pending payment:', ppError);
        return { statusCode: 500, body: JSON.stringify({ error: 'Error al guardar pago pendiente' }) };
      }

      const signature = generateWompiSignature(reference, amountInCents, refCurrency);

      const transactionRes = await fetch(`${WOMPI_API}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${WOMPI_PRIVATE_KEY}`,
        },
        body: JSON.stringify({
          amount_in_cents: amountInCents,
          currency: refCurrency,
          reference,
          signature,
          customer_data: {
            email: body.userEmail || '',
            full_name: body.userName || '',
            phone: body.userPhone || undefined,
          },
          redirect_url: `${siteUrl}/payment/service/success?reference=${reference}`,
          payment_method: null,
        }),
      });

      const transaction = await transactionRes.json();

      if (!transactionRes.ok || !transaction.data) {
        // Limpiar pending payment si falló
        await supabase.from('agendaya_pending_payments').delete().eq('reference', reference);
        return { statusCode: 500, body: JSON.stringify({ error: 'Error al crear transacción Wompi', details: transaction }) };
      }

      return {
        statusCode: 200,
        body: JSON.stringify({
          provider: 'wompi',
          checkoutUrl: transaction.data.redirect_url,
          transactionId: transaction.data.id,
          reference,
          amount,
          currency: refCurrency,
        }),
      };
    }

    return { statusCode: 400, body: JSON.stringify({ error: `Proveedor no soportado: ${provider}` }) };
  } catch (err: any) {
    console.error('[create-service-payment]', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message || 'Internal error' }) };
  }
};
