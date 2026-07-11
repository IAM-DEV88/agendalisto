// WhatsApp Cloud API integration for landing page leads
//
// REQUISITOS (configurar en Netlify env vars):
//   WHATSAPP_TOKEN           — Token de acceso de Meta (System User o Permanent Token)
//   WHATSAPP_PHONE_NUMBER_ID — ID del número de teléfono en Meta Business Platform
//   WHATSAPP_ADMIN_NUMBER    — Número del admin para notificaciones (ej: 573178684451)
//
// Sin estas variables, la función no envía WhatsApp pero retorna 200
// para no bloquear el flujo. El lead ya quedó guardado en la BD.

import type { Handler, HandlerEvent } from '@netlify/functions';

const FB_API = 'https://graph.facebook.com/v18.0';

interface LeadPayload {
  name: string;
  businessName: string;
  whatsapp?: string;
  category?: string;
  cityName: string;
}

function getEnv(key: string): string | undefined {
  return process.env[key];
}

async function sendWhatsAppMessage(
  to: string,
  text: string
): Promise<{ ok: boolean; error?: string }> {
  const token = getEnv('WHATSAPP_TOKEN');
  const phoneNumberId = getEnv('WHATSAPP_PHONE_NUMBER_ID');

  if (!token || !phoneNumberId) {
    return { ok: false, error: 'WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID not configured' };
  }

  // Normalize number: remove +, spaces, dashes
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

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const lead: LeadPayload = JSON.parse(event.body || '{}');

  if (!lead.name || !lead.businessName || !lead.cityName) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required fields: name, businessName, cityName' }),
    };
  }

  const results: { admin?: { ok: boolean; error?: string }; lead?: { ok: boolean; error?: string } } = {};

  // 1. Notify AgendaYa admin
  const adminNumber = getEnv('WHATSAPP_ADMIN_NUMBER');
  if (adminNumber) {
    const adminText = [
      `🆕 *Nuevo lead* — ${lead.cityName}`,
      `Negocio: ${lead.businessName}`,
      `Contacto: ${lead.name}${lead.whatsapp ? ` — ${lead.whatsapp}` : ''}`,
      lead.category ? `Categoría: ${lead.category}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    results.admin = await sendWhatsAppMessage(adminNumber, adminText);
  }

  // 2. Send welcome guide to the lead (if they provided a number)
  if (lead.whatsapp) {
    const guideText = [
      `👋 *¡Hola ${lead.name}!* Gracias por registrar *${lead.businessName}* en AgendaYa ${lead.cityName}.`,
      '',
      '📌 *Sigue estos pasos para activar tu perfil:*',
      '1️⃣ Crea tu cuenta gratis: https://agendaya.co/register',
      '2️⃣ En el panel, completa los datos de tu negocio (fotos, horarios, servicios)',
      '3️⃣ Comparte tu enlace público y empieza a recibir clientes',
      '',
      '💬 ¿Necesitas ayuda? Responde este mensaje y te guiamos paso a paso.',
      '',
      '🌐 agendaYa.co',
    ].join('\n');

    results.lead = await sendWhatsAppMessage(lead.whatsapp, guideText);
  }

  const hadError = Object.values(results).some((r) => r && !r.ok);
  const statusCode = hadError ? 207 : 200;

  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: !hadError, results }),
  };
};
