-- ============================================================
-- 20260614_admin_update_user_rpc.sql
-- RPC para que administradores gestionen roles y planes
-- de cualquier usuario directamente desde el panel admin.
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_update_user(
  p_target_user_id UUID,
  p_new_role TEXT DEFAULT NULL,
  p_new_plan TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller_role TEXT;
BEGIN
  -- Verificar que quien llama es admin
  SELECT role INTO v_caller_role
  FROM public.agendaya_profiles
  WHERE id = auth.uid();

  IF v_caller_role IS NULL OR v_caller_role <> 'admin' THEN
    RAISE EXCEPTION 'Solo administradores pueden ejecutar esta función';
  END IF;

  -- Actualizar role si se especificó
  IF p_new_role IS NOT NULL THEN
    IF p_new_role NOT IN ('visitor', 'client', 'business_owner', 'moderator', 'admin') THEN
      RAISE EXCEPTION 'Rol "%" no válido', p_new_role;
    END IF;
    UPDATE public.agendaya_profiles
    SET role = p_new_role, updated_at = NOW()
    WHERE id = p_target_user_id;
  END IF;

  -- Actualizar plan si se especificó
  IF p_new_plan IS NOT NULL THEN
    IF p_new_plan NOT IN ('starter', 'pro', 'premium') THEN
      RAISE EXCEPTION 'Plan "%" no válido', p_new_plan;
    END IF;
    UPDATE public.agendaya_profiles
    SET plan = p_new_plan, updated_at = NOW()
    WHERE id = p_target_user_id;
  END IF;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuario no encontrado';
  END IF;
END;
$$;
