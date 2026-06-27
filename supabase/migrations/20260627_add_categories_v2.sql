-- Migración: Agregar nuevas categorías a agendaya_business_categories (v2)
-- Fecha: 2026-06-27
-- Categorías: 10 nuevas (Restaurantes, Bar, Cafetería, Estanco, Psicología, Veterinaria, Tecnología, Limpieza, Construcción, Transporte)

INSERT INTO public.agendaya_business_categories (name, slug, description, icon)
SELECT 'Restaurantes', 'restaurantes', 'Restaurantes, comidas rápidas, pizzerías y servicio a la mesa', 'utensils'
WHERE NOT EXISTS (SELECT 1 FROM public.agendaya_business_categories WHERE slug = 'restaurantes');

INSERT INTO public.agendaya_business_categories (name, slug, description, icon)
SELECT 'Bar', 'bar', 'Bares, pubs, discotecas y vida nocturna', 'wine'
WHERE NOT EXISTS (SELECT 1 FROM public.agendaya_business_categories WHERE slug = 'bar');

INSERT INTO public.agendaya_business_categories (name, slug, description, icon)
SELECT 'Cafetería', 'cafeteria', 'Cafeterías, panaderías, pastelerías y heladerías', 'coffee'
WHERE NOT EXISTS (SELECT 1 FROM public.agendaya_business_categories WHERE slug = 'cafeteria');

INSERT INTO public.agendaya_business_categories (name, slug, description, icon)
SELECT 'Estanco', 'estanco', 'Estancos, cigarrerías, venta de lotería y artículos de conveniencia', 'store'
WHERE NOT EXISTS (SELECT 1 FROM public.agendaya_business_categories WHERE slug = 'estanco');

INSERT INTO public.agendaya_business_categories (name, slug, description, icon)
SELECT 'Psicología', 'psicologia', 'Psicólogos, terapeutas y servicios de salud mental', 'brain'
WHERE NOT EXISTS (SELECT 1 FROM public.agendaya_business_categories WHERE slug = 'psicologia');

INSERT INTO public.agendaya_business_categories (name, slug, description, icon)
SELECT 'Veterinaria', 'veterinaria', 'Clínicas veterinarias, peluquería canina y cuidado de mascotas', 'paw-print'
WHERE NOT EXISTS (SELECT 1 FROM public.agendaya_business_categories WHERE slug = 'veterinaria');

INSERT INTO public.agendaya_business_categories (name, slug, description, icon)
SELECT 'Tecnología', 'tecnologia', 'Reparación de computadores, service técnico y soporte IT', 'laptop'
WHERE NOT EXISTS (SELECT 1 FROM public.agendaya_business_categories WHERE slug = 'tecnologia');

INSERT INTO public.agendaya_business_categories (name, slug, description, icon)
SELECT 'Limpieza', 'limpieza', 'Servicios de aseo, limpieza de hogar y oficina', 'spray-can'
WHERE NOT EXISTS (SELECT 1 FROM public.agendaya_business_categories WHERE slug = 'limpieza');

INSERT INTO public.agendaya_business_categories (name, slug, description, icon)
SELECT 'Construcción', 'construccion', 'Remodelaciones, mantenimiento del hogar, electricistas y plomeros', 'hammer'
WHERE NOT EXISTS (SELECT 1 FROM public.agendaya_business_categories WHERE slug = 'construccion');

INSERT INTO public.agendaya_business_categories (name, slug, description, icon)
SELECT 'Transporte', 'transporte', 'Mudanzas, fletes, mensajería y transporte de pasajeros', 'truck'
WHERE NOT EXISTS (SELECT 1 FROM public.agendaya_business_categories WHERE slug = 'transporte');
