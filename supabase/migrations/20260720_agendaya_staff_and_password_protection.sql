-- ============================================================================
-- Migration: Staff management & password protection for AgendaYa
-- ============================================================================

-- ─── agendaya_staff ───
CREATE TABLE IF NOT EXISTS public.agendaya_staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.agendaya_businesses(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups by business
CREATE INDEX IF NOT EXISTS idx_agendaya_staff_business_id ON public.agendaya_staff(business_id);

-- Enable RLS
ALTER TABLE public.agendaya_staff ENABLE ROW LEVEL SECURITY;

-- Business owner can manage their own staff
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agendaya_staff' AND policyname = 'agendaya_owner_manage_staff') THEN
    CREATE POLICY agendaya_owner_manage_staff ON public.agendaya_staff
      FOR ALL
      USING (business_id IN (SELECT id FROM public.agendaya_businesses WHERE owner_id = auth.uid()))
      WITH CHECK (business_id IN (SELECT id FROM public.agendaya_businesses WHERE owner_id = auth.uid()));
  END IF;
END $$;

-- ─── Add password_protection to business_config ───
ALTER TABLE public.agendaya_business_config
  ADD COLUMN IF NOT EXISTS password_protection_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS password_protect_staff BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS password_protect_hours BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS password_protect_services BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS password_protect_appointments BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS password_protect_profile BOOLEAN DEFAULT false;
