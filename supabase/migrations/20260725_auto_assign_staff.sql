-- ============================================================================
-- Migration: Auto-assign staff when no staff_id provided
-- ============================================================================

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
  v_resolved_staff_id UUID;
  v_staff RECORD;
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

  -- Auto-assign staff if not specified
  v_resolved_staff_id := p_staff_id;
  IF v_resolved_staff_id IS NULL THEN
    FOR v_staff IN
      SELECT id FROM public.agendaya_staff
      WHERE business_id = p_business_id AND is_active = true
      ORDER BY created_at ASC
    LOOP
      IF NOT EXISTS (
        SELECT 1 FROM public.agendaya_appointments
        WHERE business_id = p_business_id
          AND status NOT IN ('cancelled')
          AND staff_id = v_staff.id
          AND p_start_time < end_time
          AND p_end_time > start_time
      ) THEN
        v_resolved_staff_id := v_staff.id;
        EXIT;
      END IF;
    END LOOP;
  END IF;

  -- Slot availability check
  SELECT NOT EXISTS (
    SELECT 1 FROM public.agendaya_appointments
    WHERE business_id = p_business_id
      AND status NOT IN ('cancelled')
      AND (v_resolved_staff_id IS NULL OR staff_id IS NULL OR staff_id = v_resolved_staff_id)
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
    v_resolved_staff_id
  ) RETURNING to_jsonb(agendaya_appointments.*) INTO v_result;

  RETURN jsonb_build_object('success', true, 'data', v_result);
END;
$$;
