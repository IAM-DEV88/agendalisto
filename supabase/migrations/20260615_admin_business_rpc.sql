-- ============================================================
-- 20260615_admin_business_rpc.sql
-- RPC para que administradores modifiquen cualquier negocio
-- directamente desde el panel de administración.
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_update_business(
  p_business_id UUID,
  p_name TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_whatsapp TEXT DEFAULT NULL,
  p_instagram TEXT DEFAULT NULL,
  p_facebook TEXT DEFAULT NULL,
  p_website TEXT DEFAULT NULL,
  p_plan TEXT DEFAULT NULL,
  p_category_id UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller_role TEXT;
BEGIN
  SELECT role INTO v_caller_role
  FROM public.agendaya_profiles
  WHERE id = auth.uid();

  IF v_caller_role IS NULL OR v_caller_role <> 'admin' THEN
    RAISE EXCEPTION 'Solo administradores pueden ejecutar esta función';
  END IF;

  UPDATE public.agendaya_businesses
  SET
    name        = COALESCE(p_name, name),
    description = COALESCE(p_description, description),
    address     = COALESCE(p_address, address),
    phone       = COALESCE(p_phone, phone),
    email       = COALESCE(p_email, email),
    whatsapp    = COALESCE(p_whatsapp, whatsapp),
    instagram   = COALESCE(p_instagram, instagram),
    facebook    = COALESCE(p_facebook, facebook),
    website     = COALESCE(p_website, website),
    plan        = COALESCE(p_plan, plan),
    category_id = COALESCE(p_category_id, category_id),
    updated_at  = NOW()
  WHERE id = p_business_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Negocio no encontrado';
  END IF;
END;
$$;
