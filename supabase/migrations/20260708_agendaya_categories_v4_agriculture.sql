-- Migration: Agregar categorías para sector agroindustrial y comercio exterior
-- Fecha: 2026-07-08
-- Contexto: Landing pages de ciudad (Pitalito/Huila) necesitan categorías
-- para productores, exportadores, bodegas y grandes superficies.

INSERT INTO public.agendaya_business_categories (name, slug, description, icon)
SELECT 'Agroindustria', 'agroindustria', 'Productores agrícolas, fincas, trilladoras, procesamiento y transformación de alimentos', 'sprout'
WHERE NOT EXISTS (SELECT 1 FROM public.agendaya_business_categories WHERE slug = 'agroindustria');

INSERT INTO public.agendaya_business_categories (name, slug, description, icon)
SELECT 'Comercio Exterior', 'comercio-exterior', 'Exportadores, importadores, agencias de aduana y comercio internacional', 'globe'
WHERE NOT EXISTS (SELECT 1 FROM public.agendaya_business_categories WHERE slug = 'comercio-exterior');

INSERT INTO public.agendaya_business_categories (name, slug, description, icon)
SELECT 'Logística', 'logistica', 'Bodegas, centros de acopio, transporte de carga, distribución y almacenamiento', 'package'
WHERE NOT EXISTS (SELECT 1 FROM public.agendaya_business_categories WHERE slug = 'logistica');

INSERT INTO public.agendaya_business_categories (name, slug, description, icon)
SELECT 'Grandes Superficies', 'grandes-superficies', 'Supermercados, hipermercados, almacenes de cadena y centros comerciales', 'shopping-cart'
WHERE NOT EXISTS (SELECT 1 FROM public.agendaya_business_categories WHERE slug = 'grandes-superficies');
