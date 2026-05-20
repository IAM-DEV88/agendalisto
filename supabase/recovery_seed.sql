-- =====================================================
-- RECOVERY: Poblar datos de referencia de AgendaYa
-- =====================================================
-- Ejecutar en Supabase SQL Editor DESPUÉS de haber
-- ejecutado coexistence.sql (desde encuentrosvip).
-- =====================================================

-- =============================================
-- 1. Categorías de negocios (seed)
-- =============================================
INSERT INTO public.agendaya_business_categories (name, slug, description, icon)
SELECT 'Belleza', 'belleza', 'Salones de belleza, peluquerías, barberías y servicios estéticos', 'scissors'
WHERE NOT EXISTS (SELECT 1 FROM public.agendaya_business_categories WHERE slug = 'belleza');

INSERT INTO public.agendaya_business_categories (name, slug, description, icon)
SELECT 'Salud', 'salud', 'Consultorios médicos, dentistas, fisioterapeutas y otros profesionales de la salud', 'heart-pulse'
WHERE NOT EXISTS (SELECT 1 FROM public.agendaya_business_categories WHERE slug = 'salud');

INSERT INTO public.agendaya_business_categories (name, slug, description, icon)
SELECT 'Fitness', 'fitness', 'Gimnasios, entrenadores personales y centros deportivos', 'dumbbell'
WHERE NOT EXISTS (SELECT 1 FROM public.agendaya_business_categories WHERE slug = 'fitness');

INSERT INTO public.agendaya_business_categories (name, slug, description, icon)
SELECT 'Alimentación', 'alimentacion', 'Nutricionistas, dietistas y asesores alimenticios', 'apple'
WHERE NOT EXISTS (SELECT 1 FROM public.agendaya_business_categories WHERE slug = 'alimentacion');

INSERT INTO public.agendaya_business_categories (name, slug, description, icon)
SELECT 'Educación', 'educacion', 'Tutorías, clases particulares, academias y cursos', 'book'
WHERE NOT EXISTS (SELECT 1 FROM public.agendaya_business_categories WHERE slug = 'educacion');

-- =============================================
-- 2. Milestones (seed para crowdfunding)
-- =============================================
INSERT INTO public.agendaya_milestones (title, cta, description, goal_amount, current_amount)
SELECT 'App Operativa', 'Ver progreso', 'Primera versión funcional de la plataforma con registro de negocios y reservas online', 5000, 5000
WHERE NOT EXISTS (SELECT 1 FROM public.agendaya_milestones WHERE title = 'App Operativa');

INSERT INTO public.agendaya_milestones (title, cta, description, goal_amount, current_amount)
SELECT 'App Móvil', 'Apoyar', 'Versión móvil nativa para iOS y Android con notificaciones push', 15000, 2500
WHERE NOT EXISTS (SELECT 1 FROM public.agendaya_milestones WHERE title = 'App Móvil');

INSERT INTO public.agendaya_milestones (title, cta, description, goal_amount, current_amount)
SELECT 'IA Recomendaciones', 'Saber más', 'Sistema inteligente de recomendaciones personalizadas para usuarios', 25000, 0
WHERE NOT EXISTS (SELECT 1 FROM public.agendaya_milestones WHERE title = 'IA Recomendaciones');

-- =============================================
-- 3. Verificar que el trigger handle_new_user
--    está actualizado (crea perfiles para ambas apps)
-- =============================================
-- Ya debería estar actualizado por coexistence.sql.
-- Para confirmar, revisar que la función existe:
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'handle_new_user'
  AND prosrc LIKE '%agendaya_profiles%'
  AND prosrc LIKE '%encuentrosvip_profiles%';
-- Si devuelve 1 fila → OK, soporta ambas apps
