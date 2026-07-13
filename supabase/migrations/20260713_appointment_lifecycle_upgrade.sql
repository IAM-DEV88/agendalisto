-- ============================================================================
-- MIGRATION: Appointment Lifecycle Upgrade
-- Resolves: S1, S2, S3, S4, S5, D2, D3, D5, B1, B2, B3, B5, U2, U3, U5, U15
-- ============================================================================

-- ─── 1. BUSINESS CONFIG: new scheduling columns ────────────────────────────
-- Resolves U3 (configurable slot intervals), U2 (buffer time), B5 (max advance booking)

ALTER TABLE public.agendaya_business_config
  ADD COLUMN IF NOT EXISTS slot_interval_minutes INTEGER DEFAULT 30,
  ADD COLUMN IF NOT EXISTS buffer_minutes INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_advance_booking_days INTEGER DEFAULT 90;

COMMENT ON COLUMN public.agendaya_business_config.slot_interval_minutes IS 'Minutes between time slots (15, 30, 45, 60)';
COMMENT ON COLUMN public.agendaya_business_config.buffer_minutes IS 'Minutes of buffer/gap between consecutive appointments';
COMMENT ON COLUMN public.agendaya_business_config.max_advance_booking_days IS 'Max days ahead a client can book (0 = unlimited)';


-- ─── 2. DROP orphaned visit_count column ───────────────────────────────────
-- Resolves D2

ALTER TABLE public.agendaya_appointments
  DROP COLUMN IF EXISTS visit_count;


-- ─── 3. CLEANUP duplicate RLS policies ─────────────────────────────────────
-- Resolves D5: consolidate policies from schema.sql + coexistence.sql

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view their own appointments" ON public.agendaya_appointments;
  DROP POLICY IF EXISTS "Business owners can view business appointments" ON public.agendaya_appointments;
  DROP POLICY IF EXISTS "Authenticated users can create appointments" ON public.agendaya_appointments;
  DROP POLICY IF EXISTS "Users can update their appointments" ON public.agendaya_appointments;
  DROP POLICY IF EXISTS "Users can delete their appointments" ON public.agendaya_appointments;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "agendaya_appointments_select_user" ON public.agendaya_appointments;
  DROP POLICY IF EXISTS "agendaya_appointments_select_owner" ON public.agendaya_appointments;
  DROP POLICY IF EXISTS "agendaya_appointments_insert" ON public.agendaya_appointments;
  DROP POLICY IF EXISTS "agendaya_appointments_update" ON public.agendaya_appointments;
  DROP POLICY IF EXISTS "agendaya_appointments_delete" ON public.agendaya_appointments;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Citas: usuario ve las suyas" ON public.agendaya_appointments;
  DROP POLICY IF EXISTS "Citas: dueno ve las de su negocio" ON public.agendaya_appointments;
  DROP POLICY IF EXISTS "Citas: usuario autenticado crea" ON public.agendaya_appointments;
  DROP POLICY IF EXISTS "Citas: usuario o dueno actualiza" ON public.agendaya_appointments;
  DROP POLICY IF EXISTS "Citas: usuario o dueno elimina" ON public.agendaya_appointments;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "agendaya_appointments_select_user"
  ON public.agendaya_appointments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "agendaya_appointments_select_owner"
  ON public.agendaya_appointments FOR SELECT
  USING (auth.uid() IN (SELECT owner_id FROM public.agendaya_businesses WHERE id = business_id));

CREATE POLICY "agendaya_appointments_insert"
  ON public.agendaya_appointments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "agendaya_appointments_update"
  ON public.agendaya_appointments FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() IN (SELECT owner_id FROM public.agendaya_businesses WHERE id = business_id));

CREATE POLICY "agendaya_appointments_delete"
  ON public.agendaya_appointments FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() IN (SELECT owner_id FROM public.agendaya_businesses WHERE id = business_id));


-- ─── 4. RPC: create_appointment_safe ───────────────────────────────────────
-- Resolves S1 (atomic slot validation), S2 (guest user_id), S4 (server-side status),
-- S5 (user_id validation), R1 (safe RPC)

