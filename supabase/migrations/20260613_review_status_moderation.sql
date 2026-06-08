-- ============================================================
-- 20260613_review_status_moderation.sql
-- Agrega flujo de validación de reseñas (pending → approved/rejected)
-- y actualiza RLS para que moderadores/admins puedan gestionarlas.
-- ============================================================

-- ════════════════════════════════════════════
-- 1. Columna status en agendaya_reviews
-- ════════════════════════════════════════════

ALTER TABLE public.agendaya_reviews
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
  CHECK (status IN ('pending', 'approved', 'rejected'));

-- Migrar reseñas existentes a approved (retrocompatibilidad)
UPDATE public.agendaya_reviews
  SET status = 'approved'
  WHERE status = 'pending';

-- ════════════════════════════════════════════
-- 2. Nueva RLS para agendaya_reviews
-- ════════════════════════════════════════════

-- Limpiar policies anteriores
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE tablename = 'agendaya_reviews' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.agendaya_reviews', pol.policyname);
  END LOOP;
END $$;

-- SELECT: usuarios ven sus propias reseñas o las aprobadas; staff ve todo
CREATE POLICY "agendaya_reviews_select_own_or_approved"
  ON public.agendaya_reviews
  FOR SELECT
  USING (
    status = 'approved'
    OR auth.uid() = user_id
    OR auth.uid() IN (
      SELECT id FROM public.agendaya_profiles
      WHERE role IN ('admin', 'moderator')
    )
  );

-- INSERT: solo usuarios con cita completada (status = 'pending' por defecto)
CREATE POLICY "agendaya_reviews_insert_completed_appointment"
  ON public.agendaya_reviews
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND appointment_id IN (
      SELECT id FROM public.agendaya_appointments
      WHERE user_id = auth.uid() AND status = 'completed'
    )
  );

-- UPDATE: autor puede editar su reseña; staff puede actualizar cualquier
CREATE POLICY "agendaya_reviews_update_own_or_staff"
  ON public.agendaya_reviews
  FOR UPDATE
  USING (
    auth.uid() = user_id
    OR auth.uid() IN (
      SELECT id FROM public.agendaya_profiles
      WHERE role IN ('admin', 'moderator')
    )
  );

-- DELETE: autor puede borrar su reseña; staff puede borrar cualquier
CREATE POLICY "agendaya_reviews_delete_own_or_staff"
  ON public.agendaya_reviews
  FOR DELETE
  USING (
    auth.uid() = user_id
    OR auth.uid() IN (
      SELECT id FROM public.agendaya_profiles
      WHERE role IN ('admin', 'moderator')
    )
  );
