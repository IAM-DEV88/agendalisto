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
  'Educación': [
    { name: 'Clase particular', duration: 60, description: 'Sesión individual de refuerzo académico' },
    { name: 'Curso intensivo', duration: 120, description: 'Curso de preparación en tiempo reducido' },
    { name: 'Taller grupal', duration: 90, description: 'Taller en grupo con enfoque práctico' },
    { name: 'Asesoría personalizada', duration: 45, description: 'Acompañamiento uno a uno según tus necesidades' },
    { name: 'Clase online', duration: 60, description: 'Sesión virtual desde cualquier lugar' },
  ],
  'Hotelería': [
    { name: 'Habitación estándar', duration: 1440, description: 'Noche de alojamiento con desayuno incluido' },
    { name: 'Habitación ejecutiva', duration: 1440, description: 'Habitación con amenities premium' },
    { name: 'Suite', duration: 1440, description: 'Suite con jacuzzi y sala privada' },
    { name: 'Check-in temprano', duration: 120, description: 'Ingreso anticipado a la habitación' },
    { name: 'Late check-out', duration: 120, description: 'Salida tardía hasta las 6pm' },
  ],
  'Artesanía': [
    { name: 'Taller de cerámica', duration: 120, description: 'Aprende a moldear y pintar cerámica' },
    { name: 'Curso de tejido', duration: 90, description: 'Clase de tejido en telar o crochet' },
    { name: 'Pieza personalizada', duration: 60, description: 'Diseño y elaboración de pieza única' },
    { name: 'Restauración', duration: 120, description: 'Restauración de piezas artesanales dañadas' },
    { name: 'Visita taller', duration: 60, description: 'Recorrido guiado por el taller y proceso creativo' },
  ],
  'Moda': [
    { name: 'Asesoría de imagen', duration: 60, description: 'Diagnóstico de color, estilo y morfología' },
    { name: 'Arreglo de prendas', duration: 45, description: 'Ajuste de largo, ancho o mangas' },
    { name: 'Diseño personalizado', duration: 90, description: 'Creación de prenda a la medida' },
    { name: 'Styling para evento', duration: 120, description: 'Selección de outfit para ocasión especial' },
    { name: 'Closet coaching', duration: 90, description: 'Organización y renovación de guardarropa' },
  ],
  'Fotografía': [
    { name: 'Sesión de retratos', duration: 60, description: 'Sesión fotográfica individual o grupal' },
    { name: 'Sesión de productos', duration: 90, description: 'Fotografía de catálogo para tu negocio' },
    { name: 'Cobertura de evento', duration: 240, description: 'Fotografía de bodas, cumpleaños o eventos' },
    { name: 'Book de modelos', duration: 120, description: 'Sesión profesional con cambio de looks' },
    { name: 'Edición y retoque', duration: 60, description: 'Corrección de color y retoque digital' },
  ],
  'Inmobiliaria': [
    { name: 'Visita a propiedad', duration: 45, description: 'Recorrido guiado por el inmueble' },
    { name: 'Asesoría de compra', duration: 60, description: 'Orientación personalizada para adquirir vivienda' },
    { name: 'Tasación', duration: 60, description: 'Evaluación del valor comercial del inmueble' },
    { name: 'Gestión de arriendo', duration: 30, description: 'Asesoría para arrendar tu propiedad' },
    { name: 'Asesoría legal', duration: 45, description: 'Revisión de contratos y documentación' },
  ],
  'Legal': [
    { name: 'Consulta jurídica', duration: 30, description: 'Primera asesoría sobre tu caso legal' },
    { name: 'Revisión de contrato', duration: 45, description: 'Análisis y recomendaciones sobre documentos legales' },
    { name: 'Trámite notarial', duration: 30, description: 'Gestión de poderes, escrituras o declaraciones' },
    { name: 'Representación legal', duration: 60, description: 'Sesión para preparación de defensa o demanda' },
    { name: 'Asesoría laboral', duration: 45, description: 'Consultoría en derecho laboral y seguridad social' },
  ],
  'Finanzas': [
    { name: 'Asesoría financiera', duration: 60, description: 'Planificación de finanzas personales o empresariales' },
    { name: 'Declaración de renta', duration: 90, description: 'Preparación y presentación de declaración de impuestos' },
    { name: 'Contabilidad mensual', duration: 60, description: 'Revisión de libros contables y conciliación' },
    { name: 'Evaluación de crédito', duration: 45, description: 'Análisis de perfil crediticio y opciones de financiamiento' },
    { name: 'Presupuesto empresarial', duration: 60, description: 'Elaboración de presupuesto y proyecciones' },
  ],
  'Entretenimiento': [
    { name: 'Entrada general', duration: 180, description: 'Acceso al evento con cupo limitado' },
    { name: 'Reserva VIP', duration: 240, description: 'Mesa preferencial con atención personalizada' },
    { name: 'Alquiler de equipo', duration: 120, description: 'Préstamo de equipos de gaming o realidad virtual' },
    { name: 'Evento privado', duration: 240, description: 'Reserva exclusiva para cumpleaños o celebraciones' },
    { name: 'Clase de baile', duration: 60, description: 'Sesión grupal de baile o ritmos latinos' },
  ],
  'Profesionales': [
    { name: 'Consulta inicial', duration: 30, description: 'Primera reunión para conocer tus necesidades' },
    { name: 'Asesoría especializada', duration: 60, description: 'Atención profesional adaptada a tu caso' },
    { name: 'Sesión de seguimiento', duration: 30, description: 'Revisión de avances y ajustes' },
    { name: 'Cotización sin costo', duration: 20, description: 'Evaluación y presupuesto detallado' },
    { name: 'Consulta virtual', duration: 30, description: 'Atención remota por videollamada' },
  ],
  'Turismo': [
    { name: 'City tour', duration: 180, description: 'Recorrido guiado por los principales atractivos de la ciudad' },
    { name: 'Paquete turístico', duration: 480, description: 'Plan completo con transporte, guía y alimentación' },
    { name: 'Aventura extremo', duration: 240, description: 'Actividades de turismo de aventura con equipo incluido' },
    { name: 'Tour gastronómico', duration: 180, description: 'Recorrido por los mejores sabores locales' },
    { name: 'Asesoría de viaje', duration: 60, description: 'Planificación personalizada de tu próxima aventura' },
  ],
  'Diseño': [
    { name: 'Diseño de logo', duration: 120, description: 'Creación de identidad visual y logotipo profesional' },
    { name: 'Branding completo', duration: 240, description: 'Manual de marca completo con tipografía, colores y aplicaciones' },
    { name: 'Diseño de redes', duration: 60, description: 'Creación de piezas gráficas para redes sociales' },
    { name: 'Edición de video', duration: 120, description: 'Edición y postproducción de material audiovisual' },
    { name: 'Asesoría creativa', duration: 60, description: 'Consultoría de imagen y estrategia visual' },
  ],
  'Jardinería': [
    { name: 'Diseño de jardín', duration: 120, description: 'Planificación y diseño de espacios verdes' },
    { name: 'Mantenimiento mensual', duration: 120, description: 'Corte, poda y limpieza general de jardín' },
    { name: 'Poda de árboles', duration: 60, description: 'Poda formativa y de mantenimiento de árboles' },
    { name: 'Siembra y trasplante', duration: 90, description: 'Siembra de plantas ornamentales y árboles frutales' },
    { name: 'Sistema de riego', duration: 120, description: 'Instalación de riego por goteo o aspersión' },
  ],
  'Música': [
    { name: 'Clase de instrumento', duration: 60, description: 'Clase personalizada de guitarra, piano, batería o canto' },
    { name: 'Presentación en vivo', duration: 120, description: 'Show musical para eventos privados y empresariales' },
    { name: 'Afina tu instrumento', duration: 30, description: 'Afinación y mantenimiento básico de instrumentos' },
    { name: 'Producción musical', duration: 120, description: 'Grabación, mezcla y masterización de audio' },
    { name: 'Clase grupal', duration: 90, description: 'Taller musical en grupo para todas las edades' },
  ],
  'Cuidado Infantil': [
    { name: 'Jornada de cuidado', duration: 240, description: 'Cuidado temporal de niños con actividades lúdicas' },
    { name: 'Clase de estimulación', duration: 60, description: 'Actividades de estimulación temprana para bebés' },
    { name: 'Taller infantil', duration: 90, description: 'Taller recreativo de pintura, música o manualidades' },
    { name: 'Apoyo escolar', duration: 60, description: 'Acompañamiento en tareas y refuerzo académico' },
    { name: 'Fiesta infantil', duration: 180, description: 'Animación y entretenimiento para cumpleaños infantiles' },
  ],
};

const FALLBACK_SERVICES: DefaultService[] = [
  { name: 'Consulta inicial', duration: 30, description: 'Primera reunión para conocer tus necesidades' },
  { name: 'Asesoría personalizada', duration: 60, description: 'Atención uno a uno adaptada a tu caso' },
  { name: 'Sesión de seguimiento', duration: 30, description: 'Revisión de avances y ajustes' },
  { name: 'Cotización sin costo', duration: 20, description: 'Evaluación y presupuesto detallado' },
  { name: 'Consulta virtual', duration: 30, description: 'Atención remota por videollamada' },
];

export function getDefaultServices(categoryName: string): DefaultService[] {
  const normalized = categoryName.trim().toLowerCase();
  const match = Object.entries(defaultServicesMap).find(
    ([key]) => key.toLowerCase() === normalized
  );
  return match ? match[1] : FALLBACK_SERVICES;
}

export default defaultServicesMap;
