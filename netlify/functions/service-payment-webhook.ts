import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { verifyWompiWebhook } from './_shared/wompi';
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
    const payload = JSON.parse(event.body || '{}');

    if (!verifyWompiWebhook(payload)) {
      console.error('[service-payment-webhook] Invalid signature');
      return { statusCode: 401, body: JSON.stringify({ error: 'Invalid signature' }) };
    }

    const { event: eventName, data } = payload;

    console.log(`[service-payment-webhook] Event: ${eventName}`, JSON.stringify({ transaction: data?.transaction?.id }));

    if (eventName !== 'transaction.APPROVED') {
      return { statusCode: 200, body: JSON.stringify({ received: true, ignored: true }) };
    }

    const transaction = data?.transaction;
    if (!transaction) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Sin datos de transacción' }) };
    }

    const { reference, id: wompiTransactionId, amount_in_cents } = transaction;

    if (!reference) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Sin reference' }) };
    }

    if (!reference.startsWith('SRV-')) {
      return { statusCode: 200, body: JSON.stringify({ received: true, ignored: true }) };
    }

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

    const result = await executePaymentAction(supabase, action, {
      ...payloadObj,
      payment_provider: 'wompi',
      payment_id: wompiTransactionId,
      payment_amount: payloadObj.amount || amount_in_cents / 100,
      payment_currency: payloadObj.currency || 'COP',
    });

    if (!result.success) {
      console.error('[service-payment-webhook] Error executing action:', result.error);
      return { statusCode: 500, body: JSON.stringify({ error: result.error }) };
    }

    await supabase
      .from('agendaya_pending_payments')
      .update({ status: 'completed', completed_at: new Date().toISOString(), transaction_id: wompiTransactionId })
      .eq('id', pending.id);

    console.log(`[service-payment-webhook] ✅ ${action} completado para reference ${reference}`);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, action, reference }),
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[service-payment-webhook] Error:', message);
    return { statusCode: 500, body: JSON.stringify({ error: message }) };
  }
};
