-- ============================================================
-- 20260627_fix_review_rls_business_owner.sql
-- Agrega policy para que dueños de negocio puedan ver reseñas.
-- Sin esto, getBusinessAppointments falla porque el LEFT JOIN
-- a agendaya_reviews es bloqueado por RLS (business_owner no
-- está incluido en la policy SELECT actual).
-- ============================================================

-- Policy: business owners can see reviews for their businesses
CREATE POLICY "agendaya_reviews_select_business_owner"
  ON public.agendaya_reviews
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT owner_id FROM public.agendaya_businesses
      WHERE id = business_id
    )
  );

NOTIFY pgrst, 'reload schema';
