import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PAYPAL_API = process.env.PAYPAL_SANDBOX === 'true'
  ? 'https://api-m.sandbox.paypal.com'
  : 'https://api-m.paypal.com';

async function getPaypalAccessToken(): Promise<string> {
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

      const paymentData = {
        ...(actionData || {}),
        payment_provider: 'paypal' as const,
        payment_id: paypalCaptureId,
        payment_amount: paypalAmount,
        payment_currency: paypalCurrency,
      };

      if (action === 'create_gift') {
        const d = paymentData as Record<string, unknown>;
        const { error, data } = await supabase.from('agendaya_gift_codes').insert({
          code: d.code as string,
          service_id: d.service_id as string,
          business_id: d.business_id as string,
          sender_user_id: d.sender_user_id as string,
          recipient_name: d.recipient_name as string,
          recipient_email: d.recipient_email as string,
          recipient_phone: (d.recipient_phone as string) || null,
          message: (d.message as string) || null,
          expires_at: (d.expires_at as string) || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          payment_provider: 'paypal',
          payment_status: 'completed',
          payment_id: paypalCaptureId,
          payment_amount: paypalAmount,
          payment_currency: paypalCurrency,
        }).select().single();
        if (error) {
          return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
        }
        return { statusCode: 200, body: JSON.stringify({ success: true, data }) };
      }

      if (action === 'create_appointment') {
        const d = paymentData as Record<string, unknown>;
        const { data, error } = await supabase.rpc('create_appointment_safe', {
          p_business_id: d.business_id as string,
          p_service_id: d.service_id as string,
          p_user_id: (d.user_id as string) || '',
          p_start_time: d.start_time as string,
          p_end_time: d.end_time as string,
          p_notes: (d.notes as string) || null,
          p_guest_info: (d.guest_info as Record<string, unknown>) || null,
          p_is_guest: !!d.guest_info,
          p_payment_provider: 'paypal',
          p_payment_id: paypalCaptureId,
          p_payment_amount: paypalAmount,
        });
        if (error) {
          return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
        }
        if (!data?.success) {
          return { statusCode: 500, body: JSON.stringify({ error: data?.error || 'Error al crear cita' }) };
        }
        return { statusCode: 200, body: JSON.stringify({ success: true, data: data.data }) };
      }

      return { statusCode: 400, body: JSON.stringify({ error: `Acción desconocida: ${action}` }) };
    }

    return { statusCode: 400, body: JSON.stringify({ error: `Proveedor no soportado para capture: ${provider}` }) };
  } catch (err: any) {
    console.error('[capture-service-payment]', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message || 'Internal error' }) };
  }
};