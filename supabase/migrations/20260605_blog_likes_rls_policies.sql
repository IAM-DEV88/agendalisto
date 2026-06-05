-- =====================================================
-- Fix missing INSERT/DELETE RLS policies for
-- agendaya_blog_likes.
--
-- La migración original (20260324_blog_chat_schema.sql)
-- creó estas policies, pero coexistence.sql solo creó
-- la policy SELECT, dejando INSERT y DELETE huérfanas.
-- Esto causaba error 403 al intentar dar like a un post.
-- =====================================================

-- Asegurar RLS habilitado
ALTER TABLE public.agendaya_blog_likes ENABLE ROW LEVEL SECURITY;

-- Limpiar policies existentes para evitar duplicados
DROP POLICY IF EXISTS "Authenticated users can like" ON public.agendaya_blog_likes;
DROP POLICY IF EXISTS "Users can remove their own likes" ON public.agendaya_blog_likes;

-- Policy INSERT: usuarios autenticados pueden like (su propio user_id)
CREATE POLICY "Authenticated users can like"
  ON public.agendaya_blog_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy DELETE: usuarios pueden eliminar sus propios likes
CREATE POLICY "Users can remove their own likes"
  ON public.agendaya_blog_likes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Forzar recarga del schema cache de PostgREST
NOTIFY pgrst, 'reload schema';
