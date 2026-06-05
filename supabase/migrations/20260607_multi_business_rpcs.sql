-- ============================================================
-- 20260607_multi_business_rpcs.sql
-- RPCs necesarios para soporte multi-negocio.
-- ============================================================

-- Obtener todos los negocios de un usuario (por owner_id)
CREATE OR REPLACE FUNCTION public.get_user_businesses(p_user_id UUID)
RETURNS SETOF public.agendaya_businesses
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.agendaya_businesses
  WHERE owner_id = p_user_id
  ORDER BY created_at DESC;
END;
$$;

-- Establecer el negocio activo (actualiza business_id en el perfil)
CREATE OR REPLACE FUNCTION public.set_active_business(p_user_id UUID, p_business_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.agendaya_profiles
  SET business_id = p_business_id, updated_at = NOW()
  WHERE id = p_user_id;
END;
$$;
