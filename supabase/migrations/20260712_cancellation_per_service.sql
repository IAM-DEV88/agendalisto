-- Migration: Mover tiempo mínimo de cancelación de negocio a servicio
-- Fecha: 2026-07-12
-- Ahora cada servicio define su propio tiempo mínimo de cancelación
-- en lugar de usar uno global por negocio.

-- ============================================================
-- 1. agendaya_services: agregar columna
-- ============================================================
ALTER TABLE public.agendaya_services
  ADD COLUMN IF NOT EXISTS min_cancellation_hours INTEGER DEFAULT 48;

-- ============================================================
-- 2. agendaya_business_config: remover columna
-- ============================================================
ALTER TABLE public.agendaya_business_config
  DROP COLUMN IF EXISTS tiempo_minimo_cancelacion;
