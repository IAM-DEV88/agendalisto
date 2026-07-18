-- Migration: Performance RPCs
-- Created: 2026-07-30
-- Description: RPCs for client-side optimizations (toggle like, loyalty stats)

-- ─── toggle_agendaya_like ───
-- Atomically toggles a like on a business or service in a single call.
CREATE OR REPLACE FUNCTION public.toggle_agendaya_like(
  p_user_id UUID,
  p_target_id UUID,
  p_target_type TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_column TEXT;
  v_action TEXT;
BEGIN
  IF p_target_type = 'business' THEN
    v_column := 'business_id';
  ELSIF p_target_type = 'service' THEN
    v_column := 'service_id';
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Invalid target type');
  END IF;

  -- Try to insert
  BEGIN
    EXECUTE format(
      'INSERT INTO public.agendaya_user_likes (user_id, %I) VALUES ($1, $2)',
      v_column
    ) USING p_user_id, p_target_id;
    v_action := 'added';
  EXCEPTION
    WHEN unique_violation THEN
      -- Already liked → remove
      EXECUTE format(
        'DELETE FROM public.agendaya_user_likes WHERE user_id = $1 AND %I = $2',
        v_column
      ) USING p_user_id, p_target_id;
      v_action := 'removed';
  END;

  RETURN jsonb_build_object('success', true, 'action', v_action);
END;
$$;

-- ─── get_admin_loyalty_stats ───
-- Returns aggregated loyalty level counts in a single row.
CREATE OR REPLACE FUNCTION public.get_admin_loyalty_stats()
RETURNS TABLE(
  total_entries BIGINT,
  vip_count BIGINT,
  frecuente_count BIGINT,
  regular_count BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    COUNT(*)::BIGINT AS total_entries,
    COUNT(*) FILTER (WHERE loyalty_level = 'vip')::BIGINT AS vip_count,
    COUNT(*) FILTER (WHERE loyalty_level = 'frecuente')::BIGINT AS frecuente_count,
    COUNT(*) FILTER (WHERE loyalty_level = 'regular')::BIGINT AS regular_count
  FROM public.agendaya_loyalty;
$$;
