-- Políticas para restablecer el acceso a profiles y milestones 
-- tras haber activado Row Level Security (RLS)

-- ======== PROFILES ========

-- 1. Permitir que cualquier persona (autenticada o no) vea los perfiles
-- Esto es necesario para ver datos públicos de negocios, clientes, etc.
DROP POLICY IF EXISTS "Agendaya_profiles are viewable by everyone" ON public.agendaya_profiles;
CREATE POLICY "Agendaya_profiles are viewable by everyone" 
  ON public.agendaya_profiles 
  FOR SELECT 
  USING (true);

-- 2. Permitir que cada usuario actualice UNICAMENTE su propio perfil
DROP POLICY IF EXISTS "Users can update their own profile" ON public.agendaya_profiles;
CREATE POLICY "Users can update their own profile" 
  ON public.agendaya_profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- NOTA: Insert se maneja vía el trigger handle_new_user internamente con permisos de superusuario
-- Delete típicamente solo lo hace Supabase al borrar la cuenta de Auth.


-- ======== MILESTONES ========

-- 1. Permitir que todo el mundo vea los hitos del Crowdfunding en la App
DROP POLICY IF EXISTS "Agendaya_milestones are viewable by everyone" ON public.agendaya_milestones;
CREATE POLICY "Agendaya_milestones are viewable by everyone" 
  ON public.agendaya_milestones 
  FOR SELECT 
  USING (true);

-- NOTA: El avance / actualización del dinero recaudado de milestones
-- ocurre mediante tu script Backend en el Webhook de IPN usando el "service_role_key"
-- el cual ignora (bypass) estas restricciones de RLS.
-- Por lo que no es necesario crear más políticas aquí. No expongas los permisos UPDATE o INSERT
-- a usuarios públicos para estas tablas financieras.
