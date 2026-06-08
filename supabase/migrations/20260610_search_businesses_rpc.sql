-- ============================================================
-- 20260610_search_businesses_rpc.sql
-- RPC de búsqueda de negocios con ordenamiento por likes reales.
--
-- Ordena por cantidad real de likes (subconsulta a
-- agendaya_user_likes), luego plan_score, luego created_at.
-- ============================================================

CREATE OR REPLACE FUNCTION public.search_agendaya_businesses(
  p_search TEXT DEFAULT NULL,
  p_category_id TEXT DEFAULT NULL,
  p_location TEXT DEFAULT NULL
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
    (SELECT COUNT(*) FROM public.agendaya_user_likes l WHERE l.business_id = b.id) DESC,
    b.plan_score DESC,
    b.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_agendaya_businesses TO anon, authenticated;
