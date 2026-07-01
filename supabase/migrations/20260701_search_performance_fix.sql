-- ============================================================
-- 20260701_search_performance_fix.sql
-- Optimiza search_agendaya_businesses:
--   1. Backfill likes_count desde datos reales
--   2. Recreación del trigger on_like_change (garantiza que
--      futuros likes actualicen la columna)
--   3. Índices para rendimiento
--   4. Reemplaza subquery COUNT(*) por likes_count column
--      (evita scan completo de agendaya_user_likes por fila)
--   5. Envuelto en BEGIN/COMMIT
-- ============================================================

BEGIN;

-- ════════════════════════════════════════════════════════════
-- 1. Backfill likes_count desde datos reales
--    Garantiza que la columna refleje el estado actual
--    antes de usarla en ORDER BY
-- ════════════════════════════════════════════════════════════
UPDATE public.agendaya_businesses b
SET likes_count = (
  SELECT COUNT(*) FROM public.agendaya_user_likes l
  WHERE l.business_id = b.id
);

UPDATE public.agendaya_services s
SET likes_count = (
  SELECT COUNT(*) FROM public.agendaya_user_likes l
  WHERE l.service_id = s.id
);

-- ════════════════════════════════════════════════════════════
-- 2. Asegurar que el trigger on_like_change existe y funciona
--    La función update_likes_count() fue creada en migración
--    007_agendaya_user_likes_rls.sql. Si fue borrada o
--    redefinida incorrectamente, la recreamos.
-- ════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.update_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    IF NEW.business_id IS NOT NULL THEN
      UPDATE public.agendaya_businesses SET likes_count = likes_count + 1 WHERE id = NEW.business_id;
    ELSIF NEW.service_id IS NOT NULL THEN
      UPDATE public.agendaya_services SET likes_count = likes_count + 1 WHERE id = NEW.service_id;
    END IF;
  ELSIF (TG_OP = 'DELETE') THEN
    IF OLD.business_id IS NOT NULL THEN
      UPDATE public.agendaya_businesses SET likes_count = likes_count - 1 WHERE id = OLD.business_id;
    ELSIF OLD.service_id IS NOT NULL THEN
      UPDATE public.agendaya_services SET likes_count = likes_count - 1 WHERE id = OLD.service_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_like_change ON public.agendaya_user_likes;
CREATE TRIGGER on_like_change
  AFTER INSERT OR DELETE ON public.agendaya_user_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_likes_count();

-- ════════════════════════════════════════════════════════════
-- 3. Índices
-- ════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_agendaya_user_likes_business_id
  ON public.agendaya_user_likes(business_id);

CREATE INDEX IF NOT EXISTS idx_agendaya_businesses_search_order
  ON public.agendaya_businesses(plan_score DESC, likes_count DESC, created_at DESC);

-- ════════════════════════════════════════════════════════════
-- 4. RPC optimizado (usa likes_count column en vez de subquery)
-- ════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.search_agendaya_businesses(
  p_search TEXT DEFAULT NULL,
  p_category_id TEXT DEFAULT NULL,
  p_location TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT NULL,
  p_offset INTEGER DEFAULT 0
)
RETURNS SETOF public.agendaya_businesses
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_category_id UUID;
BEGIN
  IF p_category_id IS NOT NULL THEN
    v_category_id := p_category_id::uuid;
  END IF;

  RETURN QUERY
  SELECT b.*
  FROM public.agendaya_businesses b
  WHERE
    (p_search IS NULL OR b.name ILIKE '%' || p_search || '%' OR b.description ILIKE '%' || p_search || '%')
    AND (p_category_id IS NULL OR b.category_id = v_category_id)
    AND (p_location IS NULL OR b.address ILIKE '%' || p_location || '%')
  ORDER BY
    b.plan_score DESC,
    b.likes_count DESC,
    b.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_agendaya_businesses TO anon, authenticated;

COMMIT;
