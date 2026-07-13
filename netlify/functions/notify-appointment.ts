import type { Handler, HandlerEvent } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const FB_API = 'https://graph.facebook.com/v18.0';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
);

interface NotificationPayload {
  appointment_id: string;
  event: 'created' | 'confirmed' | 'cancelled' | 'rescheduled' | 'reminder_24h';
}

function getEnv(key: string): string | undefined {
  return process.env[key];
}

async function sendWhatsAppMessage(
  to: string,
  text: string,
): Promise<{ ok: boolean; error?: string }> {
  const token = getEnv('WHATSAPP_TOKEN');
  const phoneNumberId = getEnv('WHATSAPP_PHONE_NUMBER_ID');

  if (!token || !phoneNumberId) {
    return { ok: false, error: 'WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID not configured' };
  }

  const cleanNumber = to.replace(/[+\s-]/g, '');

  try {
    const res = await fetch(`${FB_API}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanNumber,
        type: 'text',
        text: { preview_url: false, body: text },
      }),
    });

    const body = await res.json();

    if (!res.ok) {
      return { ok: false, error: `WhatsApp API error ${res.status}: ${body?.error?.message || JSON.stringify(body)}` };
    }

    return { ok: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { ok: false, error: msg };
  }
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const day = d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const time = d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true });
  return `${day} a las ${time}`;
}

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const payload: NotificationPayload = JSON.parse(event.body || '{}');

  if (!payload.appointment_id || !payload.event) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required fields: appointment_id, event' }),
    };
  }

  // Fetch appointment with related data
  const { data: appointment, error: fetchError } = await supabase
    .from('agendaya_appointments')
    .select(`
      id, start_time, end_time, status, cancel_reason, is_guest, guest_info, notes,
      services ( name, duration, price ),
      businesses ( name, address, slug, whatsapp, phone ),
      profiles ( full_name, phone, email )
    `)
    .eq('id', payload.appointment_id)
    .single();

  if (fetchError || !appointment) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'Appointment not found' }),
    };
  }

  const business = appointment.businesses as Record<string, unknown> | null;
  const service = appointment.services as Record<string, unknown> | null;
  const profile = appointment.profiles as Record<string, unknown> | null;
  const guestInfo = appointment.guest_info as Record<string, string> | null;

  const businessName = (business?.name as string) || 'el negocio';
  const serviceName = (service?.name as string) || 'el servicio';
  const clientName = profile?.full_name as string || guestInfo?.name || 'Cliente';
  const clientPhone = (profile?.phone as string) || guestInfo?.phone || null;
  const businessPhone = (business?.whatsapp as string) || (business?.phone as string) || null;
  const businessSlug = business?.slug as string || '';
  const publicUrl = `https://agendaya.co/${businessSlug}`;

  const results: Record<string, { ok: boolean; error?: string }> = {};

  // Build messages based on event type
  if (payload.event === 'created') {
    // Notify business owner
    if (businessPhone) {
      const text = [
        `📅 *Nueva cita en ${businessName}*`,
        '',
        `Cliente: ${clientName}`,
        `Servicio: ${serviceName}`,
        `Cuándo: ${formatDateTime(appointment.start_time)}`,
        appointment.notes ? `Nota: ${appointment.notes}` : '',
        '',
        'Confirma o rechaza desde tu panel.',
        publicUrl,
      ].filter(Boolean).join('\n');

      results.business = await sendWhatsAppMessage(businessPhone, text);
    }

    // Confirm to client
    if (clientPhone) {
      const text = [
        `✅ *Cita recibida — ${businessName}*`,
        '',
        `Servicio: ${serviceName}`,
        `Cuándo: ${formatDateTime(appointment.start_time)}`,
        '',
        'Recibirás una confirmación cuando el negocio acepte tu reserva.',
      ].filter(Boolean).join('\n');

      results.client = await sendWhatsAppMessage(clientPhone, text);
    }
  } else if (payload.event === 'confirmed') {
    if (clientPhone) {
      const text = [
        `🎉 *¡Tu cita en ${businessName} fue confirmada!*`,
        '',
        `Servicio: ${serviceName}`,
        `Cuándo: ${formatDateTime(appointment.start_time)}`,
        `Dónde: ${business?.address || 'Ver detalles en tu perfil'}`,
        '',
        'Te esperamos.',
      ].filter(Boolean).join('\n');

      results.client = await sendWhatsAppMessage(clientPhone, text);
    }
  } else if (payload.event === 'cancelled') {
    // Notify the other party
    const cancelledBy = profile?.full_name ? 'business' : 'client';
    if (cancelledBy === 'client' && businessPhone) {
      const text = [
        `❌ *Cita cancelada en ${businessName}*`,
        '',
        `Cliente: ${clientName}`,
        `Servicio: ${serviceName}`,
        `Fecha: ${formatDateTime(appointment.start_time)}`,
        appointment.cancel_reason ? `Motivo: ${appointment.cancel_reason}` : '',
      ].filter(Boolean).join('\n');

      results.business = await sendWhatsAppMessage(businessPhone, text);
    } else if (cancelledBy === 'business' && clientPhone) {
      const text = [
        `❌ *Tu cita en ${businessName} fue cancelada*`,
        '',
        `Servicio: ${serviceName}`,
        `Fecha: ${formatDateTime(appointment.start_time)}`,
        appointment.cancel_reason ? `Motivo: ${appointment.cancel_reason}` : '',
        '',
        'Puedes agendar una nueva cita desde tu perfil.',
      ].filter(Boolean).join('\n');

      results.client = await sendWhatsAppMessage(clientPhone, text);
    }
  } else if (payload.event === 'rescheduled') {
    if (clientPhone) {
      const text = [
        `🔄 *Cita reprogramada en ${businessName}*`,
        '',
        `Servicio: ${serviceName}`,
        `Nueva fecha: ${formatDateTime(appointment.start_time)}`,
        '',
        'Espera confirmación del negocio.',
      ].filter(Boolean).join('\n');

      results.client = await sendWhatsAppMessage(clientPhone, text);
    }
  } else if (payload.event === 'reminder_24h') {
    if (clientPhone) {
      const text = [
        `⏰ *Recordatorio — mañana tienes cita en ${businessName}*`,
        '',
        `Servicio: ${serviceName}`,
        `Hora: ${formatDateTime(appointment.start_time)}`,
        `Lugar: ${business?.address || 'Ver detalles'}`,
        '',
        '¡Te esperamos!',
      ].filter(Boolean).join('\n');

      results.client = await sendWhatsAppMessage(clientPhone, text);
    }
  }

  const hadError = Object.values(results).some(r => !r.ok);

  return {
    statusCode: hadError ? 207 : 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: !hadError, results }),
  };
};
