-- 002_add_fk_appointments_userid_profiles.sql
-- Migration: Ensure foreign key relationship between appointments.user_id and profiles.id

-- Drop constraint if it already exists to avoid errors
ALTER TABLE public.appointments
DROP CONSTRAINT IF EXISTS appointments_user_id_fkey;

-- Add the foreign key constraint
ALTER TABLE public.appointments
ADD CONSTRAINT appointments_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id)
ON DELETE CASCADE
ON UPDATE CASCADE; 