-- Datos temporales de prueba para Pitalito y San Agustín
-- Para eliminar estos datos, ejecutar:
-- DELETE FROM business_config WHERE business_id IN (
--   '18a5f9bd-cdc2-45cc-b95e-6554899996d1',
--   '18a5f9bd-cdc2-45cc-b95e-6554899996d2',
--   '18a5f9bd-cdc2-45cc-b95e-6554899996d3',
--   '18a5f9bd-cdc2-45cc-b95e-6554899996d4',
--   '18a5f9bd-cdc2-45cc-b95e-6554899996d5',
--   '18a5f9bd-cdc2-45cc-b95e-6554899996d6',
--   '18a5f9bd-cdc2-45cc-b95e-6554899996d7',
--   '18a5f9bd-cdc2-45cc-b95e-6554899996d8'
-- );
-- DELETE FROM businesses WHERE id IN (
--   '18a5f9bd-cdc2-45cc-b95e-6554899996d1',
--   '18a5f9bd-cdc2-45cc-b95e-6554899996d2',
--   '18a5f9bd-cdc2-45cc-b95e-6554899996d3',
--   '18a5f9bd-cdc2-45cc-b95e-6554899996d4',
--   '18a5f9bd-cdc2-45cc-b95e-6554899996d5',
--   '18a5f9bd-cdc2-45cc-b95e-6554899996d6',
--   '18a5f9bd-cdc2-45cc-b95e-6554899996d7',
--   '18a5f9bd-cdc2-45cc-b95e-6554899996d8'
-- );
-- DELETE FROM profiles WHERE id IN (
--   '18a5f9bd-cdc2-45cc-b95e-6554899996e1',
--   '18a5f9bd-cdc2-45cc-b95e-6554899996e2',
--   '18a5f9bd-cdc2-45cc-b95e-6554899996e3',
--   '18a5f9bd-cdc2-45cc-b95e-6554899996e4',
--   '18a5f9bd-cdc2-45cc-b95e-6554899996e5',
--   '18a5f9bd-cdc2-45cc-b95e-6554899996e6',
--   '18a5f9bd-cdc2-45cc-b95e-6554899996e7',
--   '18a5f9bd-cdc2-45cc-b95e-6554899996e8'
-- );

BEGIN;

-- Insert user profiles (owners)
INSERT INTO profiles (id, full_name, phone, email, created_at, updated_at) VALUES
('18a5f9bd-cdc2-45cc-b95e-6554899996e1', 'María González', '3181234567', 'maria@email.com', NOW(), NOW()),
('18a5f9bd-cdc2-45cc-b95e-6554899996e2', 'Ana Martínez', '3182345678', 'ana@email.com', NOW(), NOW()),
('18a5f9bd-cdc2-45cc-b95e-6554899996e3', 'Carlos Rodríguez', '3183456789', 'carlos@email.com', NOW(), NOW()),
('18a5f9bd-cdc2-45cc-b95e-6554899996e4', 'Laura Sánchez', '3184567890', 'laura@email.com', NOW(), NOW()),
('18a5f9bd-cdc2-45cc-b95e-6554899996e5', 'Juan Pérez', '3185678901', 'juan@email.com', NOW(), NOW()),
('18a5f9bd-cdc2-45cc-b95e-6554899996e6', 'Sofía Ramírez', '3186789012', 'sofia@email.com', NOW(), NOW()),
('18a5f9bd-cdc2-45cc-b95e-6554899996e7', 'Pedro López', '3187890123', 'pedro@email.com', NOW(), NOW()),
('18a5f9bd-cdc2-45cc-b95e-6554899996e8', 'Carmen Torres', '3188901234', 'carmen@email.com', NOW(), NOW());

