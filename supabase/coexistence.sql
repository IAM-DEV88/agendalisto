-- =====================================================
-- COEXISTENCE: Renombrar tablas de AgendaYa
-- =====================================================
-- Ejecutar COMPLETO en SQL Editor.
-- Si ves algún error, dímelo exactamente.
-- =====================================================

-- ========== PASO 1: Renombrar 14 tablas ==========

ALTER TABLE IF EXISTS public.business_categories RENAME TO agendaya_business_categories;
ALTER TABLE IF EXISTS public.blog_posts         RENAME TO agendaya_blog_posts;
ALTER TABLE IF EXISTS public.blog_likes          RENAME TO agendaya_blog_likes;
ALTER TABLE IF EXISTS public.milestones          RENAME TO agendaya_milestones;
ALTER TABLE IF EXISTS public.chat_messages       RENAME TO agendaya_chat_messages;
ALTER TABLE IF EXISTS public.user_likes          RENAME TO agendaya_user_likes;

ALTER TABLE IF EXISTS public.businesses          RENAME TO agendaya_businesses;
ALTER TABLE IF EXISTS public.services            RENAME TO agendaya_services;
ALTER TABLE IF EXISTS public.business_config     RENAME TO agendaya_business_config;
ALTER TABLE IF EXISTS public.business_hours      RENAME TO agendaya_business_hours;

ALTER TABLE IF EXISTS public.appointments        RENAME TO agendaya_appointments;
ALTER TABLE IF EXISTS public.reviews             RENAME TO agendaya_reviews;
ALTER TABLE IF EXISTS public.blog_comments       RENAME TO agendaya_blog_comments;

-- profiles: si ambas existen, dropear la vieja (con limpieza previa)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='profiles')
     AND EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='agendaya_profiles') THEN
    DROP POLICY IF EXISTS "agendaya_profiles público" ON public.profiles;
    DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
    DROP POLICY IF EXISTS "agendaya_users can update their own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
    DROP POLICY IF EXISTS "Usuario actualiza su profile" ON public.profiles;
    DROP POLICY IF EXISTS "Profiles públicos visibles" ON public.profiles;
    ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
    DROP TABLE public.profiles CASCADE;
  ELSIF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='profiles') THEN
    ALTER TABLE public.profiles RENAME TO agendaya_profiles;
  END IF;
END $$;

-- ========== Si llegaste hasta acá sin errores, 
-- ========== los renombres funcionaron. 
-- ========== Sigue con el PASO 2 abajo.

-- ========== PASO 2: Registrar app + backfill perfiles ==========

INSERT INTO public.apps (slug, name) VALUES ('agendaya', 'AgendaYa')
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.agendaya_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT, phone TEXT, email TEXT NOT NULL,
  avatar_url TEXT, is_business BOOLEAN DEFAULT FALSE,
  business_id UUID, items_per_page INTEGER DEFAULT 4,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO public.agendaya_profiles (id, full_name, email, created_at, updated_at)
SELECT au.id, COALESCE(au.raw_user_meta_data->>'full_name', au.email), au.email,
       COALESCE(au.created_at, NOW()), NOW()
FROM auth.users au LEFT JOIN public.agendaya_profiles ap ON ap.id = au.id
WHERE ap.id IS NULL
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_apps (user_id, app_slug, role, status)
SELECT id, 'agendaya', 'visitor', 'active'
FROM public.agendaya_profiles
ON CONFLICT (user_id, app_slug) DO NOTHING;

-- ========== PASO 3: RLS para todas las tablas ==========

ALTER TABLE public.agendaya_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "agendaya_profiles público" ON public.agendaya_profiles;
CREATE POLICY "agendaya_profiles público" ON public.agendaya_profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "agendaya_profiles edita propio" ON public.agendaya_profiles;
CREATE POLICY "agendaya_profiles edita propio" ON public.agendaya_profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "agendaya_profiles crea propio" ON public.agendaya_profiles;
CREATE POLICY "agendaya_profiles crea propio" ON public.agendaya_profiles FOR INSERT WITH CHECK (auth.uid() = id);

ALTER TABLE public.agendaya_businesses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "agendaya_businesses público" ON public.agendaya_businesses;
CREATE POLICY "agendaya_businesses público" ON public.agendaya_businesses FOR SELECT USING (true);
DROP POLICY IF EXISTS "agendaya_businesses dueño crea" ON public.agendaya_businesses;
CREATE POLICY "agendaya_businesses dueño crea" ON public.agendaya_businesses FOR INSERT WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS "agendaya_businesses dueño actualiza" ON public.agendaya_businesses;
CREATE POLICY "agendaya_businesses dueño actualiza" ON public.agendaya_businesses FOR UPDATE USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "agendaya_businesses dueño elimina" ON public.agendaya_businesses;
CREATE POLICY "agendaya_businesses dueño elimina" ON public.agendaya_businesses FOR DELETE USING (auth.uid() = owner_id);

