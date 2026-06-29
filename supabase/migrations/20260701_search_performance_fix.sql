-- ============================================================
-- 20260701_search_performance_fix.sql
-- Optimiza search_agendaya_businesses:
--   1. Reemplaza subquery COUNT(*) por likes_count column
--      (evita scan completo de agendaya_user_likes por fila)
--   2. Agrega índice compuesto para el ORDER BY
--   3. Envuelto en BEGIN/COMMIT (consistente con nueva policy)
-- ============================================================

BEGIN;

-- Índice compuesto para optimizar el ORDER BY más común
CREATE INDEX IF NOT EXISTS idx_agendaya_businesses_search_order
  ON public.agendaya_businesses(plan_score DESC, likes_count DESC, created_at DESC);

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
    b.likes_count DESC,
    b.plan_score DESC,
    b.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_agendaya_businesses TO anon, authenticated;

COMMIT;
