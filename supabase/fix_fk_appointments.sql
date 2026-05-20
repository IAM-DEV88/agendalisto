-- =====================================================
-- HOTFIX: Restaurar FK faltante entre appointments y profiles
-- =====================================================
-- El DROP TABLE public.profiles CASCADE eliminó la FK
-- appointments.user_id → profiles(id). Hay que recrearla.
-- =====================================================
ALTER TABLE public.agendaya_appointments
ADD CONSTRAINT fk_agendaya_appointments_user_id
FOREIGN KEY (user_id) REFERENCES public.agendaya_profiles(id)
ON DELETE CASCADE ON UPDATE CASCADE;

-- Verificar que la FK se creó
SELECT conname, conrelid::regclass AS table_name, pg_get_constraintdef(oid) AS constraint_def
FROM pg_constraint
WHERE conname = 'fk_agendaya_appointments_user_id';
