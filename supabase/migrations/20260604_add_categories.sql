-- Migración: Agregar nuevas categorías a agendaya_business_categories
-- Fecha: 2026-06-04

INSERT INTO public.agendaya_business_categories (name, slug, description, icon)
SELECT 'Hotelería', 'hoteleria', 'Hoteles, hostales, Airbnb y alojamientos turísticos', 'building'
WHERE NOT EXISTS (SELECT 1 FROM public.agendaya_business_categories WHERE slug = 'hoteleria');

INSERT INTO public.agendaya_business_categories (name, slug, description, icon)
SELECT 'Mecánica', 'mecanica', 'Talleres mecánicos, mantenimiento vehicular y servicios automotrices', 'wrench'
WHERE NOT EXISTS (SELECT 1 FROM public.agendaya_business_categories WHERE slug = 'mecanica');

INSERT INTO public.agendaya_business_categories (name, slug, description, icon)
SELECT 'Artesanía', 'artesania', 'Productos artesanales, manualidades y arte local', 'palette'
WHERE NOT EXISTS (SELECT 1 FROM public.agendaya_business_categories WHERE slug = 'artesania');

INSERT INTO public.agendaya_business_categories (name, slug, description, icon)
SELECT 'Moda', 'moda', 'Ropa, accesorios, calzado y servicios de moda', 'shirt'
WHERE NOT EXISTS (SELECT 1 FROM public.agendaya_business_categories WHERE slug = 'moda');

INSERT INTO public.agendaya_business_categories (name, slug, description, icon)
SELECT 'Fotografía', 'fotografia', 'Fotógrafos profesionales, estudios y servicios de imagen', 'camera'
WHERE NOT EXISTS (SELECT 1 FROM public.agendaya_business_categories WHERE slug = 'fotografia');

INSERT INTO public.agendaya_business_categories (name, slug, description, icon)
SELECT 'Bienestar', 'bienestar', 'Spas, masajes, terapias alternativas y relajación', 'sparkles'
WHERE NOT EXISTS (SELECT 1 FROM public.agendaya_business_categories WHERE slug = 'bienestar');

INSERT INTO public.agendaya_business_categories (name, slug, description, icon)
SELECT 'Inmobiliaria', 'inmobiliaria', 'Agencias inmobiliarias, corredores de propiedades y arriendos', 'home'
WHERE NOT EXISTS (SELECT 1 FROM public.agendaya_business_categories WHERE slug = 'inmobiliaria');

INSERT INTO public.agendaya_business_categories (name, slug, description, icon)
SELECT 'Legal', 'legal', 'Abogados, notarías, consultoría jurídica y servicios legales', 'scale'
WHERE NOT EXISTS (SELECT 1 FROM public.agendaya_business_categories WHERE slug = 'legal');

INSERT INTO public.agendaya_business_categories (name, slug, description, icon)
SELECT 'Finanzas', 'finanzas', 'Asesoría financiera, contadores, seguros y banca', 'trending-up'
WHERE NOT EXISTS (SELECT 1 FROM public.agendaya_business_categories WHERE slug = 'finanzas');

INSERT INTO public.agendaya_business_categories (name, slug, description, icon)
SELECT 'Entretenimiento', 'entretenimiento', 'Eventos, shows, gaming y actividades recreativas', 'gamepad-2'
WHERE NOT EXISTS (SELECT 1 FROM public.agendaya_business_categories WHERE slug = 'entretenimiento');
