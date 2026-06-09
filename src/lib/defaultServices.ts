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
};

export function getDefaultServices(categoryName: string): DefaultService[] {
  const normalized = categoryName.trim().toLowerCase();
  const match = Object.entries(defaultServicesMap).find(
    ([key]) => key.toLowerCase() === normalized
  );
  return match ? match[1] : [];
}

export default defaultServicesMap;
