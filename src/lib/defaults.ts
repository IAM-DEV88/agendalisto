import type { BusinessConfig } from './api';

export const DEFAULT_BUSINESS_CONFIG: BusinessConfig = {
  permitir_reservas_online: true,
  mostrar_precios: true,
  mostrar_telefono: true,
  mostrar_email: false,
  mostrar_redes_sociales: true,
  mostrar_direccion: true,
  requiere_confirmacion: false,
  tiempo_minimo_cancelacion: 48,
  notificaciones_email: false,
  notificaciones_whatsapp: false,
};
