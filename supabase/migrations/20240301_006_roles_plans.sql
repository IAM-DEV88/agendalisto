-- ============================================================
-- 006_roles_plans.sql
-- Roles y Planes para AgendaYa
--
-- Agrega:
--   role, plan a agendaya_profiles
--   plan_score a agendaya_businesses
--   triggers de sincronización, protección y cómputo
--   RPCs para auto-asignación y upgrades
-- ============================================================

-- ════════════════════════════════════════════
-- 1. Columnas nuevas
-- ════════════════════════════════════════════

ALTER TABLE public.agendaya_profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'visitor',
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'starter';

ALTER TABLE public.agendaya_businesses
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'starter',
  ADD COLUMN IF NOT EXISTS plan_score INTEGER NOT NULL DEFAULT 0;

-- ════════════════════════════════════════════
-- 2. Sincronización role → user_apps
-- ════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.sync_agendaya_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.user_apps
  SET role = NEW.role
  WHERE user_id = NEW.id AND app_slug = 'agendaya';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_agendaya_profile_role ON public.agendaya_profiles;
CREATE TRIGGER trg_sync_agendaya_profile_role
  AFTER UPDATE OF role ON public.agendaya_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_agendaya_profile_role();

-- ════════════════════════════════════════════
-- 3. Proteger campos privilegiados
--    Evita que un usuario se asigne admin/moderator
-- ════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.protect_agendaya_profile_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.role IN ('admin', 'moderator') AND OLD.role NOT IN ('admin', 'moderator') THEN
    RAISE EXCEPTION 'No puedes asignarte el rol "%" tú mismo', NEW.role;
  END IF;
  IF OLD.role IN ('admin', 'moderator') AND NEW.role NOT IN ('admin', 'moderator') THEN
    RAISE EXCEPTION 'Un usuario con rol "%" no puede ser degradado', OLD.role;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_agendaya_profile ON public.agendaya_profiles;
CREATE TRIGGER trg_protect_agendaya_profile
  BEFORE UPDATE OF role ON public.agendaya_profiles
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role)
  EXECUTE FUNCTION public.protect_agendaya_profile_fields();

-- ════════════════════════════════════════════
-- 4. Cómputo automático de plan_score
--    Define la prioridad en listados públicos
-- ════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.compute_agendaya_business_plan_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  owner_plan TEXT;
BEGIN
  SELECT plan INTO owner_plan
  FROM public.agendaya_profiles
  WHERE id = NEW.owner_id;

  NEW.plan := owner_plan;
  NEW.plan_score := CASE owner_plan
    WHEN 'premium' THEN 3
    WHEN 'pro'     THEN 2
    ELSE 0
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_compute_agendaya_plan_score ON public.agendaya_businesses;
CREATE TRIGGER trg_compute_agendaya_plan_score
  BEFORE INSERT OR UPDATE OF owner_id ON public.agendaya_businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.compute_agendaya_business_plan_score();

-- Recomputar plan_score cuando el dueño cambia de plan
CREATE OR REPLACE FUNCTION public.recompute_agendaya_business_plan_score_on_profile_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.plan IS DISTINCT FROM OLD.plan THEN
    UPDATE public.agendaya_businesses
    SET plan = NEW.plan,
        plan_score = CASE NEW.plan
          WHEN 'premium' THEN 3
          WHEN 'pro'     THEN 2
          ELSE 0
        END
    WHERE owner_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_recompute_agendaya_business_plan_score ON public.agendaya_profiles;
CREATE TRIGGER trg_recompute_agendaya_business_plan_score
  AFTER UPDATE OF plan ON public.agendaya_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.recompute_agendaya_business_plan_score_on_profile_update();

-- ════════════════════════════════════════════
-- 5. RPC: update_agendaya_profile_role
--    Auto-asignación de roles permitidos
-- ════════════════════════════════════════════

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
  IF p_new_role NOT IN ('visitor', 'client', 'business_owner') THEN
    RAISE EXCEPTION 'Rol "%" no permitido para auto-asignación', p_new_role;
  END IF;

  UPDATE public.agendaya_profiles
  SET role = p_new_role, updated_at = NOW()
  WHERE id = p_user_id;
END;
$$;

-- ════════════════════════════════════════════
-- 6. RPC: update_agendaya_business_plan
--    Upgrade/downgrade de plan
-- ════════════════════════════════════════════

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

-- ════════════════════════════════════════════
-- 7. Por defecto, asignar role='visitor' a perfiles existentes
-- ════════════════════════════════════════════

UPDATE public.agendaya_profiles
SET role = CASE WHEN is_business THEN 'business_owner' ELSE 'visitor' END
WHERE role = 'visitor';

