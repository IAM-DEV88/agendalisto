-- Migration: Service gifting & payment fields
-- Fecha: 2026-06-26
-- Añade flags de pago a servicios y columnas de pago a gift_codes

-- ============================================================
-- 1. agendaya_services: nuevos flags
-- ============================================================
ALTER TABLE public.agendaya_services
  ADD COLUMN IF NOT EXISTS can_be_gifted BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.agendaya_services
  ADD COLUMN IF NOT EXISTS requires_payment BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.agendaya_services
  ADD COLUMN IF NOT EXISTS payment_percentage NUMERIC(5,2) NOT NULL DEFAULT 100.00;

-- ============================================================
-- 2. agendaya_gift_codes: columnas de pago
-- ============================================================
ALTER TABLE public.agendaya_gift_codes
  ADD COLUMN IF NOT EXISTS payment_provider TEXT;

ALTER TABLE public.agendaya_gift_codes
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending';

ALTER TABLE public.agendaya_gift_codes
  ADD COLUMN IF NOT EXISTS payment_id TEXT;

ALTER TABLE public.agendaya_gift_codes
  ADD COLUMN IF NOT EXISTS payment_amount NUMERIC(10,2);

ALTER TABLE public.agendaya_gift_codes
  ADD COLUMN IF NOT EXISTS payment_currency TEXT DEFAULT 'COP';

-- check constraint para payment_status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ck_gift_codes_payment_status'
    AND conrelid = 'public.agendaya_gift_codes'::regclass
  ) THEN
    ALTER TABLE public.agendaya_gift_codes
      ADD CONSTRAINT ck_gift_codes_payment_status
      CHECK (payment_status IN ('pending', 'completed', 'failed'));
  END IF;
END;
$$;

-- ============================================================
-- 3. agendaya_appointments: columna de pago opcional
-- ============================================================
ALTER TABLE public.agendaya_appointments
  ADD COLUMN IF NOT EXISTS payment_status TEXT;

ALTER TABLE public.agendaya_appointments
  ADD COLUMN IF NOT EXISTS payment_provider TEXT;

ALTER TABLE public.agendaya_appointments
  ADD COLUMN IF NOT EXISTS payment_id TEXT;

ALTER TABLE public.agendaya_appointments
  ADD COLUMN IF NOT EXISTS payment_amount NUMERIC(10,2);

-- ============================================================
-- 4. agendaya_pending_payments: cola de acciones post-pago
--    (para flujos asíncronos como Wompi donde el webhook
--     confirma el pago y luego se ejecuta la acción)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.agendaya_pending_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL,
  transaction_id TEXT,
  action TEXT NOT NULL CHECK (action IN ('create_gift', 'create_appointment')),
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pending_payments_reference ON public.agendaya_pending_payments(reference);
CREATE INDEX IF NOT EXISTS idx_pending_payments_status ON public.agendaya_pending_payments(status);

