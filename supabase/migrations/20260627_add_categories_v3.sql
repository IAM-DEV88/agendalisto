-- Migración: Agregar nuevas categorías a agendaya_business_categories (v3)
-- Fecha: 2026-06-27
-- Categorías: Turismo, Diseño, Jardinería, Música, Cuidado Infantil, Profesionales

INSERT INTO public.agendaya_business_categories (name, slug, description, icon)
SELECT 'Turismo', 'turismo', 'Agencias de viaje, guías turísticos, paquetes turísticos y turismo de aventura', 'compass'
WHERE NOT EXISTS (SELECT 1 FROM public.agendaya_business_categories WHERE slug = 'turismo');

INSERT INTO public.agendaya_business_categories (name, slug, description, icon)
SELECT 'Diseño', 'diseno', 'Diseño gráfico, branding, producción multimedia y servicios creativos', 'pen-tool'
WHERE NOT EXISTS (SELECT 1 FROM public.agendaya_business_categories WHERE slug = 'diseno');

INSERT INTO public.agendaya_business_categories (name, slug, description, icon)
SELECT 'Jardinería', 'jardineria', 'Paisajismo, jardinería, poda y mantenimiento de zonas verdes', 'flower-2'
WHERE NOT EXISTS (SELECT 1 FROM public.agendaya_business_categories WHERE slug = 'jardineria');

INSERT INTO public.agendaya_business_categories (name, slug, description, icon)
SELECT 'Música', 'musica', 'Clases de música, músicos para eventos y reparación de instrumentos', 'music'
WHERE NOT EXISTS (SELECT 1 FROM public.agendaya_business_categories WHERE slug = 'musica');

INSERT INTO public.agendaya_business_categories (name, slug, description, icon)
SELECT 'Cuidado Infantil', 'cuidado-infantil', 'Guarderías, niñeras, actividades infantiles y jardín infantil', 'baby'
WHERE NOT EXISTS (SELECT 1 FROM public.agendaya_business_categories WHERE slug = 'cuidado-infantil');

INSERT INTO public.agendaya_business_categories (name, slug, description, icon)
SELECT 'Profesionales', 'profesionales', 'Servicios profesionales independientes, consultorías y asesorías', 'briefcase'
WHERE NOT EXISTS (SELECT 1 FROM public.agendaya_business_categories WHERE slug = 'profesionales');
