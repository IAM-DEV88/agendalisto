-- Migration: Gift codes (regalar servicios)
-- Fecha: 2026-06-20

CREATE TABLE IF NOT EXISTS agendaya_gift_codes (
  id BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  service_id UUID REFERENCES agendaya_services(id) ON DELETE CASCADE,
  business_id UUID REFERENCES agendaya_businesses(id) ON DELETE CASCADE,
  sender_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_phone TEXT DEFAULT NULL,
  message TEXT DEFAULT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  redeemed_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 year')
);

CREATE INDEX IF NOT EXISTS idx_agendaya_gift_codes_code ON agendaya_gift_codes(code);
CREATE INDEX IF NOT EXISTS idx_agendaya_gift_codes_status ON agendaya_gift_codes(status);

-- Escaparate gratuito: permitir negocios sin reserva online
ALTER TABLE agendaya_businesses
  ADD COLUMN IF NOT EXISTS showcase_only BOOLEAN DEFAULT false;
