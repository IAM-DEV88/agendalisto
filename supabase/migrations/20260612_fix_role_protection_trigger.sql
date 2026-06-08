-- ============================================================
-- 20260612_fix_role_protection_trigger.sql
-- Permite que admins/moderadores asignen roles desde Supabase
-- sin bloquear al usuario que se auto-asigna.
--
-- El trigger ahora solo bloquea SELF-assignment, pero permite
-- que otro usuario (admin) o el service_role asignen
-- admin/moderator directamente en la BD.
-- ============================================================

CREATE OR REPLACE FUNCTION public.protect_agendaya_profile_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Solo bloquear si el usuario se está asignando a sí mismo
  IF NEW.role IN ('admin', 'moderator') AND OLD.role NOT IN ('admin', 'moderator') THEN
    IF auth.uid() = NEW.id THEN
      RAISE EXCEPTION 'No puedes asignarte el rol "%" tú mismo', NEW.role;
    END IF;
  END IF;
  IF OLD.role IN ('admin', 'moderator') AND NEW.role NOT IN ('admin', 'moderator') THEN
    IF auth.uid() = OLD.id THEN
      RAISE EXCEPTION 'Un usuario con rol "%" no puede ser degradado', OLD.role;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