-- Insert businesses
INSERT INTO businesses (id, owner_id, category_id, name, slug, description, address, phone, email, created_at, updated_at) VALUES
-- Pitalito Businesses
('18a5f9bd-cdc2-45cc-b95e-6554899996d1', '18a5f9bd-cdc2-45cc-b95e-6554899996e1', 'f4381841-3a1a-46fa-b3b5-93ecb7106e17', 'Salón de Belleza Glamour', 'salon-de-belleza-glamour', 'Salón de belleza completo con servicios de peluquería, manicure y pedicure', 'Calle 5 #10-20, Pitalito, Huila', '3181234567', 'glamour@email.com', NOW(), NOW()),
('18a5f9bd-cdc2-45cc-b95e-6554899996d2', '18a5f9bd-cdc2-45cc-b95e-6554899996e2', 'f4381841-3a1a-46fa-b3b5-93ecb7106e17', 'Centro de Estética Natural', 'centro-de-estetica-natural', 'Centro de estética especializado en tratamientos faciales y corporales', 'Carrera 4 #15-30, Pitalito, Huila', '3182345678', 'natural@email.com', NOW(), NOW()),
('18a5f9bd-cdc2-45cc-b95e-6554899996d3', '18a5f9bd-cdc2-45cc-b95e-6554899996e3', 'b2386e99-6471-425e-ad16-5bc04f572d77', 'Academia de Inglés Global', 'academia-de-ingles-global', 'Academia de inglés con metodología moderna y profesores nativos', 'Calle 8 #12-25, Pitalito, Huila', '3183456789', 'global@email.com', NOW(), NOW()),
('18a5f9bd-cdc2-45cc-b95e-6554899996d4', '18a5f9bd-cdc2-45cc-b95e-6554899996e4', 'b681c017-96ca-4292-9a97-35b9a3a18e50', 'Consultorio Psicológico', 'consultorio-psicologico', 'Servicios de psicología y terapia familiar', 'Carrera 6 #18-40, Pitalito, Huila', '3184567890', 'psico@email.com', NOW(), NOW()),

-- San Agustín Businesses
('18a5f9bd-cdc2-45cc-b95e-6554899996d5', '18a5f9bd-cdc2-45cc-b95e-6554899996e5', 'f4381841-3a1a-46fa-b3b5-93ecb7106e17', 'Spa San Agustín', 'spa-san-agustin', 'Spa completo con masajes y tratamientos relajantes', 'Calle Principal #5-10, San Agustín, Huila', '3185678901', 'spa@email.com', NOW(), NOW()),
('18a5f9bd-cdc2-45cc-b95e-6554899996d6', '18a5f9bd-cdc2-45cc-b95e-6554899996e6', 'b2386e99-6471-425e-ad16-5bc04f572d77', 'Centro de Música Andina', 'centro-de-musica-andina', 'Escuela de música tradicional y contemporánea', 'Carrera 3 #8-15, San Agustín, Huila', '3186789012', 'musica@email.com', NOW(), NOW()),
('18a5f9bd-cdc2-45cc-b95e-6554899996d7', '18a5f9bd-cdc2-45cc-b95e-6554899996e7', 'b681c017-96ca-4292-9a97-35b9a3a18e50', 'Consultorio Dental', 'consultorio-dental', 'Servicios odontológicos completos', 'Calle 4 #10-20, San Agustín, Huila', '3187890123', 'dental@email.com', NOW(), NOW()),
('18a5f9bd-cdc2-45cc-b95e-6554899996d8', '18a5f9bd-cdc2-45cc-b95e-6554899996e8', 'f4381841-3a1a-46fa-b3b5-93ecb7106e17', 'Barbería Clásica', 'barberia-clasica', 'Barbería tradicional con servicios de corte y afeitado', 'Carrera 5 #12-25, San Agustín, Huila', '3188901234', 'barberia@email.com', NOW(), NOW());

-- Insert business configurations with public data disabled
INSERT INTO business_config (business_id, permitir_reservas_online, mostrar_precios, mostrar_telefono, mostrar_email, mostrar_redes_sociales, mostrar_direccion, requiere_confirmacion, tiempo_minimo_cancelacion, notificaciones_email, notificaciones_whatsapp) VALUES
('18a5f9bd-cdc2-45cc-b95e-6554899996d1', true, false, false, false, false, false, true, 24, true, true),
('18a5f9bd-cdc2-45cc-b95e-6554899996d2', true, false, false, false, false, false, true, 24, true, true),
('18a5f9bd-cdc2-45cc-b95e-6554899996d3', true, false, false, false, false, false, true, 24, true, true),
('18a5f9bd-cdc2-45cc-b95e-6554899996d4', true, false, false, false, false, false, true, 24, true, true),
('18a5f9bd-cdc2-45cc-b95e-6554899996d5', true, false, false, false, false, false, true, 24, true, true),
('18a5f9bd-cdc2-45cc-b95e-6554899996d6', true, false, false, false, false, false, true, 24, true, true),
('18a5f9bd-cdc2-45cc-b95e-6554899996d7', true, false, false, false, false, false, true, 24, true, true),
('18a5f9bd-cdc2-45cc-b95e-6554899996d8', true, false, false, false, false, false, true, 24, true, true);

COMMIT; 