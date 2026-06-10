-- ============================================================
-- 20260625_batch_check_likes.sql
-- RPC para verificar likes en batch (evitar N+1)
-- ============================================================

CREATE OR REPLACE FUNCTION public.check_user_likes_batch(
  p_user_id UUID,
  p_business_ids UUID[] DEFAULT '{}'
)
RETURNS TABLE(business_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT l.business_id
  FROM public.agendaya_user_likes l
  WHERE l.user_id = p_user_id
    AND l.business_id = ANY(p_business_ids);
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_user_likes_batch TO authenticated;
