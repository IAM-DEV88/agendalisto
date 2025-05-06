import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const handler = async (event) => {
  // Read raw body
  const rawBody = event.body || '';

  // Verify IPN with PayPal
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

  // Parse IPN fields
  const params = new URLSearchParams(rawBody);
  const status = params.get('payment_status');
  const milestoneId = params.get('custom');
  const gross = params.get('mc_gross') || '0';
  const amount = parseFloat(gross);

  if (status === 'Completed' && milestoneId) {
    // Fetch existing current_amount
    const { data, error } = await supabase
      .from('milestones')
      .select('current_amount')
      .eq('id', milestoneId)
      .single();

    if (error || !data) {
      console.error('Error fetching milestone:', error);
    } else {
      const newAmount = data.current_amount + amount;
      const { error: updateError } = await supabase
        .from('milestones')
        .update({ current_amount: newAmount })
        .eq('id', milestoneId);
      if (updateError) console.error('Error updating milestone:', updateError);
    }
  }

  return { statusCode: 200, body: 'OK' };
}; 