/**
 * wompi-webhook.ts — Recibe eventos de Wompi y actualiza planes/suscripciones
 *
 * Endpoint: POST /.netlify/functions/wompi-webhook
 * Configurar en dashboard Wompi → Webhooks → URL
 */

import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const { event: eventName, data } = payload;

    console.log(`[wompi-webhook] Event: ${eventName}`, JSON.stringify({ transaction: data?.transaction?.id }));

    if (eventName !== 'transaction.APPROVED') {
      return { statusCode: 200, body: JSON.stringify({ received: true, ignored: true }) };
    }

    const transaction = data?.transaction;
    if (!transaction) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Sin datos de transacción' }) };
    }

    const { reference, id: wompiTransactionId, amount_in_cents } = transaction;

    // Extraer userId del reference: AGD-{userId}-{timestamp}
    const refParts = reference?.split('-') || [];
    if (refParts.length < 3 || refParts[0] !== 'AGD') {
      return { statusCode: 400, body: JSON.stringify({ error: 'Reference inválido' }) };
    }
    const userId = refParts.slice(1, -1).join('-');

    // Determinar plan por el monto
    const plan = amount_in_cents === 4990000 ? 'pro' : amount_in_cents === 9990000 ? 'premium' : null;
    if (!plan) {
      return { statusCode: 400, body: JSON.stringify({ error: `Monto no reconocido: ${amount_in_cents}` }) };
    }

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    // Actualizar perfil
    const { error: profileError } = await supabase
      .from('agendaya_profiles')
      .update({ plan, updated_at: now.toISOString() })
      .eq('id', userId);

    if (profileError) {
      console.error('[wompi-webhook] Error updating profile:', profileError);
      return { statusCode: 500, body: JSON.stringify({ error: 'Error al actualizar perfil' }) };
    }

    // Actualizar suscripción
    const { error: subError } = await supabase
      .from('agendaya_subscriptions')
      .upsert({
        user_id: userId,
        plan,
        wompi_transaction_id: wompiTransactionId,
        status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        updated_at: now.toISOString(),
      }, { onConflict: 'user_id' });

    if (subError) {
      console.error('[wompi-webhook] Error upserting subscription:', subError);
      return { statusCode: 500, body: JSON.stringify({ error: 'Error al guardar suscripción' }) };
    }

    console.log(`[wompi-webhook] ✅ Plan ${plan} activado para usuario ${userId}`);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, plan, userId }),
    };
  } catch (err: any) {
    console.error('[wompi-webhook] Error:', err.message);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
