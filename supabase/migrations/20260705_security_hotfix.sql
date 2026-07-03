-- ══════════════════════════════════════════════════════════════
-- 20260705_security_hotfix.sql
-- Parche de seguridad integral: auth.uid(), políticas, atomicidad
-- ══════════════════════════════════════════════════════════════

BEGIN;

-- ════════════════════════════════════════════════════════════
-- 1. Fix: agendaya_subscriptions — DROP políticas permisivas viejas
--    008 las creó con nombres 'agendaya_subscriptions_insert_system'
--    y 'agendaya_subscriptions_update_system'. 20260630 creó políticas
--    NUEVAS con nombres distintos SIN dropear las viejas. Como PostgreSQL
--    OR-ea las políticas, las permisivas seguían vigentes.
-- ════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS agendaya_subscriptions_insert_system ON public.agendaya_subscriptions;
DROP POLICY IF EXISTS agendaya_subscriptions_update_system ON public.agendaya_subscriptions;

-- También dropear por si acaso las que tengan nombres genéricos
DROP POLICY IF EXISTS "Acceso público a suscripciones" ON public.agendaya_subscriptions;
DROP POLICY IF EXISTS "Insertar suscripciones" ON public.agendaya_subscriptions;
DROP POLICY IF EXISTS "Actualizar suscripciones" ON public.agendaya_subscriptions;

-- ════════════════════════════════════════════════════════════
-- 2. Fix: update_agendaya_profile_role — agregar auth.uid() check
--    Evita que un usuario cambie el rol de otro
-- ════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.update_agendaya_profile_role(
  p_user_id UUID,
  p_new_role TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'No puedes modificar el perfil de otro usuario';
  END IF;

  IF p_new_role NOT IN ('visitor', 'client', 'business_owner') THEN
    RAISE EXCEPTION 'Rol "%" no permitido para auto-asignación', p_new_role;
  END IF;

  UPDATE public.agendaya_profiles
  SET role = p_new_role, updated_at = NOW()
  WHERE id = p_user_id;
END;
$$;

-- ════════════════════════════════════════════════════════════
-- 3. Fix: update_agendaya_business_plan — agregar auth.uid() check
-- ════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.update_agendaya_business_plan(
  p_user_id UUID,
  p_new_plan TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'No puedes modificar el plan de otro usuario';
  END IF;

  IF p_new_plan NOT IN ('starter', 'pro', 'premium') THEN
    RAISE EXCEPTION 'Plan "%" no válido', p_new_plan;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.agendaya_profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Usuario no encontrado';
  END IF;

  UPDATE public.agendaya_profiles
  SET plan = p_new_plan, updated_at = NOW()
  WHERE id = p_user_id;
END;
$$;

-- ════════════════════════════════════════════════════════════
-- 4. Fix: get_user_businesses — agregar auth.uid() check
-- ════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_user_businesses(p_user_id UUID)
RETURNS SETOF public.agendaya_businesses
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'No puedes ver los negocios de otro usuario';
  END IF;

  RETURN QUERY
  SELECT *
  FROM public.agendaya_businesses
  WHERE owner_id = p_user_id
  ORDER BY created_at DESC;
END;
$$;

-- ════════════════════════════════════════════════════════════
-- 5. Fix: set_active_business — agregar auth.uid() check
-- ════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.set_active_business(p_user_id UUID, p_business_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'No puedes cambiar el negocio activo de otro usuario';
  END IF;

  UPDATE public.agendaya_profiles
  SET business_id = p_business_id, updated_at = NOW()
  WHERE id = p_user_id;
END;
$$;

-- ════════════════════════════════════════════════════════════
-- 6. Fix: agendaya_pending_payments — scoping por usuario
--    Política SELECT permite a cualquier authenticated ver TODOS
--    los pending payments. Se agrega columna user_id si no existe
--    y se scopia la política.
-- ════════════════════════════════════════════════════════════
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'agendaya_pending_payments' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.agendaya_pending_payments ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Backfill: extraer userId del campo reference o payload
UPDATE public.agendaya_pending_payments
SET user_id = CASE
  WHEN reference LIKE 'SRV-%' THEN SPLIT_PART(reference, '-', 2)::UUID
  WHEN reference LIKE 'AGD-%' THEN
    -- userId puede contener guiones, extraer entre AGD- y último segmento
    SUBSTRING(reference FROM 5 FOR LENGTH(reference) - 5 - POSITION('-' IN REVERSE(reference)))::UUID
  ELSE NULL
END::UUID
WHERE user_id IS NULL;

-- Reemplazar política SELECT con versión scoped
DROP POLICY IF EXISTS agendaya_pending_payments_select_self ON public.agendaya_pending_payments;
CREATE POLICY agendaya_pending_payments_select_self ON public.agendaya_pending_payments
  FOR SELECT USING (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════════
-- 7. Fix: contribute_to_milestone — RPC atómico
--    Reemplaza el patrón read-then-write que tiene race condition
-- ════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.contribute_to_milestone(
  p_milestone_id UUID,
  p_amount NUMERIC
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.agendaya_milestones
  SET
    current_amount = current_amount + p_amount,
    updated_at = NOW()
  WHERE id = p_milestone_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Milestone no encontrado: %', p_milestone_id;
  END IF;
END;
$$;

-- ════════════════════════════════════════════════════════════
-- 8. Fix: SET search_path en funciones SECURITY DEFINER faltantes
--    trg_update_loyalty no tenía SECURITY DEFINER ni SET search_path
-- ════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.trg_update_loyalty()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_streak INTEGER;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    INSERT INTO public.agendaya_loyalty (user_id, business_id, visit_date, appointment_id)
    VALUES (NEW.user_id, NEW.business_id, CURRENT_DATE, NEW.id)
    ON CONFLICT (user_id, business_id, visit_date) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- ════════════════════════════════════════════════════════════
-- 9. RPC: get_top_referrers — agregación en DB
--    Reemplaza el fetch-total + count-en-cliente que no escala
-- ════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_top_referrers(p_limit INTEGER DEFAULT 10)
RETURNS TABLE(
  referrer_id UUID,
  referrer_name TEXT,
  referrer_email TEXT,
  count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS referrer_id,
    p.full_name::TEXT AS referrer_name,
    p.email::TEXT AS referrer_email,
    COUNT(r.id)::BIGINT AS count
  FROM public.agendaya_profiles p
  INNER JOIN public.agendaya_profiles r ON r.referred_by::TEXT = p.id::TEXT
  GROUP BY p.id, p.full_name, p.email
  ORDER BY count DESC
  LIMIT p_limit;
END;
$$;

-- ════════════════════════════════════════════════════════════
-- 10. RPC: get_admin_referral_stats — agregación en DB
-- ════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_admin_referral_stats()
RETURNS TABLE(
  total_referrals BIGINT,
  unique_referrers BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_referrals,
    COUNT(DISTINCT referred_by)::BIGINT AS unique_referrers
  FROM public.agendaya_profiles
  WHERE referred_by IS NOT NULL;
END;
$$;

COMMIT;
