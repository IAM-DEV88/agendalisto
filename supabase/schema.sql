-- CONFIGURACIÓN DE BASE DE DATOS PARA APPAGENDA
-- Este script crea todas las tablas, políticas de seguridad y triggers necesarios
-- Versión corregida y optimizada para evitar problemas de autenticación

-- REINICIAR ESQUEMAS (OPCIONAL - USAR CON PRECAUCIÓN)
-- Esto elimina todas las tablas existentes. Descomenta si necesitas una limpieza completa.
-- DROP SCHEMA public CASCADE;
-- CREATE SCHEMA public;
-- GRANT ALL ON SCHEMA public TO postgres;
-- GRANT ALL ON SCHEMA public TO public;

-- EXTENSIONES
-- Habilitar UUID para generar identificadores únicos automáticamente
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ESQUEMA Y TABLAS

-- Tabla de perfiles de usuarios (vinculada a auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  email TEXT NOT NULL,
  avatar_url TEXT,
  is_business BOOLEAN DEFAULT FALSE,
  business_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de categorías de negocios
CREATE TABLE IF NOT EXISTS public.business_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de negocios
CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  address TEXT NOT NULL,
  logo_url TEXT,
  phone TEXT,
  email TEXT,
  whatsapp TEXT,
  instagram TEXT,
  facebook TEXT,
  website TEXT,
  lat NUMERIC(10,8),
  lng NUMERIC(11,8),
  category_id UUID REFERENCES public.business_categories(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agregar referencia en tabla profiles solo si ya existe la tabla businesses
-- Y verificar primero si la restricción ya existe para evitar errores
DO $$
BEGIN
  -- Verificar si la restricción ya existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_business_id' AND conrelid = 'public.profiles'::regclass
  ) THEN
    -- Si no existe, añadirla
    ALTER TABLE public.profiles 
      ADD CONSTRAINT fk_business_id 
      FOREIGN KEY (business_id) 
      REFERENCES public.businesses(id) 
      ON DELETE SET NULL;
  END IF;
END;
$$;

-- Tabla de servicios ofrecidos por negocios
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  duration INTEGER NOT NULL, -- duración en minutos
  price NUMERIC(10,2) NOT NULL,
  provider TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de horarios de atención de negocios
CREATE TABLE IF NOT EXISTS public.business_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER NOT NULL, -- 0 (domingo) a 6 (sábado)
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_closed BOOLEAN DEFAULT FALSE
);

-- Tabla de configuración de negocios
CREATE TABLE IF NOT EXISTS public.business_config (
  business_id UUID PRIMARY KEY REFERENCES public.businesses(id) ON DELETE CASCADE,
  permitir_reservas_online BOOLEAN NOT NULL DEFAULT true,
  mostrar_precios BOOLEAN NOT NULL DEFAULT true,
  mostrar_telefono BOOLEAN NOT NULL DEFAULT true,
  mostrar_email BOOLEAN NOT NULL DEFAULT false,
  mostrar_redes_sociales BOOLEAN NOT NULL DEFAULT true,
  mostrar_direccion BOOLEAN NOT NULL DEFAULT true,
  requiere_confirmacion BOOLEAN NOT NULL DEFAULT false,
  tiempo_minimo_cancelacion INTEGER NOT NULL DEFAULT 48,
  notificaciones_email BOOLEAN NOT NULL DEFAULT true,
  notificaciones_whatsapp BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Tabla de citas/reservas
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de reseñas
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TRIGGERS Y FUNCIONES

-- Función para crear perfil automáticamente al registrar un usuario
-- Versión optimizada para evitar errores
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Verificar si el trigger ya existe y crearlo solo si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user();
  END IF;
END;
$$;

-- Función para actualizar el campo updated_at automáticamente
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger para actualizar automáticamente updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at'
  ) THEN
    CREATE TRIGGER update_profiles_updated_at 
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW 
      EXECUTE FUNCTION public.update_modified_column();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_businesses_updated_at'
  ) THEN
    CREATE TRIGGER update_businesses_updated_at 
      BEFORE UPDATE ON public.businesses
      FOR EACH ROW 
      EXECUTE FUNCTION public.update_modified_column();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_services_updated_at'
  ) THEN
    CREATE TRIGGER update_services_updated_at 
      BEFORE UPDATE ON public.services
      FOR EACH ROW 
      EXECUTE FUNCTION public.update_modified_column();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_appointments_updated_at'
  ) THEN
    CREATE TRIGGER update_appointments_updated_at 
      BEFORE UPDATE ON public.appointments
      FOR EACH ROW 
      EXECUTE FUNCTION public.update_modified_column();
  END IF;
