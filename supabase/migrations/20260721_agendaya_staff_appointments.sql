-- ============================================================================
-- Migration: Staff assignment for appointments
-- ============================================================================

-- ─── Add staff_id to appointments ───
ALTER TABLE public.agendaya_appointments
  ADD COLUMN IF NOT EXISTS staff_id UUID REFERENCES public.agendaya_staff(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_agendaya_appointments_staff_id ON public.agendaya_appointments(staff_id);

-- ─── Update get_available_slots to accept p_staff_id ───
CREATE OR REPLACE FUNCTION public.get_available_slots(
  p_business_id UUID,
  p_service_id UUID,
  p_date DATE,
  p_staff_id UUID DEFAULT NULL
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
    RETURN jsonb_build_object('slots', '[]'::jsonb, 'closed', true, 'error', 'Servicio no encontrado');
  END IF;

  v_js_day := EXTRACT(DOW FROM p_date);
  SELECT * INTO v_hours FROM public.agendaya_business_hours
    WHERE business_id = p_business_id AND day_of_week = v_js_day;
  IF NOT FOUND OR v_hours.is_closed THEN
    RETURN jsonb_build_object('slots', '[]'::jsonb, 'closed', true);
  END IF;

  SELECT * INTO v_config FROM public.agendaya_business_config WHERE business_id = p_business_id;
  v_interval := COALESCE(v_config.slot_interval_minutes, 30);
  v_buffer := COALESCE(v_config.buffer_minutes, 0);

  v_start_min := EXTRACT(HOUR FROM v_hours.start_time)::int * 60 + EXTRACT(MINUTE FROM v_hours.start_time)::int;
  v_end_min := EXTRACT(HOUR FROM v_hours.end_time)::int * 60 + EXTRACT(MINUTE FROM v_hours.end_time)::int;

  v_min := v_start_min;
  WHILE v_min + v_service.duration <= v_end_min LOOP
    v_slot_start := p_date + (v_min || ' minutes')::interval;
    v_slot_end := v_slot_start + (v_service.duration || ' minutes')::interval;
    v_slot_end_with_buffer := v_slot_end + (v_buffer || ' minutes')::interval;

    IF v_slot_start > NOW() AND NOT EXISTS (
      SELECT 1 FROM public.agendaya_appointments
      WHERE business_id = p_business_id
        AND status NOT IN ('cancelled')
        AND (p_staff_id IS NULL OR staff_id IS NULL OR staff_id = p_staff_id)
        AND v_slot_start < end_time
        AND v_slot_end_with_buffer > start_time
    ) THEN
      v_slots := v_slots || jsonb_build_object(
        'start', to_char(v_slot_start, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'end', to_char(v_slot_end, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'available', true
      );
    END IF;
    v_min := v_min + v_interval;
  END LOOP;

  RETURN jsonb_build_object('slots', v_slots, 'closed', false);
END;
$$;

-- ─── Update create_appointment_safe to accept p_staff_id ───
CREATE OR REPLACE FUNCTION public.create_appointment_safe(
  p_business_id UUID,
  p_service_id UUID,
  p_user_id TEXT DEFAULT NULL,
  p_start_time TIMESTAMPTZ DEFAULT NULL,
  p_end_time TIMESTAMPTZ DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_guest_info JSONB DEFAULT NULL,
  p_is_guest BOOLEAN DEFAULT false,
  p_payment_provider TEXT DEFAULT NULL,
  p_payment_id TEXT DEFAULT NULL,
  p_payment_amount NUMERIC DEFAULT NULL,
  p_staff_id UUID DEFAULT NULL
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
  IF NOT p_is_guest THEN
    IF p_user_id IS NULL OR p_user_id = '' THEN
      RETURN jsonb_build_object('success', false, 'error', 'user_id requerido para usuarios registrados');
    END IF;
    v_user_id := p_user_id::uuid;
  ELSE
    v_user_id := '00000000-0000-0000-0000-000000000000'::uuid;
  END IF;

  SELECT * INTO v_service FROM public.agendaya_services WHERE id = p_service_id AND is_active = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Servicio no encontrado o inactivo');
  END IF;

  SELECT * INTO v_config FROM public.agendaya_business_config WHERE business_id = p_business_id;
  IF FOUND AND v_config.max_advance_booking_days > 0 THEN
    IF p_start_time > NOW() + (v_config.max_advance_booking_days || ' days')::interval THEN
      RETURN jsonb_build_object('success', false, 'error',
        'No se puede reservar con mas de ' || v_config.max_advance_booking_days || ' dias de anticipacion');
    END IF;
  END IF;

  SELECT NOT EXISTS (
    SELECT 1 FROM public.agendaya_appointments
    WHERE business_id = p_business_id
      AND status NOT IN ('cancelled')
      AND (p_staff_id IS NULL OR staff_id IS NULL OR staff_id = p_staff_id)
      AND p_start_time < end_time
      AND p_end_time > start_time
  ) INTO v_slot_available;

  IF NOT v_slot_available THEN
    RETURN jsonb_build_object('success', false, 'error', 'El horario seleccionado ya no esta disponible');
  END IF;

  v_requiere_confirmacion := COALESCE(v_service.requiere_confirmacion, true);

  INSERT INTO public.agendaya_appointments (
    business_id, service_id, user_id, start_time, end_time,
    status, notes, guest_info, is_guest,
    payment_status, payment_provider, payment_id, payment_amount,
    staff_id
  ) VALUES (
    p_business_id, p_service_id, v_user_id, p_start_time, p_end_time,
    CASE WHEN v_requiere_confirmacion THEN 'pending' ELSE 'confirmed' END,
    p_notes, p_guest_info, p_is_guest,
    CASE WHEN p_payment_provider IS NOT NULL THEN 'completed' ELSE NULL END,
    p_payment_provider, p_payment_id, p_payment_amount,
    p_staff_id
  ) RETURNING to_jsonb(agendaya_appointments.*) INTO v_result;

  RETURN jsonb_build_object('success', true, 'data', v_result);
END;
$$;

-- ─── Update reschedule_appointment_safe to accept p_staff_id ───
CREATE OR REPLACE FUNCTION public.reschedule_appointment_safe(
  p_appointment_id UUID,
  p_new_start TIMESTAMPTZ,
  p_new_end TIMESTAMPTZ,
  p_new_staff_id UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_appt RECORD;
  v_service RECORD;
  v_config RECORD;
  v_slot_available BOOLEAN;
  v_new_status TEXT;
  v_target_staff_id UUID;
BEGIN
  SELECT * INTO v_appt FROM public.agendaya_appointments WHERE id = p_appointment_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cita no encontrada');
  END IF;

  IF v_appt.status = 'cancelled' THEN
    RETURN jsonb_build_object('success', false, 'error', 'No se puede reprogramar una cita cancelada');
  END IF;

  v_target_staff_id := COALESCE(p_new_staff_id, v_appt.staff_id);

  SELECT NOT EXISTS (
    SELECT 1 FROM public.agendaya_appointments
    WHERE business_id = v_appt.business_id
      AND id != p_appointment_id
      AND status NOT IN ('cancelled')
      AND (v_target_staff_id IS NULL OR staff_id IS NULL OR staff_id = v_target_staff_id)
      AND p_new_start < end_time
      AND p_new_end > start_time
  ) INTO v_slot_available;

  IF NOT v_slot_available THEN
    RETURN jsonb_build_object('success', false, 'error', 'El nuevo horario ya no esta disponible');
  END IF;

  SELECT requiere_confirmacion INTO v_service FROM public.agendaya_services WHERE id = v_appt.service_id;
  IF COALESCE(v_service.requiere_confirmacion, true) THEN
    v_new_status := 'pending';
  ELSE
    v_new_status := 'confirmed';
  END IF;

  UPDATE public.agendaya_appointments
  SET start_time = p_new_start, end_time = p_new_end,
      status = v_new_status, staff_id = v_target_staff_id,
      updated_at = NOW()
  WHERE id = p_appointment_id;

  RETURN jsonb_build_object('success', true, 'message', 'Cita reprogramada correctamente');
END;
$$;
