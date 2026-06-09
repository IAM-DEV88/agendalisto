-- Migration: Storage bucket, guest booking, loyalty program
-- Fecha: 2026-06-18

-- ═══ 1. Storage bucket público ═══
INSERT INTO storage.buckets (id, name, public, avif_autodetection)
VALUES ('agendaya-public', 'agendaya-public', true, false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies para agendaya-public
DO $$
BEGIN
  DROP POLICY IF EXISTS "agendaya_public_select" ON storage.objects;
  DROP POLICY IF EXISTS "agendaya_public_insert" ON storage.objects;
  DROP POLICY IF EXISTS "agendaya_public_delete" ON storage.objects;
END $$;

CREATE POLICY "agendaya_public_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'agendaya-public');

CREATE POLICY "agendaya_public_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'agendaya-public'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "agendaya_public_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'agendaya-public'
    AND auth.role() = 'authenticated'
  );

-- ═══ 2. Guest booking — campos en appointments ═══
ALTER TABLE agendaya_appointments
  ADD COLUMN IF NOT EXISTS guest_info JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_guest BOOLEAN DEFAULT false;

-- ═══ 3. Loyalty program ═══
ALTER TABLE agendaya_appointments
  ADD COLUMN IF NOT EXISTS visit_count INT DEFAULT 1;

-- Tabla de fidelización por cliente+negocio
CREATE TABLE IF NOT EXISTS agendaya_loyalty (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES agendaya_businesses(id) ON DELETE CASCADE,
  visit_count INT NOT NULL DEFAULT 1,
  loyalty_level TEXT NOT NULL DEFAULT 'regular',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, business_id)
);

-- Trigger para actualizar visit_count en agendaya_loyalty
CREATE OR REPLACE FUNCTION trg_update_loyalty()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.user_id IS NOT NULL THEN
    INSERT INTO agendaya_loyalty (user_id, business_id, visit_count, loyalty_level)
    VALUES (NEW.user_id, NEW.business_id, 1, 'regular')
    ON CONFLICT (user_id, business_id) DO UPDATE SET
      visit_count = agendaya_loyalty.visit_count + 1,
      loyalty_level = CASE
        WHEN agendaya_loyalty.visit_count + 1 >= 10 THEN 'vip'
        WHEN agendaya_loyalty.visit_count + 1 >= 4 THEN 'frecuente'
        ELSE 'regular'
      END,
      updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_loyalty_trigger ON agendaya_appointments;
CREATE TRIGGER trg_update_loyalty_trigger
  AFTER UPDATE OF status ON agendaya_appointments
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION trg_update_loyalty();

-- ═══ 4. Cancel reason en appointments ═══
ALTER TABLE agendaya_appointments
  ADD COLUMN IF NOT EXISTS cancel_reason TEXT DEFAULT NULL;

-- ═══ 5. Índices ═══
CREATE INDEX IF NOT EXISTS idx_agendaya_appointments_guest
  ON agendaya_appointments(is_guest) WHERE is_guest = true;

CREATE INDEX IF NOT EXISTS idx_agendaya_loyalty_user_business
  ON agendaya_loyalty(user_id, business_id);
