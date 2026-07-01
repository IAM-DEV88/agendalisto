import { createClient } from '@supabase/supabase-js';
import type { Handler, HandlerEvent } from '@netlify/functions';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const rawBody = event.body || '';

    const verificationResponse = await fetch(
      'https://ipnpb.paypal.com/cgi-bin/webscr',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `cmd=_notify-validate&${rawBody}`,
      }
    );
    const verificationText = await verificationResponse.text();
    if (verificationText !== 'VERIFIED') {
      console.error('Invalid PayPal IPN:', verificationText);
      return { statusCode: 400, body: 'Invalid IPN' };
    }

    const params = new URLSearchParams(rawBody);
    const status = params.get('payment_status');
    const milestoneId = params.get('custom');
    const gross = params.get('mc_gross') || '0';
    const amount = parseFloat(gross);

    if (status === 'Completed' && milestoneId) {
      // Atomic update para evitar race conditions
      const { error } = await supabase.rpc('contribute_to_milestone', {
        p_milestone_id: milestoneId,
        p_amount: amount,
      });

      if (error) {
        console.error('[ipn-listener] RPC error, using fallback:', error);
        // Fallback: read-then-write (RPC aún no desplegado)
        const { data: existing, error: fetchError } = await supabase
          .from('agendaya_milestones')
          .select('current_amount')
          .eq('id', milestoneId)
          .single();

        if (fetchError || !existing) {
          console.error('Error fetching milestone for fallback:', fetchError);
          return { statusCode: 500, body: 'Error fetching milestone' };
        }

        const newAmount = (existing as { current_amount: number }).current_amount + amount;
        const { error: updateError } = await supabase
          .from('agendaya_milestones')
          .update({ current_amount: newAmount })
          .eq('id', milestoneId);

        if (updateError) {
          console.error('Error updating milestone (fallback):', updateError);
          return { statusCode: 500, body: 'Error updating milestone' };
        }
      }
    }

    return { statusCode: 200, body: 'OK' };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[ipn-listener] Error:', message);
    return { statusCode: 500, body: `Internal error: ${message}` };
  }
};