END;
$$;

-- POLÍTICAS DE SEGURIDAD (RLS)

-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_config ENABLE ROW LEVEL SECURITY;

-- ===== POLÍTICAS PARA PROFILES =====

-- Política para ver perfiles (todos pueden ver perfiles)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" 
  ON public.profiles 
  FOR SELECT 
  USING (true);

-- Política para actualizar perfil (solo el propio usuario)
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- ===== POLÍTICAS PARA BUSINESSES =====

-- Política para ver negocios (todos pueden ver)
DROP POLICY IF EXISTS "Businesses are viewable by everyone" ON public.businesses;
CREATE POLICY "Businesses are viewable by everyone" 
  ON public.businesses 
  FOR SELECT 
  USING (true);

-- Política para crear negocios (usuario autenticado)
DROP POLICY IF EXISTS "Users can create businesses" ON public.businesses;
CREATE POLICY "Users can create businesses" 
  ON public.businesses 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Política para actualizar negocios (solo el dueño)
DROP POLICY IF EXISTS "Owners can update their businesses" ON public.businesses;
CREATE POLICY "Owners can update their businesses" 
  ON public.businesses 
  FOR UPDATE 
  USING (auth.uid() = owner_id);

-- Política para eliminar negocios (solo el dueño)
DROP POLICY IF EXISTS "Owners can delete their businesses" ON public.businesses;
CREATE POLICY "Owners can delete their businesses" 
  ON public.businesses 
  FOR DELETE 
  USING (auth.uid() = owner_id);

-- ===== POLÍTICAS PARA SERVICES =====

-- Política para ver servicios (todos pueden ver)
DROP POLICY IF EXISTS "Services are viewable by everyone" ON public.services;
CREATE POLICY "Services are viewable by everyone" 
  ON public.services 
  FOR SELECT 
  USING (true);

-- Política para crear servicios (solo dueño del negocio)
DROP POLICY IF EXISTS "Business owners can insert services" ON public.services;
CREATE POLICY "Business owners can insert services" 
  ON public.services 
  FOR INSERT 
  WITH CHECK (
    auth.uid() IN (
      SELECT owner_id FROM public.businesses WHERE id = business_id
    )
  );

-- Política para actualizar servicios (solo dueño del negocio)
DROP POLICY IF EXISTS "Business owners can update services" ON public.services;
CREATE POLICY "Business owners can update services" 
  ON public.services 
  FOR UPDATE 
  USING (
    auth.uid() IN (
      SELECT owner_id FROM public.businesses WHERE id = business_id
    )
  );

-- Política para eliminar servicios (solo dueño del negocio)
DROP POLICY IF EXISTS "Business owners can delete services" ON public.services;
CREATE POLICY "Business owners can delete services" 
  ON public.services 
  FOR DELETE 
  USING (
    auth.uid() IN (
      SELECT owner_id FROM public.businesses WHERE id = business_id
    )
  );

-- ===== POLÍTICAS PARA BUSINESS_HOURS =====

-- Política para ver horarios (todos pueden ver)
DROP POLICY IF EXISTS "Business hours are viewable by everyone" ON public.business_hours;
CREATE POLICY "Business hours are viewable by everyone" 
  ON public.business_hours 
  FOR SELECT 
  USING (true);

