import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { verifyWompiWebhook, PLAN_PRICES_IN_CENTS } from './_shared/wompi';

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

    // Verificar firma HMAC
    if (!verifyWompiWebhook(payload)) {
      console.error('[wompi-webhook] Invalid signature');
      return { statusCode: 401, body: JSON.stringify({ error: 'Invalid signature' }) };
    }

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
    // userId puede contener guiones, así que extraemos todo entre AGD- y el último segmento
    if (!reference || !reference.startsWith('AGD-')) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Reference inválido' }) };
    }
    const userId = reference.substring(4).replace(/-[^-]+$/, '');

    // Determinar plan por el monto (buscar en PLAN_PRICES_IN_CENTS)
    const plan = Object.entries(PLAN_PRICES_IN_CENTS).find(([, price]) => price === amount_in_cents)?.[0] || null;
    if (!plan) {
      return { statusCode: 400, body: JSON.stringify({ error: `Monto no reconocido: ${amount_in_cents}` }) };
    }

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const { error: profileError } = await supabase
      .from('agendaya_profiles')
      .update({ plan, updated_at: now.toISOString() })
      .eq('id', userId);

    if (profileError) {
      console.error('[wompi-webhook] Error updating profile:', profileError);
      return { statusCode: 500, body: JSON.stringify({ error: 'Error al actualizar perfil' }) };
    }

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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[wompi-webhook] Error:', message);
    return { statusCode: 500, body: JSON.stringify({ error: message }) };
  }
};
