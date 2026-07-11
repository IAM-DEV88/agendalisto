-- Migration: Create agendaya_landing_leads table for city landing page lead capture
-- This stores leads from business owners and customer demand signals
-- from city-specific landing pages (e.g., /ciudades/pitalito)

-- Create table
CREATE TABLE IF NOT EXISTS public.agendaya_landing_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('business', 'customer')),
  city_slug TEXT NOT NULL,
  name TEXT NOT NULL,
  business_name TEXT,
  whatsapp TEXT,
  category TEXT,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for querying leads by city
CREATE INDEX IF NOT EXISTS idx_agendaya_landing_leads_city
  ON public.agendaya_landing_leads (city_slug);

-- Index for ordering by recency
CREATE INDEX IF NOT EXISTS idx_agendaya_landing_leads_created
  ON public.agendaya_landing_leads (created_at DESC);

-- Enable RLS
ALTER TABLE public.agendaya_landing_leads ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous) can insert leads
DROP POLICY IF EXISTS "agendaya_landing_leads_insert" ON public.agendaya_landing_leads;
CREATE POLICY "agendaya_landing_leads_insert" ON public.agendaya_landing_leads
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Only admins and moderators can view leads
DROP POLICY IF EXISTS "agendaya_landing_leads_select" ON public.agendaya_landing_leads;
CREATE POLICY "agendaya_landing_leads_select" ON public.agendaya_landing_leads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.agendaya_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- No UPDATE or DELETE policies needed — leads are immutable once inserted.
-- Cleanup can be done via Supabase dashboard or SQL console with service_role.