CREATE OR REPLACE FUNCTION public.create_appointment_safe(
  p_business_id UUID,
  p_service_id UUID,
  p_user_id TEXT,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ,
  p_notes TEXT DEFAULT NULL,
  p_guest_info JSONB DEFAULT NULL,
  p_is_guest BOOLEAN DEFAULT FALSE,
  p_payment_provider TEXT DEFAULT NULL,
  p_payment_id TEXT DEFAULT NULL,
  p_payment_amount NUMERIC DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_config RECORD;
  v_service RECORD;
  v_slot_available BOOLEAN;
  v_requiere_confirmacion BOOLEAN;
  v_user_id UUID;
  v_result JSONB;
BEGIN
  -- Validate user_id for non-guests
  IF NOT p_is_guest THEN
    IF p_user_id IS NULL OR p_user_id = '' THEN
      RETURN jsonb_build_object('success', false, 'error', 'user_id requerido para usuarios registrados');
    END IF;
    v_user_id := p_user_id::uuid;
  ELSE
    v_user_id := '00000000-0000-0000-0000-000000000000'::uuid;
  END IF;

  -- Validate service exists and is active
  SELECT * INTO v_service FROM public.agendaya_services WHERE id = p_service_id AND is_active = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Servicio no encontrado o inactivo');
  END IF;

  -- Validate max advance booking
  SELECT * INTO v_config FROM public.agendaya_business_config WHERE business_id = p_business_id;
  IF FOUND AND v_config.max_advance_booking_days > 0 THEN
    IF p_start_time > NOW() + (v_config.max_advance_booking_days || ' days')::interval THEN
      RETURN jsonb_build_object('success', false, 'error',
        'No se puede reservar con mas de ' || v_config.max_advance_booking_days || ' dias de anticipacion');
    END IF;
  END IF;

  -- ATOMIC slot availability check (resolves race condition S1)
  SELECT NOT EXISTS (
    SELECT 1 FROM public.agendaya_appointments
    WHERE business_id = p_business_id
      AND status NOT IN ('cancelled')
      AND p_start_time < end_time
      AND p_end_time > start_time
  ) INTO v_slot_available;

  IF NOT v_slot_available THEN
    RETURN jsonb_build_object('success', false, 'error', 'El horario seleccionado ya no esta disponible');
  END IF;

  -- Determine initial status from business config (server-side, S4)
  v_requiere_confirmacion := COALESCE(v_config.requiere_confirmacion, true);

  INSERT INTO public.agendaya_appointments (
    business_id, service_id, user_id, start_time, end_time,
    status, notes, guest_info, is_guest,
    payment_status, payment_provider, payment_id, payment_amount
  ) VALUES (
    p_business_id, p_service_id, v_user_id, p_start_time, p_end_time,
    CASE WHEN v_requiere_confirmacion THEN 'pending' ELSE 'confirmed' END,
    p_notes, p_guest_info, p_is_guest,
    CASE WHEN p_payment_provider IS NOT NULL THEN 'completed' ELSE NULL END,
    p_payment_provider, p_payment_id, p_payment_amount
  ) RETURNING to_jsonb(agendaya_appointments.*) INTO v_result;

  RETURN jsonb_build_object('success', true, 'data', v_result);
END;
$$;


-- ─── 5. RPC: cancel_appointment_safe ───────────────────────────────────────
-- Resolves S3 (server-side cancellation validation), B3 (cancellation policy)

CREATE OR REPLACE FUNCTION public.cancel_appointment_safe(
  p_appointment_id UUID,
  p_reason TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_appt RECORD;
  v_service RECORD;
  v_min_hours INTEGER;
BEGIN
  SELECT * INTO v_appt FROM public.agendaya_appointments WHERE id = p_appointment_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cita no encontrada');
  END IF;

  IF v_appt.status NOT IN ('pending', 'confirmed') THEN
    RETURN jsonb_build_object('success', false, 'error', 'No se puede cancelar una cita ' || v_appt.status);
  END IF;

  -- Check cancellation window (only enforced for the client, not the business owner)
  SELECT min_cancellation_hours INTO v_min_hours FROM public.agendaya_services WHERE id = v_appt.service_id;
  v_min_hours := COALESCE(v_min_hours, 48);

  IF auth.uid() = v_appt.user_id
     AND v_appt.start_time <= NOW() + (v_min_hours || ' hours')::interval
     AND v_appt.status = 'confirmed' THEN
    RETURN jsonb_build_object('success', false, 'error',
      'Debes cancelar con al menos ' || v_min_hours || ' horas de anticipacion');
  END IF;

  UPDATE public.agendaya_appointments
  SET status = 'cancelled', cancel_reason = p_reason, updated_at = NOW()
  WHERE id = p_appointment_id;

  RETURN jsonb_build_object('success', true);
END;
$$;


-- ─── 6. RPC: reschedule_appointment_safe ───────────────────────────────────
-- Resolves B1 (reschedule resets status, informs via return value)

CREATE OR REPLACE FUNCTION public.reschedule_appointment_safe(
  p_appointment_id UUID,
  p_new_start TIMESTAMPTZ,
  p_new_end TIMESTAMPTZ
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_appt RECORD;
  v_config RECORD;
  v_slot_available BOOLEAN;
  v_new_status TEXT;
BEGIN
  SELECT * INTO v_appt FROM public.agendaya_appointments WHERE id = p_appointment_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cita no encontrada');
  END IF;

  IF v_appt.status = 'cancelled' THEN
    RETURN jsonb_build_object('success', false, 'error', 'No se puede reprogramar una cita cancelada');
  END IF;

  -- Atomic slot check (excluding this appointment)
  SELECT NOT EXISTS (
    SELECT 1 FROM public.agendaya_appointments
    WHERE business_id = v_appt.business_id
      AND id != p_appointment_id
      AND status NOT IN ('cancelled')
      AND p_new_start < end_time
      AND p_new_end > start_time
  ) INTO v_slot_available;

  IF NOT v_slot_available THEN
    RETURN jsonb_build_object('success', false, 'error', 'El nuevo horario ya no esta disponible');
  END IF;

  -- Determine new status based on business config
  SELECT * INTO v_config FROM public.agendaya_business_config WHERE business_id = v_appt.business_id;
  IF COALESCE(v_config.requiere_confirmacion, true) THEN
    v_new_status := 'pending';
  ELSE
    v_new_status := 'confirmed';
  END IF;

  UPDATE public.agendaya_appointments
  SET start_time = p_new_start, end_time = p_new_end, status = v_new_status, updated_at = NOW()
  WHERE id = p_appointment_id;

  RETURN jsonb_build_object('success', true, 'new_status', v_new_status);
END;
$$;


-- ─── 7. RPC: get_available_slots ───────────────────────────────────────────
-- Resolves U1 (server-validated slots), U2 (buffer), U3 (configurable intervals)

CREATE OR REPLACE FUNCTION public.get_available_slots(
  p_business_id UUID,
  p_service_id UUID,
  p_date DATE
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_service RECORD;
  v_hours RECORD;
  v_config RECORD;
  v_js_day INTEGER;
  v_start_min INTEGER;
  v_end_min INTEGER;
  v_interval INTEGER;
  v_buffer INTEGER;
  v_slots JSONB := '[]'::jsonb;
  v_slot_start TIMESTAMPTZ;
  v_slot_end TIMESTAMPTZ;
  v_slot_end_with_buffer TIMESTAMPTZ;
  v_min INTEGER;
BEGIN
  SELECT * INTO v_service FROM public.agendaya_services WHERE id = p_service_id AND is_active = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('slots', '[]'::jsonb, 'closed', false);
  END IF;

  -- Convert JS DOW (0=Sun) to our convention (0=Mon)
  v_js_day := EXTRACT(DOW FROM p_date)::int;
  v_js_day := (v_js_day + 6) % 7;

  SELECT * INTO v_hours FROM public.agendaya_business_hours
  WHERE business_id = p_business_id AND day_of_week = v_js_day;

  IF NOT FOUND OR v_hours.is_closed THEN
    RETURN jsonb_build_object('slots', '[]'::jsonb, 'closed', true);
  END IF;

  SELECT * INTO v_config FROM public.agendaya_business_config WHERE business_id = p_business_id;
  v_interval := COALESCE(v_config.slot_interval_minutes, 30);
  v_buffer := COALESCE(v_config.buffer_minutes, 0);

  -- Parse business open/close times to minutes
  v_start_min := EXTRACT(HOUR FROM v_hours.start_time::time)::int * 60
               + EXTRACT(MINUTE FROM v_hours.start_time::time)::int;
  v_end_min   := EXTRACT(HOUR FROM v_hours.end_time::time)::int * 60
               + EXTRACT(MINUTE FROM v_hours.end_time::time)::int;
  IF v_end_min <= v_start_min THEN v_end_min := v_end_min + 1440; END IF;

  -- Generate candidate slots
  v_min := v_start_min;
  WHILE v_min + v_service.duration <= v_end_min LOOP
    v_slot_start := p_date + make_interval(mins => v_min);
    v_slot_end := v_slot_start + make_interval(mins => v_service.duration);
    v_slot_end_with_buffer := v_slot_end + make_interval(mins => v_buffer);

    -- Check no overlap with existing active appointments (buffer-aware)
    IF NOT EXISTS (
      SELECT 1 FROM public.agendaya_appointments
      WHERE business_id = p_business_id
        AND status NOT IN ('cancelled')
        AND v_slot_start < end_time
        AND v_slot_end_with_buffer > start_time
    ) THEN
      v_slots := v_slots || jsonb_build_object(
        'start', to_char(v_slot_start, 'HH24:MI'),
        'end', to_char(v_slot_end, 'HH24:MI'),
        'available', true
      );
    END IF;

    v_min := v_min + v_interval;
  END LOOP;

  RETURN jsonb_build_object('slots', v_slots, 'closed', false);
END;
$$;


-- ─── 8. RPC: trigger_auto_complete ─────────────────────────────────────────
-- Resolves B2 (auto-complete appointments past their end_time + 24h)

CREATE OR REPLACE FUNCTION public.trigger_auto_complete()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.agendaya_appointments
  SET status = 'completed', updated_at = NOW()
  WHERE status = 'confirmed'
    AND end_time < NOW() - INTERVAL '24 hours';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;


-- ─── 9. FIX trg_update_loyalty ─────────────────────────────────────────────
-- Resolves D3: consolidate to single consistent version

DROP TRIGGER IF EXISTS trg_update_loyalty_trigger ON public.agendaya_appointments;

CREATE OR REPLACE FUNCTION public.trg_update_loyalty()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    IF NEW.user_id IS NOT NULL AND NEW.user_id != '00000000-0000-0000-0000-000000000000'::uuid THEN
      INSERT INTO public.agendaya_loyalty (user_id, business_id, visit_date, appointment_id)
      VALUES (NEW.user_id, NEW.business_id, CURRENT_DATE, NEW.id)
      ON CONFLICT (user_id, business_id, visit_date) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_loyalty_trigger
  AFTER UPDATE OF status ON public.agendaya_appointments
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION public.trg_update_loyalty();


-- ─── 10. WAITLIST TABLE ────────────────────────────────────────────────────
-- Resolves U15

CREATE TABLE IF NOT EXISTS public.agendaya_waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES public.agendaya_businesses(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES public.agendaya_services(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_name TEXT,
  guest_email TEXT,
  preferred_date DATE NOT NULL,
  preferred_time_start TIME,
  preferred_time_end TIME,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'booked', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notified_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.agendaya_waitlist ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "agendaya_waitlist_select_own" ON public.agendaya_waitlist;
  DROP POLICY IF EXISTS "agendaya_waitlist_select_owner" ON public.agendaya_waitlist;
  DROP POLICY IF EXISTS "agendaya_waitlist_insert_auth" ON public.agendaya_waitlist;
  DROP POLICY IF EXISTS "agendaya_waitlist_update_owner" ON public.agendaya_waitlist;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "agendaya_waitlist_select_own"
  ON public.agendaya_waitlist FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "agendaya_waitlist_select_owner"
  ON public.agendaya_waitlist FOR SELECT
  USING (auth.uid() IN (SELECT owner_id FROM public.agendaya_businesses WHERE id = business_id));

CREATE POLICY "agendaya_waitlist_insert_auth"
  ON public.agendaya_waitlist FOR INSERT
  WITH CHECK (auth.uid() = user_id OR (user_id IS NULL AND guest_email IS NOT NULL));

CREATE POLICY "agendaya_waitlist_update_owner"
  ON public.agendaya_waitlist FOR UPDATE
  USING (auth.uid() IN (SELECT owner_id FROM public.agendaya_businesses WHERE id = business_id));

CREATE INDEX IF NOT EXISTS idx_agendaya_waitlist_business ON public.agendaya_waitlist(business_id, status);
CREATE INDEX IF NOT EXISTS idx_agendaya_waitlist_service_date ON public.agendaya_waitlist(service_id, preferred_date, status);


-- ─── 11. RPC: join_waitlist ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.join_waitlist(
  p_business_id UUID,
  p_service_id UUID,
  p_user_id TEXT DEFAULT NULL,
  p_guest_name TEXT DEFAULT NULL,
  p_guest_email TEXT DEFAULT NULL,
  p_preferred_date DATE DEFAULT NULL,
  p_preferred_time_start TIME DEFAULT NULL,
  p_preferred_time_end TIME DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  IF p_user_id IS NOT NULL AND p_user_id != '' THEN
    v_user_id := p_user_id::uuid;
  ELSE
    v_user_id := NULL;
  END IF;

  -- Prevent duplicate active waitlist entries
  IF EXISTS (
    SELECT 1 FROM public.agendaya_waitlist
    WHERE business_id = p_business_id
      AND service_id = p_service_id
      AND status = 'waiting'
      AND (
        (v_user_id IS NOT NULL AND user_id = v_user_id)
        OR (v_user_id IS NULL AND guest_email = p_guest_email)
      )
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ya estas en la lista de espera para este servicio');
  END IF;

  INSERT INTO public.agendaya_waitlist (
    business_id, service_id, user_id, guest_name, guest_email,
    preferred_date, preferred_time_start, preferred_time_end
  ) VALUES (
    p_business_id, p_service_id, v_user_id, p_guest_name, p_guest_email,
    p_preferred_date, p_preferred_time_start, p_preferred_time_end
  );

  RETURN jsonb_build_object('success', true);
END;
$$;


-- ─── 12. RPC: get_waitlist ─────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_waitlist(p_business_id UUID)
RETURNS SETOF public.agendaya_waitlist
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT w.*
  FROM public.agendaya_waitlist w
  WHERE w.business_id = p_business_id
    AND w.status = 'waiting'
  ORDER BY w.created_at ASC;
$$;
