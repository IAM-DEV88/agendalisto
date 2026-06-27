export interface DefaultService {
  name: string;
  duration: number;
  description: string;
}

const defaultServicesMap: Record<string, DefaultService[]> = {
  'Belleza': [
    { name: 'Corte de cabello', duration: 30, description: 'Corte clásico o moderno según tu preferencia' },
    { name: 'Barba y bigote', duration: 20, description: 'Arreglo y perfilado de barba' },
    { name: 'Corte + barba', duration: 45, description: 'Combo corte de cabello y arreglo de barba' },
    { name: 'Tinte', duration: 60, description: 'Aplicación de tinte para cabello' },
    { name: 'Cepillado', duration: 30, description: 'Cepillado con plancha o secador' },
  ],
  'Salud': [
    { name: 'Consulta general', duration: 30, description: 'Consulta médica general' },
    { name: 'Limpieza dental', duration: 45, description: 'Profilaxis y remoción de sarro' },
    { name: 'Blanqueamiento', duration: 60, description: 'Blanqueamiento dental profesional' },
    { name: 'Evaluación', duration: 30, description: 'Evaluación inicial' },
    { name: 'Control', duration: 20, description: 'Consulta de seguimiento' },
  ],
  'Fitness': [
    { name: 'Entrenamiento personal', duration: 60, description: 'Sesión uno a uno con entrenador' },
    { name: 'Clase grupal', duration: 45, description: 'Clase en grupo' },
    { name: 'Evaluación física', duration: 30, description: 'Evaluación inicial de condición física' },
    { name: 'Planes de entrenamiento', duration: 30, description: 'Diseño de plan personalizado' },
  ],
  'Bienestar': [
    { name: 'Masaje relajante', duration: 60, description: 'Masaje corporal completo' },
    { name: 'Limpieza facial', duration: 45, description: 'Limpieza profunda del rostro' },
    { name: 'Manicure', duration: 40, description: 'Manicure completo' },
    { name: 'Pedicure', duration: 45, description: 'Pedicure completo' },
    { name: 'Cera', duration: 30, description: 'Depilación con cera' },
  ],
  'Mecánica': [
    { name: 'Cambio de aceite', duration: 30, description: 'Cambio de aceite y filtro' },
    { name: 'Alineación y balanceo', duration: 45, description: 'Alineación y balanceo de llantas' },
    { name: 'Revisión general', duration: 60, description: 'Revisión completa del vehículo' },
    { name: 'Frenos', duration: 60, description: 'Revisión y cambio de frenos' },
    { name: 'Scanner', duration: 30, description: 'Diagnóstico electrónico' },
  ],
  'Alimentación': [
    { name: 'Desayuno', duration: 60, description: 'Servicio de desayuno' },
    { name: 'Almuerzo ejecutivo', duration: 60, description: 'Almuerzo del día' },
    { name: 'Cena', duration: 90, description: 'Servicio de cena' },
    { name: 'Reserva de grupo', duration: 120, description: 'Reserva para grupos' },
  ],
  'Psicología': [
    { name: 'Consulta presencial', duration: 50, description: 'Sesión de terapia presencial' },
    { name: 'Consulta virtual', duration: 50, description: 'Sesión por videollamada' },
    { name: 'Evaluación inicial', duration: 60, description: 'Primera sesión de evaluación' },
    { name: 'Terapia de pareja', duration: 60, description: 'Sesión de terapia de pareja' },
  ],
  'Veterinaria': [
    { name: 'Consulta general', duration: 30, description: 'Revisión general de tu mascota' },
    { name: 'Vacunación', duration: 20, description: 'Aplicación de vacunas' },
    { name: 'Baño y estética', duration: 45, description: 'Baño y arreglo estético' },
    { name: 'Cirugía menor', duration: 60, description: 'Procedimiento quirúrgico menor' },
    { name: 'Urgencias', duration: 45, description: 'Atención de urgencia' },
  ],
  'Restaurantes': [
    { name: 'Almuerzo ejecutivo', duration: 60, description: 'Menú del día con entrada y plato fuerte' },
    { name: 'Cena', duration: 90, description: 'Cena completa con postre incluido' },
    { name: 'Reserva de grupo', duration: 120, description: 'Mesa para grupos de 4 o más personas' },
    { name: 'Desayuno', duration: 45, description: 'Desayuno tradicional o ejecutivo' },
    { name: 'Menú degustación', duration: 120, description: 'Experiencia de varios tiempos con maridaje' },
  ],
  'Bar': [
    { name: 'Reserva de mesa', duration: 120, description: 'Mesa con consumo libre durante tu visita' },
    { name: 'Cocktail de la casa', duration: 30, description: 'Preparación y degustación de cóctel exclusivo' },
    { name: 'Barra VIP', duration: 60, description: 'Acceso prioritario a barra con atención personalizada' },
    { name: 'Evento privado', duration: 180, description: 'Reserva de espacio para eventos y celebraciones' },
    { name: 'Zona de fumadores', duration: 60, description: 'Acceso a terraza o zona habilitada para fumar' },
  ],
  'Cafetería': [
    { name: 'Café de especialidad', duration: 30, description: 'Café preparado con granos seleccionados' },
    { name: 'Postre artesanal', duration: 30, description: 'Postre del día elaborado artesanalmente' },
    { name: 'Brunch', duration: 90, description: 'Brunch completo con café, jugo y plato dulce/salado' },
    { name: 'Degustación', duration: 60, description: 'Cata de cafés de diferentes orígenes' },
    { name: 'Desayuno', duration: 45, description: 'Desayuno completo con bebida caliente' },
  ],
  'Estanco': [
    { name: 'Pedido especial', duration: 15, description: 'Solicitud de productos específicos no disponibles en mostrador' },
    { name: 'Apartado de lotería', duration: 10, description: 'Reserva de billetes de lotería y chances' },
    { name: 'Recarga virtual', duration: 5, description: 'Recarga de celular o servicios prepago' },
    { name: 'Pedido al por mayor', duration: 20, description: 'Cotización y pedido de productos por volumen' },
    { name: 'Asesoría de productos', duration: 15, description: 'Información y recomendación de productos disponibles' },
  ],
  'Tecnología': [
    { name: 'Diagnóstico y revisión', duration: 30, description: 'Revisión general del equipo e identificación de fallas' },
    { name: 'Reparación de computador', duration: 60, description: 'Reparación de hardware o software de escritorio/portátil' },
    { name: 'Instalación de software', duration: 30, description: 'Instalación de programas, drivers o sistemas operativos' },
    { name: 'Limpieza y mantenimiento', duration: 45, description: 'Limpieza interna, cambio de pasta térmica y optimización' },
    { name: 'Asesoría técnica', duration: 30, description: 'Consultoría sobre equipos, componentes y soluciones tecnológicas' },
  ],
  'Limpieza': [
    { name: 'Limpieza general hogar', duration: 120, description: 'Aseo completo de apartamento o casa pequeña' },
    { name: 'Limpieza de oficina', duration: 180, description: 'Limpieza profesional de espacios corporativos' },
    { name: 'Limpieza profunda', duration: 240, description: 'Limpieza exhaustiva incluyendo rincones y áreas difíciles' },
    { name: 'Lavado de vidrios', duration: 60, description: 'Lavado de ventanas, espejos y superficies de vidrio' },
    { name: 'Desinfección', duration: 60, description: 'Desinfección de superficies con productos certificados' },
  ],
  'Construcción': [
    { name: 'Cotización y visita', duration: 30, description: 'Visita técnica para evaluar el trabajo y generar presupuesto' },
    { name: 'Reparación eléctrica', duration: 60, description: 'Diagnóstico y reparación de instalaciones eléctricas' },
    { name: 'Reparación de plomería', duration: 60, description: 'Reparación de tuberías, grifería y sanitarios' },
    { name: 'Pintura y acabados', duration: 120, description: 'Pintura de interiores con materiales de calidad' },
    { name: 'Mantenimiento general', duration: 60, description: 'Mantenimiento preventivo de instalaciones del hogar' },
  ],
  'Transporte': [
    { name: 'Mudanza local', duration: 180, description: 'Mudanza dentro de la misma ciudad con carga y descarga' },
    { name: 'Flete pequeño', duration: 60, description: 'Transporte de enseres menores o paquetes' },
    { name: 'Mensajería exprés', duration: 30, description: 'Envío urgente de documentos o paquetes pequeños' },
    { name: 'Traslado ejecutivo', duration: 60, description: 'Transporte privado con conductor profesional' },
    { name: 'Alquiler con conductor', duration: 240, description: 'Vehículo con conductor por horas o jornada completa' },
  ],
};

export function getDefaultServices(categoryName: string): DefaultService[] {
  const normalized = categoryName.trim().toLowerCase();
  const match = Object.entries(defaultServicesMap).find(
    ([key]) => key.toLowerCase() === normalized
  );
  return match ? match[1] : [];
}

export default defaultServicesMap;
