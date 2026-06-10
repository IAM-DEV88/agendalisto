-- ============================================================
-- 20260624_search_businesses_rpc_v2.sql
-- Reemplaza search_agendaya_businesses con versión que:
-- 1. Usa likes_count (columna precomputada) en vez de subquery
-- 2. Agrega LIMIT / OFFSET para paginación
-- 3. Ordena por plan_score DESC, likes_count DESC, created_at DESC
-- ============================================================

DROP FUNCTION IF EXISTS public.search_agendaya_businesses(p_search TEXT, p_category_id TEXT, p_location TEXT);

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
