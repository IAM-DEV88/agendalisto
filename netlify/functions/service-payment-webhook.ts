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

    console.log(`[service-payment-webhook] Event: ${eventName}`, JSON.stringify({ transaction: data?.transaction?.id }));

    if (eventName !== 'transaction.APPROVED') {
      return { statusCode: 200, body: JSON.stringify({ received: true, ignored: true }) };
    }

    const transaction = data?.transaction;
    if (!transaction) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Sin datos de transacción' }) };
    }

    const { reference, id: wompiTransactionId, amount_in_cents, status: txStatus } = transaction;

    if (!reference) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Sin reference' }) };
    }

    if (!reference.startsWith('SRV-')) {
      // No es un pago de servicio, ignorar
      return { statusCode: 200, body: JSON.stringify({ received: true, ignored: true }) };
    }

    // Buscar pending payment
    const { data: pending, error: findError } = await supabase
      .from('agendaya_pending_payments')
      .select('*')
      .eq('reference', reference)
      .single();

    if (findError || !pending) {
      console.error(`[service-payment-webhook] Pending payment not found for reference: ${reference}`);
      return { statusCode: 404, body: JSON.stringify({ error: 'Pending payment not found' }) };
    }

    if (pending.status !== 'pending') {
      return { statusCode: 200, body: JSON.stringify({ received: true, alreadyProcessed: true }) };
    }

    const payloadObj = pending.payload || {};
    const action = pending.action;

    let dbError;

    if (action === 'create_gift') {
      const { code, service_id, business_id, sender_user_id, recipient_name, recipient_email, recipient_phone, message, expires_at } = payloadObj;
      const { error } = await supabase.from('agendaya_gift_codes').insert({
        code,
        service_id,
        business_id,
        sender_user_id,
        recipient_name,
        recipient_email,
        recipient_phone: recipient_phone || null,
        message: message || null,
        expires_at: expires_at || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        payment_provider: 'wompi',
        payment_status: 'completed',
        payment_id: wompiTransactionId,
        payment_amount: payloadObj.amount || amount_in_cents / 100,
        payment_currency: payloadObj.currency || 'COP',
      });
      dbError = error;
    } else if (action === 'create_appointment') {
      const { business_id, service_id, user_id, start_time, end_time, notes, guest_info } = payloadObj;
      const { error } = await supabase.from('agendaya_appointments').insert({
        business_id,
        service_id,
        user_id,
        start_time,
        end_time,
        status: 'pending',
        notes: notes || null,
        guest_info: guest_info || null,
        is_guest: !!guest_info,
        payment_status: 'completed',
        payment_provider: 'wompi',
        payment_id: wompiTransactionId,
        payment_amount: payloadObj.amount || amount_in_cents / 100,
      });
      dbError = error;
    } else {
      return { statusCode: 400, body: JSON.stringify({ error: `Acción desconocida: ${action}` }) };
    }

    if (dbError) {
      console.error('[service-payment-webhook] Error executing action:', dbError);
      return { statusCode: 500, body: JSON.stringify({ error: 'Error al ejecutar acción', details: dbError }) };
    }

    // Marcar pending payment como completado
    await supabase
      .from('agendaya_pending_payments')
      .update({ status: 'completed', completed_at: new Date().toISOString(), transaction_id: wompiTransactionId })
      .eq('id', pending.id);

    console.log(`[service-payment-webhook] ✅ ${action} completado para reference ${reference}`);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, action, reference }),
    };
  } catch (err: any) {
    console.error('[service-payment-webhook] Error:', err.message);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
