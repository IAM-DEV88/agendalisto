-- =====================================================
-- FIX: favorites_count no se actualiza
-- =====================================================
-- Causas:
--   1. update_favorites_count() sin SECURITY DEFINER
--      → subquery COUNT respeta RLS, ve 0 registros
--   2. protect_profile_privileged_fields revierte el count
-- =====================================================

-- 1. Recrear función count con SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.update_favorites_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.encuentrosvip_profiles
    SET favorites_count = (
      SELECT COUNT(*) FROM public.encuentrosvip_favorites
      WHERE profile_id = NEW.profile_id
    )
    WHERE id = NEW.profile_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.encuentrosvip_profiles
    SET favorites_count = (
      SELECT COUNT(*) FROM public.encuentrosvip_favorites
      WHERE profile_id = OLD.profile_id
    )
    WHERE id = OLD.profile_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- 2. Recrear triggers
DROP TRIGGER IF EXISTS on_favorite_insert ON public.encuentrosvip_favorites;
CREATE TRIGGER on_favorite_insert
  AFTER INSERT ON public.encuentrosvip_favorites
  FOR EACH ROW
  EXECUTE FUNCTION public.update_favorites_count();

DROP TRIGGER IF EXISTS on_favorite_delete ON public.encuentrosvip_favorites;
CREATE TRIGGER on_favorite_delete
  AFTER DELETE ON public.encuentrosvip_favorites
  FOR EACH ROW
  EXECUTE FUNCTION public.update_favorites_count();

-- 3. Quitar favorites_count de campos protegidos
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF public.is_admin_or_moderator() THEN
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT (OLD.role IN ('visitor', 'user') AND NEW.role = 'advertiser') THEN
      NEW.role := OLD.role;
    END IF;
  END IF;

  IF NEW.plan IS DISTINCT FROM OLD.plan THEN
    IF NOT (
      (OLD.plan = 'visitor' AND NEW.plan IN ('featured', 'premium'))
      OR (OLD.plan = 'featured' AND NEW.plan = 'premium')
    ) THEN
      NEW.plan := OLD.plan;
    END IF;
  END IF;

  NEW.verification_status := OLD.verification_status;
  NEW.rating_avg := OLD.rating_avg;
  NEW.reviews_count := OLD.reviews_count;
  -- favorites_count NO se protege: lo gestiona el trigger update_favorites_count()
  NEW.user_id := OLD.user_id;
  NEW.id := OLD.id;
  NEW.created_at := OLD.created_at;

  IF NEW.plan = 'premium' THEN
    NEW.is_premium := true;
  ELSIF NEW.plan IN ('visitor', 'featured') AND NEW.is_premium IS DISTINCT FROM OLD.is_premium THEN
    NEW.is_premium := OLD.is_premium;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_privileged_fields_trigger ON public.encuentrosvip_profiles;
CREATE TRIGGER protect_profile_privileged_fields_trigger
  BEFORE UPDATE ON public.encuentrosvip_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_privileged_fields();

-- 4. Backfill: recalcular todos los counts
UPDATE public.encuentrosvip_profiles p
SET favorites_count = (
  SELECT COUNT(*) FROM public.encuentrosvip_favorites
  WHERE profile_id = p.id
);
