-- Migration: Add missing columns to agendaya_loyalty
-- Las migraciones 20260705 y 20260713 redefinieron trg_update_loyalty()
-- para INSERT con visit_date y appointment_id, pero NUNCA agregaron
-- esas columnas a la tabla. Esto causaba error al completar una cita.

-- 1. Agregar columnas faltantes
ALTER TABLE public.agendaya_loyalty
  ADD COLUMN IF NOT EXISTS visit_date DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES public.agendaya_appointments(id) ON DELETE SET NULL;

-- 2. Asignar visit_date a filas existentes que quedaron en NULL
UPDATE public.agendaya_loyalty
SET visit_date = CURRENT_DATE
WHERE visit_date IS NULL;

-- 3. Hacer NOT NULL después del backfill
ALTER TABLE public.agendaya_loyalty
  ALTER COLUMN visit_date SET NOT NULL;

-- 4. Reemplazar UNIQUE constraint
ALTER TABLE public.agendaya_loyalty
  DROP CONSTRAINT IF EXISTS agendaya_loyalty_user_id_business_id_key;

-- El UNIQUE original no tenía nombre explícito; PostgreSQL auto-nombra como
-- agendaya_loyalty_user_id_business_id_key. Intentamos con el nombre genérico.
-- Si falla, lo dropeamos por columnas.
DO $$
BEGIN
  -- Intentar drop por nombre conocido (el que genera PostgreSQL automáticamente)
  BEGIN
    ALTER TABLE public.agendaya_loyalty DROP CONSTRAINT IF EXISTS agendaya_loyalty_user_id_business_id_key;
  EXCEPTION WHEN undefined_object THEN
    NULL;
  END;

  -- Si aún existe (nombre diferente), dropear por columnas
  IF EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE t.relname = 'agendaya_loyalty'
    AND c.contype = 'u'
    AND c.conkey = ARRAY[
      (SELECT a.attnum FROM pg_attribute a WHERE a.attrelid = t.oid AND a.attname = 'user_id'),
      (SELECT a.attnum FROM pg_attribute a WHERE a.attrelid = t.oid AND a.attname = 'business_id')
    ]
  ) THEN
    ALTER TABLE public.agendaya_loyalty DROP CONSTRAINT IF EXISTS agendaya_loyalty_user_id_business_id_key2;
  END IF;
END $$;

-- 5. Agregar nuevo UNIQUE constraint
ALTER TABLE public.agendaya_loyalty
  ADD CONSTRAINT agendaya_loyalty_user_business_date_key
  UNIQUE (user_id, business_id, visit_date);

-- 6. Recrear índice
DROP INDEX IF EXISTS idx_agendaya_loyalty_user_business;
CREATE INDEX IF NOT EXISTS idx_agendaya_loyalty_user_business_date
  ON public.agendaya_loyalty(user_id, business_id, visit_date);
