-- Migration: Fix table name in migration 002 (appointments → agendaya_appointments)
-- Fecha: 2026-06-22

-- Asegurar que la FK existe sobre la tabla con prefijo correcto
ALTER TABLE public.agendaya_appointments
DROP CONSTRAINT IF EXISTS agendaya_appointments_user_id_fkey;

ALTER TABLE public.agendaya_appointments
ADD CONSTRAINT agendaya_appointments_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.agendaya_profiles(id)
ON DELETE CASCADE
ON UPDATE CASCADE;