ALTER TABLE public.agendaya_services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "agendaya_services público" ON public.agendaya_services;
CREATE POLICY "agendaya_services público" ON public.agendaya_services FOR SELECT USING (true);
DROP POLICY IF EXISTS "agendaya_services dueño crea" ON public.agendaya_services;
CREATE POLICY "agendaya_services dueño crea" ON public.agendaya_services FOR INSERT WITH CHECK (auth.uid() IN (SELECT owner_id FROM agendaya_businesses WHERE id = business_id));
DROP POLICY IF EXISTS "agendaya_services dueño actualiza" ON public.agendaya_services;
CREATE POLICY "agendaya_services dueño actualiza" ON public.agendaya_services FOR UPDATE USING (auth.uid() IN (SELECT owner_id FROM agendaya_businesses WHERE id = business_id));
DROP POLICY IF EXISTS "agendaya_services dueño elimina" ON public.agendaya_services;
CREATE POLICY "agendaya_services dueño elimina" ON public.agendaya_services FOR DELETE USING (auth.uid() IN (SELECT owner_id FROM agendaya_businesses WHERE id = business_id));

ALTER TABLE public.agendaya_business_hours ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "agendaya_business_hours público" ON public.agendaya_business_hours;
CREATE POLICY "agendaya_business_hours público" ON public.agendaya_business_hours FOR SELECT USING (true);

ALTER TABLE public.agendaya_business_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "agendaya_business_config público" ON public.agendaya_business_config;
CREATE POLICY "agendaya_business_config público" ON public.agendaya_business_config FOR SELECT USING (true);

ALTER TABLE public.agendaya_appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "agendaya_appointments usuario ve propias" ON public.agendaya_appointments;
CREATE POLICY "agendaya_appointments usuario ve propias" ON public.agendaya_appointments FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "agendaya_appointments negocio ve citas" ON public.agendaya_appointments;
CREATE POLICY "agendaya_appointments negocio ve citas" ON public.agendaya_appointments FOR SELECT USING (auth.uid() IN (SELECT owner_id FROM agendaya_businesses WHERE id = business_id));
DROP POLICY IF EXISTS "agendaya_appointments usuario crea" ON public.agendaya_appointments;
CREATE POLICY "agendaya_appointments usuario crea" ON public.agendaya_appointments FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.agendaya_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "agendaya_reviews público" ON public.agendaya_reviews;
CREATE POLICY "agendaya_reviews público" ON public.agendaya_reviews FOR SELECT USING (true);

ALTER TABLE public.agendaya_blog_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "agendaya_blog_posts público" ON public.agendaya_blog_posts;
CREATE POLICY "agendaya_blog_posts público" ON public.agendaya_blog_posts FOR SELECT USING (true);
ALTER TABLE public.agendaya_blog_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "agendaya_blog_comments público" ON public.agendaya_blog_comments;
CREATE POLICY "agendaya_blog_comments público" ON public.agendaya_blog_comments FOR SELECT USING (true);
ALTER TABLE public.agendaya_blog_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "agendaya_blog_likes público" ON public.agendaya_blog_likes;
CREATE POLICY "agendaya_blog_likes público" ON public.agendaya_blog_likes FOR SELECT USING (true);

ALTER TABLE public.agendaya_chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "agendaya_chat_messages insert público" ON public.agendaya_chat_messages;
CREATE POLICY "agendaya_chat_messages insert público" ON public.agendaya_chat_messages FOR INSERT WITH CHECK (true);

ALTER TABLE public.agendaya_milestones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "agendaya_milestones público" ON public.agendaya_milestones;
CREATE POLICY "agendaya_milestones público" ON public.agendaya_milestones FOR SELECT USING (true);

ALTER TABLE public.agendaya_business_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "agendaya_business_categories público" ON public.agendaya_business_categories;
CREATE POLICY "agendaya_business_categories público" ON public.agendaya_business_categories FOR SELECT USING (true);

ALTER TABLE public.agendaya_user_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "agendaya_user_likes público" ON public.agendaya_user_likes;
CREATE POLICY "agendaya_user_likes público" ON public.agendaya_user_likes FOR SELECT USING (true);

-- ========== PASO 4: handle_new_user() para ambas apps ==========

CREATE OR REPLACE FUNCTION public.sanitize_signup_role(raw_role text)
RETURNS text LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  IF raw_role IN ('advertiser') THEN RETURN 'advertiser'; END IF;
  RETURN 'visitor';
END $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE safe_role text;
BEGIN
  safe_role := public.sanitize_signup_role(COALESCE(NEW.raw_user_meta_data->>'role', 'visitor'));

  INSERT INTO public.encuentrosvip_profiles (user_id, display_name, city, plan, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)), '', 'visitor', safe_role)
  ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.user_apps (user_id, app_slug, role, status)
  VALUES (NEW.id, 'encuentrosvip', safe_role, 'active')
  ON CONFLICT (user_id, app_slug) DO NOTHING;

  INSERT INTO public.agendaya_profiles (id, full_name, email, created_at, updated_at)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)), NEW.email, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_apps (user_id, app_slug, role, status)
  VALUES (NEW.id, 'agendaya', 'visitor', 'active')
  ON CONFLICT (user_id, app_slug) DO NOTHING;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========== FIN ==========
-- Verificación final
SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'agendaya_%' ORDER BY tablename;