-- Política para crear horarios (solo dueño del negocio)
DROP POLICY IF EXISTS "Business owners can insert business hours" ON public.business_hours;
CREATE POLICY "Business owners can insert business hours" 
  ON public.business_hours 
  FOR INSERT 
  WITH CHECK (
    auth.uid() IN (
      SELECT owner_id FROM public.businesses WHERE id = business_id
    )
  );

-- Política para actualizar horarios (solo dueño del negocio)
DROP POLICY IF EXISTS "Business owners can update business hours" ON public.business_hours;
CREATE POLICY "Business owners can update business hours" 
  ON public.business_hours 
  FOR UPDATE 
  USING (
    auth.uid() IN (
      SELECT owner_id FROM public.businesses WHERE id = business_id
    )
  );

-- Política para eliminar horarios (solo dueño del negocio)
DROP POLICY IF EXISTS "Business owners can delete business hours" ON public.business_hours;
CREATE POLICY "Business owners can delete business hours" 
  ON public.business_hours 
  FOR DELETE 
  USING (
    auth.uid() IN (
      SELECT owner_id FROM public.businesses WHERE id = business_id
    )
  );

-- ===== POLÍTICAS PARA APPOINTMENTS =====

-- Política para ver citas para usuarios (solo sus propias citas)
DROP POLICY IF EXISTS "Users can view their own appointments" ON public.appointments;
CREATE POLICY "Users can view their own appointments" 
  ON public.appointments 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Política para ver citas para dueños de negocios (solo citas de su negocio)
DROP POLICY IF EXISTS "Business owners can view business appointments" ON public.appointments;
CREATE POLICY "Business owners can view business appointments" 
  ON public.appointments 
  FOR SELECT 
  USING (
    auth.uid() IN (
      SELECT owner_id FROM public.businesses WHERE id = business_id
    )
  );

-- Política para crear citas (cualquier usuario autenticado)
DROP POLICY IF EXISTS "Authenticated users can create appointments" ON public.appointments;
CREATE POLICY "Authenticated users can create appointments" 
  ON public.appointments 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id AND 
    auth.uid() IS NOT NULL
  );

-- Política para actualizar citas (usuario dueño o dueño del negocio)
DROP POLICY IF EXISTS "Users can update their appointments" ON public.appointments;
CREATE POLICY "Users can update their appointments" 
  ON public.appointments 
  FOR UPDATE 
  USING (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT owner_id FROM public.businesses WHERE id = business_id
    )
  );

-- Política para eliminar citas (usuario dueño o dueño del negocio)
DROP POLICY IF EXISTS "Users can delete their appointments" ON public.appointments;
CREATE POLICY "Users can delete their appointments" 
  ON public.appointments 
  FOR DELETE 
  USING (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT owner_id FROM public.businesses WHERE id = business_id
    )
  );

-- ===== POLÍTICAS PARA REVIEWS =====

-- Política para ver reseñas (todos pueden ver)
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
CREATE POLICY "Reviews are viewable by everyone" 
  ON public.reviews 
  FOR SELECT 
  USING (true);

-- Política para crear reseñas (solo para usuarios que completaron la cita)
DROP POLICY IF EXISTS "Users can create reviews for completed appointments" ON public.reviews;
CREATE POLICY "Users can create reviews for completed appointments" 
  ON public.reviews 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id AND
    appointment_id IN (
      SELECT id FROM public.appointments 
      WHERE user_id = auth.uid() AND status = 'completed'
    )
  );

-- Política para actualizar reseñas (solo el usuario que la creó)
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
CREATE POLICY "Users can update their own reviews" 
  ON public.reviews 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Política para eliminar reseñas (solo el usuario que la creó)
DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.reviews;
CREATE POLICY "Users can delete their own reviews" 
  ON public.reviews 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- ===== POLÍTICAS PARA BUSINESS_CATEGORIES =====

