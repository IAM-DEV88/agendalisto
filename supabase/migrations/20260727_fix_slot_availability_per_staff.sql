-- ============================================================================
-- Migration: Fix slot availability to account for per-staff capacity
-- When no staff_id is specified, a slot is available if ANY staff is free
-- ============================================================================

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
  v_active_staff_count INTEGER;
  v_conflicting_staff INTEGER;
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

  SELECT COUNT(*) INTO v_active_staff_count FROM public.agendaya_staff
    WHERE business_id = p_business_id AND is_active = true;

  v_start_min := EXTRACT(HOUR FROM v_hours.start_time)::int * 60 + EXTRACT(MINUTE FROM v_hours.start_time)::int;
  v_end_min := EXTRACT(HOUR FROM v_hours.end_time)::int * 60 + EXTRACT(MINUTE FROM v_hours.end_time)::int;

  v_min := v_start_min;
  WHILE v_min + v_service.duration <= v_end_min LOOP
    v_slot_start := p_date + (v_min || ' minutes')::interval;
    v_slot_end := v_slot_start + (v_service.duration || ' minutes')::interval;
    v_slot_end_with_buffer := v_slot_end + (v_buffer || ' minutes')::interval;

    IF v_slot_start > NOW() THEN
      IF p_staff_id IS NOT NULL THEN
        -- Specific staff: check only that staff's appointments
        IF NOT EXISTS (
          SELECT 1 FROM public.agendaya_appointments
          WHERE business_id = p_business_id
            AND status NOT IN ('cancelled')
            AND staff_id = p_staff_id
            AND v_slot_start < end_time
            AND v_slot_end_with_buffer > start_time
        ) THEN
          v_slots := v_slots || jsonb_build_object('start', to_char(v_slot_start, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), 'end', to_char(v_slot_end, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), 'available', true);
        END IF;
      ELSIF v_active_staff_count > 0 THEN
        -- Any staff: count how many staff are busy at this slot
        SELECT COUNT(*) INTO v_conflicting_staff FROM (
          SELECT DISTINCT staff_id FROM public.agendaya_appointments
          WHERE business_id = p_business_id
            AND status NOT IN ('cancelled')
            AND staff_id IS NOT NULL
            AND v_slot_start < end_time
            AND v_slot_end_with_buffer > start_time
        ) busy;
        IF v_conflicting_staff < v_active_staff_count THEN
          v_slots := v_slots || jsonb_build_object('start', to_char(v_slot_start, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), 'end', to_char(v_slot_end, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), 'available', true);
        END IF;
      ELSE
        -- No staff configured: check any appointment overlap
        IF NOT EXISTS (
          SELECT 1 FROM public.agendaya_appointments
          WHERE business_id = p_business_id
            AND status NOT IN ('cancelled')
            AND v_slot_start < end_time
            AND v_slot_end_with_buffer > start_time
        ) THEN
          v_slots := v_slots || jsonb_build_object('start', to_char(v_slot_start, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), 'end', to_char(v_slot_end, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), 'available', true);
        END IF;
      END IF;
    END IF;

    v_min := v_min + v_interval;
  END LOOP;

  RETURN jsonb_build_object('slots', v_slots, 'closed', false);
END;
$$;
