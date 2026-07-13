import type { SupabaseClient } from '@supabase/supabase-js';

export type GiftActionData = {
  code: string;
  service_id: string;
  business_id: string;
  sender_user_id: string;
  recipient_name: string;
  recipient_email: string;
  recipient_phone?: string | null;
  message?: string | null;
  expires_at?: string | null;
  payment_provider: string;
  payment_id: string;
  payment_amount: number;
  payment_currency?: string;
};

export type AppointmentActionData = {
  business_id: string;
  service_id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  notes?: string | null;
  guest_info?: Record<string, unknown> | null;
  payment_provider: string;
  payment_id: string;
  payment_amount: number;
};

export type PaymentActionResult = { success: true; data?: unknown } | { success: false; error: string };

export async function executePaymentAction(
  supabase: SupabaseClient,
  action: string,
  actionData: Record<string, unknown>,
): Promise<PaymentActionResult> {
  if (action === 'create_gift') {
    const d = actionData as unknown as GiftActionData;
    const { error, data } = await supabase.from('agendaya_gift_codes').insert({
      code: d.code,
      service_id: d.service_id,
      business_id: d.business_id,
      sender_user_id: d.sender_user_id,
      recipient_name: d.recipient_name,
      recipient_email: d.recipient_email,
      recipient_phone: d.recipient_phone || null,
      message: d.message || null,
      expires_at: d.expires_at || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active',
      payment_provider: d.payment_provider,
      payment_status: 'completed',
      payment_id: d.payment_id,
      payment_amount: d.payment_amount,
      payment_currency: d.payment_currency || 'COP',
    }).select().single();
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  }

  if (action === 'create_appointment') {
    const d = actionData as unknown as AppointmentActionData;
    const { data, error } = await supabase.rpc('create_appointment_safe', {
      p_business_id: d.business_id,
      p_service_id: d.service_id,
      p_user_id: d.user_id || '',
      p_start_time: d.start_time,
      p_end_time: d.end_time,
      p_notes: d.notes || null,
      p_guest_info: d.guest_info || null,
      p_is_guest: !!d.guest_info,
      p_payment_provider: d.payment_provider,
      p_payment_id: d.payment_id,
      p_payment_amount: d.payment_amount,
    });
    if (error) return { success: false, error: error.message };
    if (!data?.success) return { success: false, error: data?.error || 'Error al crear cita' };
    return { success: true, data: data.data };
  }

  return { success: false, error: `Acción desconocida: ${action}` };
}
