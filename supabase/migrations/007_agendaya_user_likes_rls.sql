-- =====================================================
-- Fix RLS policies for agendaya_user_likes
--
-- Problema 1 (original): Solo existía policy SELECT,
--   faltaban INSERT y DELETE → error 42501 RLS.
-- Problema 2 (encadenado): Alguna policy/trigger/FK
--   existente aún referenciaba el viejo nombre
--   "businesses" (renombrado a agendaya_businesses)
--   → error 42P01 "relation "businesses" does not exist".
--
-- Solución: Limpiar TODAS las policies existentes
--   (patrón DO $$ ... DROP ALL) y recrear solo las
--   necesarias, todas con prefijo agendaya_ y sin
--   subconsultas a otras tablas.
-- =====================================================

DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'agendaya_user_likes' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.agendaya_user_likes', pol.policyname);
  END LOOP;
END $$;

-- Dropear TODAS las FK de agendaya_user_likes que apunten a
-- business_id (pueden tener el nombre viejo "businesses" en su
-- definición si el RENAME de coexistence.sql no se aplicó bien).
-- Luego recreamos la FK con el nombre correcto "agendaya_businesses".
DO $$
DECLARE
  fk RECORD;
BEGIN
  FOR fk IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
    WHERE con.conrelid = 'public.agendaya_user_likes'::regclass
      AND con.contype = 'f'
      AND att.attname = 'business_id'
  LOOP
    EXECUTE format('ALTER TABLE public.agendaya_user_likes DROP CONSTRAINT %I', fk.conname);
  END LOOP;
END $$;

-- Recrear FK apuntando al nombre correcto
ALTER TABLE public.agendaya_user_likes
  ADD CONSTRAINT agendaya_user_likes_business_id_fkey
  FOREIGN KEY (business_id) REFERENCES public.agendaya_businesses(id)
  ON DELETE CASCADE;

-- Arreglar trigger que actualiza likes_count
-- La función usaba los nombres viejos "businesses" y "services"
-- → error 42P01 "relation businesses does not exist"
DROP TRIGGER IF EXISTS on_like_change ON public.agendaya_user_likes;

CREATE OR REPLACE FUNCTION public.update_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    IF NEW.business_id IS NOT NULL THEN
      UPDATE public.agendaya_businesses SET likes_count = likes_count + 1 WHERE id = NEW.business_id;
    ELSIF NEW.service_id IS NOT NULL THEN
      UPDATE public.agendaya_services SET likes_count = likes_count + 1 WHERE id = NEW.service_id;
    END IF;
  ELSIF (TG_OP = 'DELETE') THEN
    IF OLD.business_id IS NOT NULL THEN
      UPDATE public.agendaya_businesses SET likes_count = likes_count - 1 WHERE id = OLD.business_id;
    ELSIF OLD.service_id IS NOT NULL THEN
      UPDATE public.agendaya_services SET likes_count = likes_count - 1 WHERE id = OLD.service_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_like_change
  AFTER INSERT OR DELETE ON public.agendaya_user_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_likes_count();

-- Forzar recarga del schema cache de PostgREST
NOTIFY pgrst, 'reload schema';

-- Recrear policies limpias
CREATE POLICY "agendaya_user_likes select público"
  ON public.agendaya_user_likes
  FOR SELECT
  USING (true);

CREATE POLICY "agendaya_user_likes insert propio"
  ON public.agendaya_user_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "agendaya_user_likes delete propio"
  ON public.agendaya_user_likes
  FOR DELETE
  USING (auth.uid() = user_id);
