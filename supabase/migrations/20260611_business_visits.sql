-- ============================================================
-- 20260611_business_visits.sql
-- Seguimiento de visitas a negocios + métricas de favoritos.
--
-- Tabla: agendaya_business_visits
-- RPCs: record_business_visit, get_business_stats
-- ============================================================

-- ════════════════════════════════════════════
-- 1. Tabla de visitas
-- ════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.agendaya_business_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.agendaya_businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  anonymous_id TEXT,
  visited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visits_business_id ON public.agendaya_business_visits(business_id);
CREATE INDEX IF NOT EXISTS idx_visits_visited_at ON public.agendaya_business_visits(visited_at);
CREATE INDEX IF NOT EXISTS idx_visits_business_visited ON public.agendaya_business_visits(business_id, visited_at);

-- ════════════════════════════════════════════
-- 2. RPC: registrar visita (con dedup 30 min)
-- ════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.record_business_visit(
  p_business_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_anonymous_id TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Evitar duplicados: misma combinación business + user/anonymous en últimos 30 min
  IF p_user_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.agendaya_business_visits
      WHERE business_id = p_business_id
        AND user_id = p_user_id
        AND visited_at > NOW() - INTERVAL '30 minutes'
    ) THEN
      RETURN;
    END IF;
  ELSIF p_anonymous_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.agendaya_business_visits
      WHERE business_id = p_business_id
        AND anonymous_id = p_anonymous_id
        AND visited_at > NOW() - INTERVAL '30 minutes'
    ) THEN
      RETURN;
    END IF;
  END IF;

  INSERT INTO public.agendaya_business_visits (business_id, user_id, anonymous_id)
  VALUES (p_business_id, p_user_id, p_anonymous_id);
END;
$$;

-- ════════════════════════════════════════════
-- 3. RPC: obtener estadísticas del negocio
-- ════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_business_stats(p_business_id UUID)
RETURNS TABLE (
  total_visits BIGINT,
  visits_today BIGINT,
  visits_week BIGINT,
  visits_month BIGINT,
  unique_visitors BIGINT,
  total_business_likes BIGINT,
  total_service_likes BIGINT,
  total_services BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE((SELECT COUNT(*) FROM public.agendaya_business_visits v WHERE v.business_id = p_business_id), 0)::bigint,
    COALESCE((SELECT COUNT(*) FROM public.agendaya_business_visits v WHERE v.business_id = p_business_id AND v.visited_at::date = CURRENT_DATE), 0)::bigint,
    COALESCE((SELECT COUNT(*) FROM public.agendaya_business_visits v WHERE v.business_id = p_business_id AND v.visited_at >= date_trunc('week', CURRENT_DATE)), 0)::bigint,
    COALESCE((SELECT COUNT(*) FROM public.agendaya_business_visits v WHERE v.business_id = p_business_id AND v.visited_at >= date_trunc('month', CURRENT_DATE)), 0)::bigint,
    COALESCE((SELECT COUNT(DISTINCT COALESCE(user_id::text, anonymous_id)) FROM public.agendaya_business_visits v WHERE v.business_id = p_business_id AND (v.user_id IS NOT NULL OR v.anonymous_id IS NOT NULL)), 0)::bigint,
    COALESCE((SELECT likes_count FROM public.agendaya_businesses WHERE id = p_business_id), 0)::bigint,
    COALESCE((SELECT SUM(likes_count) FROM public.agendaya_services WHERE business_id = p_business_id), 0)::bigint,
    COALESCE((SELECT COUNT(*) FROM public.agendaya_services WHERE business_id = p_business_id AND is_active = true), 0)::bigint;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_business_visit TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_business_stats TO anon, authenticated;
