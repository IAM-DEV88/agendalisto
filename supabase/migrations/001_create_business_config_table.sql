-- 001_create_business_config_table.sql
-- Migration: Create table for storing business configuration flags

CREATE TABLE IF NOT EXISTS business_config (
  business_id uuid PRIMARY KEY REFERENCES businesses(id) ON DELETE CASCADE,
  permitir_reservas_online boolean NOT NULL DEFAULT true,
  mostrar_precios boolean NOT NULL DEFAULT true,
  mostrar_telefono boolean NOT NULL DEFAULT true,
  mostrar_email boolean NOT NULL DEFAULT false,
  mostrar_redes_sociales boolean NOT NULL DEFAULT true,
  mostrar_direccion boolean NOT NULL DEFAULT true,
  requiere_confirmacion boolean NOT NULL DEFAULT false,
  tiempo_minimo_cancelacion integer NOT NULL DEFAULT 48,
  notificaciones_email boolean NOT NULL DEFAULT true,
  notificaciones_whatsapp boolean NOT NULL DEFAULT false,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
); 