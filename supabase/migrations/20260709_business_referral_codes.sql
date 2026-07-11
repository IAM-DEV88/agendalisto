-- Migración: Agregar columna referral_code a agendaya_businesses
-- para códigos de referido vinculados al negocio (no al user_id)
-- Prefijo: AGB{base64(businessId)}

ALTER TABLE public.agendaya_businesses
  ADD COLUMN IF NOT EXISTS referral_code TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_agendaya_businesses_referral_code
  ON public.agendaya_businesses (referral_code)
  WHERE referral_code IS NOT NULL;

-- Backfill: generar referral_code para negocios existentes que no tengan
DO $$
DECLARE
  biz RECORD;
  raw TEXT;
  encoded TEXT;
BEGIN
  FOR biz IN
    SELECT id FROM public.agendaya_businesses
    WHERE referral_code IS NULL OR referral_code = ''
  LOOP
    raw := 'AGB' || encode(decode(replace(biz.id::text, '-', ''), 'hex'), 'base64');
    raw := replace(replace(raw, '=', ''), '/', '_');
    UPDATE public.agendaya_businesses
    SET referral_code = raw
    WHERE id = biz.id;
  END LOOP;
END $$;
