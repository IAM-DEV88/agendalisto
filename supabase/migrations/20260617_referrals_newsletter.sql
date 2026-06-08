-- Migration: Referidos y Newsletter
-- Fecha: 2026-06-17

-- ═══ 1. Columna referred_by en agendaya_profiles ═══
-- Almacena el user_id del usuario que refirió a este perfil
ALTER TABLE agendaya_profiles
  ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Índice para consultas rápidas de conteo de referidos
CREATE INDEX IF NOT EXISTS idx_agendaya_profiles_referred_by
  ON agendaya_profiles(referred_by);

-- ═══ 2. Tabla de suscripciones al newsletter ═══
CREATE TABLE IF NOT EXISTS agendaya_newsletter_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(email)
);

-- ═══ 3. RLS para newsletter (solo inserción desde anónimo) ═══
ALTER TABLE agendaya_newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "agendaya_newsletter_insert" ON agendaya_newsletter_subscriptions;
END $$;

CREATE POLICY "agendaya_newsletter_insert"
  ON agendaya_newsletter_subscriptions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ═══ 4. RLS para referred_by (lectura para el propio usuario) ═══
DO $$
BEGIN
  DROP POLICY IF EXISTS "agendaya_profiles_read_referred_by" ON agendaya_profiles;
END $$;

CREATE POLICY "agendaya_profiles_read_referred_by"
  ON agendaya_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);