-- Política para ver categorías (todos pueden ver)
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.business_categories;
CREATE POLICY "Categories are viewable by everyone" 
  ON public.business_categories 
  FOR SELECT 
  USING (true);

-- Solo administradores pueden modificar categorías (por medio de SQL directo)

-- ===== POLÍTICAS PARA BUSINESS_CONFIG =====

-- Política para ver configuración (todos pueden ver)
DROP POLICY IF EXISTS "Business config are viewable by everyone" ON public.business_config;
CREATE POLICY "Business config are viewable by everyone"
  ON public.business_config FOR SELECT
  USING (true);

-- Política para crear configuración (solo dueño del negocio)
DROP POLICY IF EXISTS "Business owners can insert business config" ON public.business_config;
CREATE POLICY "Business owners can insert business config"
  ON public.business_config FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT owner_id FROM public.businesses WHERE id = business_id
    )
  );

-- Política para actualizar configuración (solo dueño del negocio)
DROP POLICY IF EXISTS "Business owners can update business config" ON public.business_config;
CREATE POLICY "Business owners can update business config"
  ON public.business_config FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT owner_id FROM public.businesses WHERE id = business_id
    )
  );

-- Trigger automático para updated_at en business_config
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_business_config_updated_at'
  ) THEN
    CREATE TRIGGER update_business_config_updated_at
      BEFORE UPDATE ON public.business_config
      FOR EACH ROW
      EXECUTE FUNCTION public.update_modified_column();
  END IF;
END;
$$;

-- DATOS DE MUESTRA (SOLO SI LA TABLA ESTÁ VACÍA)

-- Insertar categorías de negocios solo si no existen
INSERT INTO public.business_categories (name, slug, description, icon)
SELECT 'Belleza', 'belleza', 'Salones de belleza, peluquerías, barberías y servicios estéticos', 'scissors'
WHERE NOT EXISTS (SELECT 1 FROM public.business_categories WHERE slug = 'belleza');

INSERT INTO public.business_categories (name, slug, description, icon)
SELECT 'Salud', 'salud', 'Consultorios médicos, dentistas, fisioterapeutas y otros profesionales de la salud', 'heart-pulse'
WHERE NOT EXISTS (SELECT 1 FROM public.business_categories WHERE slug = 'salud');

INSERT INTO public.business_categories (name, slug, description, icon)
SELECT 'Fitness', 'fitness', 'Gimnasios, entrenadores personales y centros deportivos', 'dumbbell'
WHERE NOT EXISTS (SELECT 1 FROM public.business_categories WHERE slug = 'fitness');

INSERT INTO public.business_categories (name, slug, description, icon)
SELECT 'Alimentación', 'alimentacion', 'Nutricionistas, dietistas y asesores alimenticios', 'apple'
WHERE NOT EXISTS (SELECT 1 FROM public.business_categories WHERE slug = 'alimentacion');

INSERT INTO public.business_categories (name, slug, description, icon)
SELECT 'Educación', 'educacion', 'Tutorías, clases particulares, academias y cursos', 'book'
WHERE NOT EXISTS (SELECT 1 FROM public.business_categories WHERE slug = 'educacion');

-- VERIFICACIONES FINALES

-- Verificar permisos de supabase_auth_admin
DO $$
DECLARE
  obj record;
BEGIN
  FOR obj IN
    SELECT 
      tablename as name
    FROM 
      pg_tables
    WHERE 
      schemaname = 'auth'
  LOOP
    EXECUTE format('ALTER TABLE auth.%I OWNER TO supabase_auth_admin', obj.name);
  END LOOP;
END;
$$;

-- Añadir migración que causa problemas
-- Soluciona error común: "20221208132122_backfill_email_last_sign_in_at.up.sql"
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM auth.schema_migrations WHERE version = '20221208132122'
  ) THEN
    INSERT INTO auth.schema_migrations VALUES ('20221208132122');
  END IF;
END
$$; 