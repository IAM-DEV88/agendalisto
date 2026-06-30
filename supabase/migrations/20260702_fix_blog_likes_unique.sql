-- ============================================================
-- 20260702_fix_blog_likes_unique.sql
-- Corrige error 404 + "relation blog_posts does not exist"
-- al intentar dar like a un blog post.
--
-- Causa raíz 1: La tabla agendaya_blog_likes no existía
--   (CREATE TABLE IF NOT EXISTS por si acaso)
-- Causa raíz 2: El trigger update_blog_post_likes_count()
--   referenciaba "blog_posts" (nombre viejo pre-rename de
--   coexistence.sql). PostgreSQL NO actualiza el cuerpo de
--   funciones al renombrar tablas.
-- Causa raíz 3: UNIQUE(user_id,post_id,comment_id) no
--   prevenía duplicados cuando comment_id IS NULL
--   (PostgreSQL trata NULLs como distintos en UNIQUE).
-- Causa raíz 4: Schema cache de PostgREST desactualizado
--   (falta NOTIFY pgrst).
-- ============================================================

BEGIN;

-- ════════════════════════════════════════════════════════════
-- 1. Crear tabla si no existe
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.agendaya_blog_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    post_id UUID REFERENCES public.agendaya_blog_posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES public.agendaya_blog_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT one_target_check CHECK (
        (post_id IS NOT NULL AND comment_id IS NULL) OR
        (post_id IS NULL AND comment_id IS NOT NULL)
    )
);

-- ════════════════════════════════════════════════════════════
-- 2. Eliminar UNIQUE constraint vieja (no funciona con NULLs)
-- ════════════════════════════════════════════════════════════
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT con.conname INTO constraint_name
  FROM pg_constraint con
  WHERE con.conrelid = 'public.agendaya_blog_likes'::regclass
    AND con.contype = 'u';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.agendaya_blog_likes DROP CONSTRAINT %I', constraint_name);
  END IF;
END;
$$;

-- ════════════════════════════════════════════════════════════
-- 3. Eliminar duplicados existentes (por si el UNIQUE viejo
--    permitió inserts repetidos).
--    Usamos ctid en vez de MIN(uuid) porque PostgreSQL no
--    tiene MIN() para tipo uuid.
-- ════════════════════════════════════════════════════════════
DELETE FROM public.agendaya_blog_likes
WHERE ctid NOT IN (
  SELECT MIN(ctid)
  FROM public.agendaya_blog_likes
  WHERE post_id IS NOT NULL
  GROUP BY user_id, post_id
);

DELETE FROM public.agendaya_blog_likes
WHERE ctid NOT IN (
  SELECT MIN(ctid)
  FROM public.agendaya_blog_likes
  WHERE comment_id IS NOT NULL
  GROUP BY user_id, comment_id
);

-- ════════════════════════════════════════════════════════════
-- 4. Índices únicos parciales (SÍ funcionan con NULLs)
-- ════════════════════════════════════════════════════════════
DROP INDEX IF EXISTS idx_blog_likes_post_unique;
CREATE UNIQUE INDEX idx_blog_likes_post_unique
  ON public.agendaya_blog_likes(user_id, post_id)
  WHERE post_id IS NOT NULL;

DROP INDEX IF EXISTS idx_blog_likes_comment_unique;
CREATE UNIQUE INDEX idx_blog_likes_comment_unique
  ON public.agendaya_blog_likes(user_id, comment_id)
  WHERE comment_id IS NOT NULL;

-- ════════════════════════════════════════════════════════════
-- 5. RLS policies
-- ════════════════════════════════════════════════════════════
ALTER TABLE public.agendaya_blog_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agendaya_blog_likes select" ON public.agendaya_blog_likes;
CREATE POLICY "agendaya_blog_likes select"
  ON public.agendaya_blog_likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "agendaya_blog_likes insert" ON public.agendaya_blog_likes;
CREATE POLICY "agendaya_blog_likes insert"
  ON public.agendaya_blog_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "agendaya_blog_likes delete" ON public.agendaya_blog_likes;
CREATE POLICY "agendaya_blog_likes delete"
  ON public.agendaya_blog_likes FOR DELETE USING (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════════
-- 6. Eliminar trigger fantasma de migración anterior
--    (on_blog_like_change ejecuta update_blog_likes_count
--    que referencia "blog_posts" sin prefijo agendaya_)
-- ════════════════════════════════════════════════════════════
DROP TRIGGER IF EXISTS on_blog_like_change ON public.agendaya_blog_likes;

-- ════════════════════════════════════════════════════════════
-- 7. Recrear función + trigger para likes en posts
--    (con nombre de tabla correcto y SET search_path)
-- ════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.update_blog_post_likes_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    IF NEW.post_id IS NOT NULL THEN
      UPDATE public.agendaya_blog_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    END IF;
  ELSIF (TG_OP = 'DELETE') THEN
    IF OLD.post_id IS NOT NULL THEN
      UPDATE public.agendaya_blog_posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_blog_post_like_change ON public.agendaya_blog_likes;
CREATE TRIGGER on_blog_post_like_change
  AFTER INSERT OR DELETE ON public.agendaya_blog_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_blog_post_likes_count();

-- ════════════════════════════════════════════════════════════
-- 8. Recrear función + trigger para likes en comentarios
-- ════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.update_blog_comment_likes_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    IF NEW.comment_id IS NOT NULL THEN
      UPDATE public.agendaya_blog_comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
    END IF;
  ELSIF (TG_OP = 'DELETE') THEN
    IF OLD.comment_id IS NOT NULL THEN
      UPDATE public.agendaya_blog_comments SET likes_count = likes_count - 1 WHERE id = OLD.comment_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_blog_comment_like_change ON public.agendaya_blog_likes;
CREATE TRIGGER on_blog_comment_like_change
  AFTER INSERT OR DELETE ON public.agendaya_blog_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_blog_comment_likes_count();

COMMIT;

-- ════════════════════════════════════════════════════════════
-- 9. Recargar schema cache de PostgREST (fuera de transacción)
-- ════════════════════════════════════════════════════════════
NOTIFY pgrst, 'reload schema';
