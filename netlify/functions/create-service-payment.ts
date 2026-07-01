import { createClient } from '@supabase/supabase-js';
import type { Handler } from '@netlify/functions';
import { getPaypalAccessToken, PAYPAL_API } from './_shared/paypal';
import { generateWompiSignature, WOMPI_API } from './_shared/wompi';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const WOMPI_PRIVATE_KEY = process.env.WOMPI_PRIVATE_KEY || '';

export const handler: Handler = async (event) => {
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

    if (provider === 'paypal') {
      const accessToken = await getPaypalAccessToken();
      // Obtener tasa de cambio actual desde API pública
      let amountUsd = amount;
      if (currency === 'COP') {
        try {
          const fxRes = await fetch('https://open.er-api.com/v6/latest/USD');
          const fxData = await fxRes.json();
          const copRate = fxData.rates?.COP;
          if (copRate) {
            amountUsd = parseFloat((amount / copRate).toFixed(2));
          } else {
            // Fallback a tasa fija si la API falla
            amountUsd = parseFloat((amount / 4000).toFixed(2));
          }
        } catch {
          amountUsd = parseFloat((amount / 4000).toFixed(2));
        }
      } else {
        amountUsd = parseFloat(amount.toFixed(2));
      }

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

    if (provider === 'wompi') {
      const amountInCents = Math.round(amount * 100);
      const refCurrency = currency === 'USD' ? 'USD' : 'COP';
      const reference = `SRV-${userId}-${Date.now().toString(36).toUpperCase()}`;

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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    console.error('[create-service-payment]', err);
    return { statusCode: 500, body: JSON.stringify({ error: message }) };
  }
};
