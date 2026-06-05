-- =====================================================
-- Agregar columna likes_count a agendaya_businesses
-- y agendaya_services si aún no existe, y poblarla
-- desde los registros existentes en agendaya_user_likes.
-- =====================================================

-- Agregar columna a agendaya_businesses
ALTER TABLE public.agendaya_businesses
  ADD COLUMN IF NOT EXISTS likes_count INTEGER NOT NULL DEFAULT 0;

-- Agregar columna a agendaya_services
ALTER TABLE public.agendaya_services
  ADD COLUMN IF NOT EXISTS likes_count INTEGER NOT NULL DEFAULT 0;

-- Poblar likes_count desde los registros existentes
UPDATE public.agendaya_businesses b
  SET likes_count = (SELECT COUNT(*) FROM public.agendaya_user_likes l WHERE l.business_id = b.id);

UPDATE public.agendaya_services s
  SET likes_count = (SELECT COUNT(*) FROM public.agendaya_user_likes l WHERE l.service_id = s.id);

-- Asegurar que el trigger siga funcionando (ya existe
-- con SECURITY DEFINER en la migración 007)
