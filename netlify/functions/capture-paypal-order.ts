import { createClient } from '@supabase/supabase-js';
import type { Handler } from '@netlify/functions';
import { getPaypalAccessToken, PAYPAL_API } from './_shared/paypal';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { orderId, userId, plan } = JSON.parse(event.body || '{}');

    if (!orderId || !userId || !plan) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Faltan parámetros' }) };
    }

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

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const { error: profileError } = await supabase
      .from('agendaya_profiles')
      .update({ plan, updated_at: now.toISOString() })
      .eq('id', userId);

    if (profileError) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Error al actualizar perfil' }) };
    }

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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    console.error('[capture-paypal-order]', err);
    return { statusCode: 500, body: JSON.stringify({ error: message }) };
  }
};
