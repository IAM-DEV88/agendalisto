import { createClient } from '@supabase/supabase-js';
import type { Handler } from '@netlify/functions';
import { getPaypalAccessToken, PAYPAL_API } from './_shared/paypal';
import { executePaymentAction } from './_shared/payments';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { provider, orderId, action, actionData } = JSON.parse(event.body || '{}');

    if (!provider || !orderId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Faltan parámetros: provider, orderId' }) };
    }

    if (provider === 'paypal') {
      const accessToken = await getPaypalAccessToken();

      const captureRes = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const capture = await captureRes.json();

      if (capture.status !== 'COMPLETED') {
        return { statusCode: 400, body: JSON.stringify({ error: 'Pago no completado', details: capture }) };
      }

      const purchaseUnit = capture.purchase_units?.[0];
      const paypalAmount = parseFloat(purchaseUnit?.payments?.captures?.[0]?.amount?.value || '0');
      const paypalCurrency = purchaseUnit?.payments?.captures?.[0]?.amount?.currency_code || 'USD';
      const paypalCaptureId = purchaseUnit?.payments?.captures?.[0]?.id || orderId;

      const result = await executePaymentAction(supabase, action, {
        ...actionData,
        payment_provider: 'paypal',
        payment_id: paypalCaptureId,
        payment_amount: paypalAmount,
        payment_currency: paypalCurrency,
      });

      if (!result.success) {
        return { statusCode: 500, body: JSON.stringify({ error: result.error || 'Error al ejecutar acción post-pago' }) };
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, data: result.data }),
      };
    }

    return { statusCode: 400, body: JSON.stringify({ error: `Proveedor no soportado para capture: ${provider}` }) };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    console.error('[capture-service-payment]', err);
    return { statusCode: 500, body: JSON.stringify({ error: message }) };
  }
};
