import type { BusinessConfig } from './api';

export const DEFAULT_BUSINESS_CONFIG: BusinessConfig = {
  permitir_reservas_online: true,
  mostrar_precios: true,
  mostrar_telefono: true,
  mostrar_email: false,
  mostrar_redes_sociales: true,
  mostrar_direccion: true,
  requiere_confirmacion: true,
  notificaciones_email: false,
  notificaciones_whatsapp: false,
  slot_interval_minutes: 30,
  buffer_minutes: 0,
  max_advance_booking_days: 90,
};
