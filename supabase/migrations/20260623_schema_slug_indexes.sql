-- ============================================================
-- 20260623_schema_slug_indexes.sql
-- Agrega columna slug a agendaya_businesses + índices faltantes
-- ============================================================

-- 1. Agregar columna slug a agendaya_businesses
ALTER TABLE public.agendaya_businesses ADD COLUMN IF NOT EXISTS slug TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_agendaya_businesses_slug ON public.agendaya_businesses (slug);

-- Backfill slugs para filas existentes (solo si slug es null)
UPDATE public.agendaya_businesses
SET slug = LOWER(REGEXP_REPLACE(TRIM(name), '[^a-zA-Z0-9áéíóúüñ\-]+', '-', 'g'))
WHERE slug IS NULL;

-- 2. Índices para agendaya_businesses
CREATE INDEX IF NOT EXISTS idx_agendaya_businesses_owner_id ON public.agendaya_businesses (owner_id);
CREATE INDEX IF NOT EXISTS idx_agendaya_businesses_category_id ON public.agendaya_businesses (category_id);

-- 3. Índices para agendaya_services
CREATE INDEX IF NOT EXISTS idx_agendaya_services_business_id ON public.agendaya_services (business_id);

-- 4. Índices para agendaya_appointments
CREATE INDEX IF NOT EXISTS idx_agendaya_appointments_business_id ON public.agendaya_appointments (business_id);
CREATE INDEX IF NOT EXISTS idx_agendaya_appointments_user_id ON public.agendaya_appointments (user_id);
CREATE INDEX IF NOT EXISTS idx_agendaya_appointments_status ON public.agendaya_appointments (status);

-- 5. Índices para agendaya_reviews
CREATE INDEX IF NOT EXISTS idx_agendaya_reviews_business_id ON public.agendaya_reviews (business_id);
CREATE INDEX IF NOT EXISTS idx_agendaya_reviews_status ON public.agendaya_reviews (status);

-- 6. Índices compuestos para agendaya_user_likes
CREATE INDEX IF NOT EXISTS idx_agendaya_user_likes_user_business ON public.agendaya_user_likes (user_id, business_id);
CREATE INDEX IF NOT EXISTS idx_agendaya_user_likes_user_service ON public.agendaya_user_likes (user_id, service_id);

-- 7. Índices para agendaya_business_hours y agendaya_business_config
CREATE INDEX IF NOT EXISTS idx_agendaya_business_hours_business_id ON public.agendaya_business_hours (business_id);

-- 8. Índice trigram para búsqueda por nombre (requiere extensión pg_trgm)
-- Se verifica si la extensión existe antes de crear el índice
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
    CREATE INDEX IF NOT EXISTS idx_agendaya_businesses_name_trgm ON public.agendaya_businesses USING gin (name gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS idx_agendaya_businesses_description_trgm ON public.agendaya_businesses USING gin (description gin_trgm_ops);
  END IF;
END
$$;

-- 9. Trigger para mantener slug actualizado al cambiar nombre
CREATE OR REPLACE FUNCTION public.update_agendaya_business_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.name IS DISTINCT FROM OLD.name) THEN
    NEW.slug := LOWER(REGEXP_REPLACE(TRIM(NEW.name), '[^a-zA-Z0-9áéíóúüñ\-]+', '-', 'g'));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_agendaya_business_slug ON public.agendaya_businesses;
CREATE TRIGGER trg_agendaya_business_slug
  BEFORE INSERT OR UPDATE OF name ON public.agendaya_businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_agendaya_business_slug();
