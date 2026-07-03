-- ============================================================
-- 20260706_referral_badges_rpc.sql
-- RPC para obtener conteo de referidos en lote (bypass RLS)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_referral_badges(p_owner_ids UUID[])
RETURNS TABLE(owner_id UUID, count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT p.referred_by, COUNT(*)::BIGINT
  FROM public.agendaya_profiles p
  WHERE p.referred_by = ANY(p_owner_ids)
  GROUP BY p.referred_by;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_referral_badges TO anon, authenticated;
