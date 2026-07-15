-- Allow anonymous users to view non-cancelled appointments
-- so the booking page can show correct slot availability for guests.

DO $$ BEGIN
  DROP POLICY IF EXISTS "agendaya_appointments_select_anon" ON public.agendaya_appointments;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "agendaya_appointments_select_anon"
  ON public.agendaya_appointments FOR SELECT
  TO anon
  USING (status NOT IN ('cancelled'));
