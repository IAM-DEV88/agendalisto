-- ============================================================
-- 20260703_delete_account_rpc.sql
-- RPC para que un usuario elimine su propia cuenta.
-- Elimina el registro en auth.users, y el ON DELETE CASCADE
-- se encarga de limpiar agendaya_profiles, user_apps, etc.
-- ============================================================

CREATE OR REPLACE FUNCTION public.delete_agendaya_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Verificar que el usuario autenticado solo pueda eliminarse a sí mismo
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_agendaya_account TO authenticated;
