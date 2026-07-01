const BASE_URL = import.meta.env.VITE_BASE_URL || window.location.origin;

function inviteEmailHtml(businessName: string): string {
  return `<!DOCTYPE html>
<html lang="es" xmlns="https://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>AgendaYa - Transforma tu negocio</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" style="max-width:600px;">
          <!-- Header -->
          <tr>
            <td align="center" style="padding:0 0 24px;">
              <h1 style="margin:0;font-size:28px;color:#111827;font-weight:700;">
                <span style="color:#2563eb;">Agenda</span><span style="color:#f97316;">Ya</span>
              </h1>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td style="background:#ffffff;border-radius:16px;padding:40px 32px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
              <!-- Greeting -->
              <p style="margin:0 0 20px;font-size:16px;color:#374151;line-height:1.6;">
                Hola <strong>${businessName}</strong>,
              </p>
              <p style="margin:0 0 24px;font-size:16px;color:#374151;line-height:1.6;">
                Sabemos lo importante que es para ti hacer crecer tu negocio. Por eso creamos
                <strong>AgendaYa</strong>, una plataforma pensada para negocios como el tuyo.
              </p>

              <!-- Value Proposition -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                <tr>
                  <td style="background:#eff6ff;border-radius:12px;padding:24px;">
                    <h2 style="margin:0 0 16px;font-size:18px;color:#1e40af;">
                      ¿Qué puede hacer AgendaYa por tu negocio?
                    </h2>
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding:0 0 12px;">
                          <table role="presentation" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="vertical-align:top;width:24px;font-size:16px;color:#2563eb;">✓</td>
                              <td style="font-size:14px;color:#374151;line-height:1.5;">
                                <strong>Perfil público gratuito</strong> — Tus clientes te encuentran en Google
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:0 0 12px;">
                          <table role="presentation" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="vertical-align:top;width:24px;font-size:16px;color:#2563eb;">✓</td>
                              <td style="font-size:14px;color:#374151;line-height:1.5;">
                                <strong>Reservas online 24/7</strong> — Sin llamadas, sin perder clientes
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:0 0 12px;">
                          <table role="presentation" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="vertical-align:top;width:24px;font-size:16px;color:#2563eb;">✓</td>
                              <td style="font-size:14px;color:#374151;line-height:1.5;">
                                <strong>Sin página web</strong> — AgendaYa es tu página web profesional
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:0;">
                          <table role="presentation" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="vertical-align:top;width:24px;font-size:16px;color:#2563eb;">✓</td>
                              <td style="font-size:14px;color:#374151;line-height:1.5;">
                                <strong>Plan gratis</strong> — Sin compromiso, sin tarjeta de crédito
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:0 0 28px;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="background:#2563eb;border-radius:8px;">
                          <a href="${BASE_URL}/register" target="_blank" style="display:inline-block;padding:14px 40px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
                            Crear perfil gratis →
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-top:1px solid #e5e7eb;padding:0 0 20px;"></td>
                </tr>
              </table>

              <!-- Testimonial -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td style="background:#f9fafb;border-radius:8px;padding:16px;font-style:italic;font-size:14px;color:#6b7280;border-left:4px solid #2563eb;">
                    "Desde que uso AgendaYa, mis clientes reservan solos. Ya no pierdo llamadas y
                    tengo más tiempo para atenderlos mejor." — <strong>María, Salón de Belleza</strong>
                  </td>
                </tr>
              </table>

              <!-- Footer of card -->
              <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.5;">
                ¿Tienes dudas? Responde este correo o escríbenos a
                <a href="mailto:hola@agendaya.com" style="color:#2563eb;text-decoration:underline;">hola@agendaya.com</a>
              </p>
            </td>
          </tr>

          <!-- Unsubscribe Footer -->
          <tr>
            <td align="center" style="padding:24px 16px 0;">
              <p style="margin:0 0 8px;font-size:12px;color:#9ca3af;">
                Recibiste este correo porque tu negocio está registrado en directorios comerciales
                de Colombia y creemos que AgendaYa puede ayudarte.
              </p>
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                <a href="${BASE_URL}/unsubscribe?email={{EMAIL}}" style="color:#9ca3af;text-decoration:underline;">Darme de baja</a>
                &nbsp;·&nbsp; <a href="${BASE_URL}" style="color:#9ca3af;text-decoration:underline;">AgendaYa</a>
              </p>
              <p style="margin:12px 0 0;font-size:12px;color:#d1d5db;">
                &copy; ${new Date().getFullYear()} AgendaYa. Todos los derechos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function inviteEmailText(businessName: string): string {
  return `Hola ${businessName},

Sabemos lo importante que es para ti hacer crecer tu negocio. Por eso creamos AgendaYa, una plataforma pensada para negocios como el tuyo.

¿Qué puede hacer AgendaYa por tu negocio?
✓ Perfil público gratuito — Tus clientes te encuentran en Google
✓ Reservas online 24/7 — Sin llamadas, sin perder clientes
✓ Sin página web — AgendaYa es tu página web profesional
✓ Plan gratis — Sin compromiso, sin tarjeta de crédito

Crear tu perfil gratis: ${BASE_URL}/register

¿Tienes dudas? Escríbenos a hola@agendaya.com

---
Recibiste este correo porque tu negocio está registrado en directorios comerciales de Colombia.
Darte de baja: ${BASE_URL}/unsubscribe?email={{EMAIL}}
AgendaYa - ${BASE_URL}`;
}

export { inviteEmailHtml, inviteEmailText };
export default { inviteEmailHtml, inviteEmailText };
