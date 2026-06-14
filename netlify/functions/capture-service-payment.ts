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

async function executeAction(payload: any): Promise<{ success: boolean; error?: string; data?: any }> {
  const { action, actionData } = payload;

  if (action === 'create_gift') {
    const { code, service_id, business_id, sender_user_id, recipient_name, recipient_email, recipient_phone, message, expires_at, payment_provider, payment_id, payment_amount, payment_currency } = actionData;
    const { error, data } = await supabase.from('agendaya_gift_codes').insert({
      code, service_id, business_id, sender_user_id,
      recipient_name, recipient_email,
      recipient_phone: recipient_phone || null,
      message: message || null,
      expires_at: expires_at || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active',
      payment_provider,
      payment_status: 'completed',
      payment_id,
      payment_amount,
      payment_currency: payment_currency || 'COP',
    }).select().single();
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  }

  if (action === 'create_appointment') {
    const { business_id, service_id, user_id, start_time, end_time, notes, guest_info, payment_provider, payment_id, payment_amount } = actionData;
    const { error, data } = await supabase.from('agendaya_appointments').insert({
      business_id, service_id, user_id,
      start_time, end_time,
      status: 'pending',
      notes: notes || null,
      guest_info: guest_info || null,
      is_guest: !!guest_info,
      payment_status: 'completed',
      payment_provider,
      payment_id,
      payment_amount,
    }).select().single();
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  }

  return { success: false, error: `Acción desconocida: ${action}` };
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

      const result = await executeAction({
        action,
        actionData: {
          ...actionData,
          payment_provider: 'paypal',
          payment_id: paypalCaptureId,
          payment_amount: paypalAmount,
          payment_currency: paypalCurrency,
        },
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
  } catch (err: any) {
    console.error('[capture-service-payment]', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message || 'Internal error' }) };
  }
};
