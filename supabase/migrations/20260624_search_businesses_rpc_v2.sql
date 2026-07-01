-- ============================================================
-- 20260624_search_businesses_rpc_v2.sql
-- Reemplaza search_agendaya_businesses con versión que:
-- 1. Agrega LIMIT / OFFSET para paginación
-- 2. Ordena por likes reales DESC, plan_score DESC, created_at DESC
-- 3. Backfill likes_count para datos históricos
-- ============================================================

-- Backfill likes_count desde datos reales (por si hay likes previos a la columna)
UPDATE public.agendaya_businesses b
SET likes_count = (SELECT COUNT(*) FROM public.agendaya_user_likes l WHERE l.business_id = b.id)
WHERE EXISTS (SELECT 1 FROM public.agendaya_user_likes l WHERE l.business_id = b.id);

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
    (SELECT COUNT(*) FROM public.agendaya_user_likes l WHERE l.business_id = b.id) DESC,
    b.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_agendaya_businesses TO anon, authenticated;
