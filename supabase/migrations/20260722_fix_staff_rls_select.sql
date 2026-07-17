-- Allow public read access to staff for booking pages
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agendaya_staff' AND policyname = 'agendaya_staff_select_public') THEN
    CREATE POLICY agendaya_staff_select_public ON public.agendaya_staff
      FOR SELECT
      USING (true);
  END IF;
END $$;
