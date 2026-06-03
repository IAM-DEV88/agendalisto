import { createClient } from '@supabase/supabase-js';

const PAYPAL_API = process.env.PAYPAL_SANDBOX === 'true'
  ? 'https://api-m.sandbox.paypal.com'
  : 'https://api-m.paypal.com';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID!;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET!;

  if (!clientId || !clientSecret) {
    const similares = Object.keys(process.env).filter(k => /paypal/i.test(k));
    throw new Error(`Faltan PAYPAL_CLIENT_ID o PAYPAL_CLIENT_SECRET. Similares encontradas: ${similares.length ? similares.join(', ') : 'ninguna'}`);
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

  console.log('[capture-paypal-order] ENV:', Object.keys(process.env).filter(k => k.includes('PAYPAL') || k.includes('SUPABASE')));

  try {
    const { orderId, userId, plan } = JSON.parse(event.body || '{}');

    if (!orderId || !userId || !plan) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Faltan parámetros' }) };
    }

    const accessToken = await getAccessToken();

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

    // Calcular periodo (1 mes)
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    // Actualizar plan del perfil
    const { error: profileError } = await supabase
      .from('agendaya_profiles')
      .update({ plan, updated_at: now.toISOString() })
      .eq('id', userId);

    if (profileError) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Error al actualizar perfil' }) };
    }

    // Crear o actualizar suscripción
    const { error: subError } = await supabase
      .from('agendaya_subscriptions')
      .upsert({
        user_id: userId,
        plan,
        paypal_order_id: orderId,
        status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        updated_at: now.toISOString(),
      }, { onConflict: 'user_id' });

    if (subError) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Error al guardar suscripción' }) };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, plan }),
    };
  } catch (err: any) {
    console.error('[capture-paypal-order]', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message || 'Internal error' }) };
  }
};
