-- Migration: Move business config to service level
-- Los campos mostrar_precios, permitir_reservas_online y requiere_confirmacion
-- pasan de agendaya_business_config a agendaya_services para control por servicio.

ALTER TABLE public.agendaya_services
  ADD COLUMN IF NOT EXISTS mostrar_precios BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS permitir_reservas_online BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS requiere_confirmacion BOOLEAN NOT NULL DEFAULT true;

-- ─── Update RPCs to read requiere_confirmacion from service ───

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
  v_service RECORD;
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

  SELECT requiere_confirmacion INTO v_service FROM public.agendaya_services WHERE id = v_appt.service_id;
  IF COALESCE(v_service.requiere_confirmacion, true) THEN
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

-- ─── Update trg_update_loyalty to include new fields for sync trigger ───
-- End of migration
