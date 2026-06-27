export interface FAQItem {
  q: string;
  a: string;
}

export interface Testimonial {
  business: string;
  category: string;
  avatar: string;
  achievement: string;
  quote: string;
}

export interface FAQCategoryContent {
  icon: string;
  questions: FAQItem[];
}

export function buildCategoryQuestions(name: string): FAQItem[] {
  const key = name.toLowerCase().trim();
  const map: Record<string, FAQItem[]> = {
    belleza: [
      {
        q: '¿Por qué necesito AgendaYa si mis clientes ya me escriben por WhatsApp?',
        a: 'WhatsApp requiere que contestes uno por uno. Si estás atendiendo, pierdes llamadas. AgendaYa permite que tus clientes vean horarios disponibles y reserven al instante, sin esperar tu respuesta. Además, los recordatorios automáticos reducen las cancelaciones de último minuto hasta un 40%.',
      },
      {
        q: 'Tengo clientes fieles que vienen sin cita desde hace años. ¿Para qué cambiar?',
        a: 'El 68% de los clientes prefiere reservar online a llamar. Si no ofreces esa opción, ellos buscarán otro negocio que sí lo haga. AgendaYa no reemplaza la atención presencial — la complementa. Tus clientes fieles pueden seguir viniendo como siempre, pero los nuevos prefieren reservar desde el celular.',
      },
      {
        q: '¿Es complicado configurar mis horarios y servicios?',
        a: 'En menos de 5 minutos tienes todo listo. Escribes los servicios que ofreces (ej: Corte, Barba, Tinte), pones su duración y precio, defines tu horario semanal, y ya estás recibiendo reservas. No necesitas conocimientos técnicos.',
      },
      {
        q: '¿Cuánto me cuesta? ¿Hay un plan gratuito?',
        a: 'Sí, el plan Starter es completamente gratis. Incluye perfil público, gestión de citas y notificaciones por email. Cuando quieras crecer, los planes Pro y Premium te dan WhatsApp, analytics y prioridad en búsquedas desde $49.900/mes.',
      },
      {
        q: '¿Qué pasa si no tengo página web?',
        a: 'No la necesitas. Cada negocio en AgendaYa tiene su propia página pública con tu logo, servicios, horarios, reseñas y ubicación. Tus clientes te encuentran por la URL personalizada (agendalisto.com/tu-negocio) y desde el buscador de AgendaYa.',
      },
    ],
    salud: [
      {
        q: 'Manejo historias clínicas de mis pacientes. ¿AgendaYa es compatible?',
        a: 'AgendaYa se enfoca en la gestión de citas y recordatorios, no reemplaza tu historia clínica. La mayoría de nuestros clientes de salud lo usan en paralelo: AgendaYa para reservas y recordatorios, su sistema para expedientes. La integración reduce un 60% las llamadas telefónicas.',
      },
      {
        q: 'Mis pacientes son mayores y no usan tecnología. ¿Van a reservar online?',
        a: 'No todos, pero cada vez más. El 45% de los pacientes mayores de 55 años ya reserva citas médicas online. Y los que prefieren llamar, pueden seguir haciéndolo. AgendaYa no obliga — ofrece un canal adicional que descongestiona tu teléfono.',
      },
      {
        q: '¿Cómo maneja las cancelaciones y reprogramaciones?',
        a: 'El cliente puede cancelar o reprogramar desde el enlace que recibe en su confirmación. Tú defines con cuántas horas de antelación pueden hacerlo. Las cancelaciones de última hora se reducen porque AgendaYa envía recordatorios automáticos 24 h y 1 h antes.',
      },
      {
        q: '¿Puedo tener varios profesionales en mi consultorio?',
        a: 'Sí, el plan Premium te permite gestionar hasta 3 negocios (o sedes) con una sola cuenta. Cada profesional puede tener sus propios servicios y horarios, y los clientes reservan directamente con quien prefieran.',
      },
      {
        q: '¿Ofrecen integración con pagos?',
        a: 'Sí, aceptamos pagos con PayPal y Wompi (Colombia). Puedes requerir un porcentaje del servicio al reservar para reducir las inasistencias, o cobrar el valor completo por adelantado. Tú eliges.',
      },
    ],
    fitness: [
      {
        q: 'Mis clases siempre se llenan. ¿Para qué necesito una plataforma?',
        a: 'Justamente porque se llenan, necesitas control. Con AgendaYa, cada clase tiene un cupo máximo. Cuando se alcanza, el sistema deja de aceptar reservas y crea una lista de espera automática. Si alguien cancela, el siguiente en la lista es notificado al instante.',
      },
      {
        q: '¿Puedo vender planes de entrenamiento o membresías?',
        a: 'Sí, puedes listar planes de entrenamiento, evaluaciones físicas, consultas nutricionales y clases grupales como servicios individuales. Cada uno con su duración, precio y requisitos. Tus clientes los ven y reservan directamente.',
      },
      {
        q: '¿Sirve para coaching online o solo presencial?',
        a: 'Para ambos. AgendaYa no distingue si tu servicio es presencial o virtual — solo gestiona la reserva. El cliente agenda su sesión online y recibe los datos de conexión (Zoom, Meet, etc.) si los incluyes en la descripción del servicio o los compartes después.',
      },
      {
        q: '¿Qué pasa si un cliente no se presenta?',
        a: 'Con los recordatorios automáticos (email y próximamente WhatsApp), las inasistencias se reducen drásticamente. Si aún así alguien falla, puedes requerir un pago parcial por adelantado con el plan Pro o Premium, protegiendo tu tiempo.',
      },
    ],
    bienestar: [
      {
        q: '¿Cómo manejo reservas de último minuto?',
        a: 'AgendaYa muestra en tiempo real qué horarios están disponibles. Si cancelan, el espacio se libera al instante y otros clientes pueden reservarlo. Tú no tienes que hacer nada — el sistema se actualiza solo.',
      },
      {
        q: 'Trabajo con bonos de regalo. ¿AgendaYa los soporta?',
        a: 'Sí, AgendaYa tiene un sistema de códigos de regalo. Tus clientes compran un bono por un servicio específico, lo reciben por correo para regalar, y quien lo recibe lo canjea al reservar. Ideal para spas y centros de bienestar.',
      },
      {
        q: '¿Puedo mostrar los precios o prefiero ocultarlos?',
        a: 'Tú decides. En la configuración de tu negocio puedes activar o desactivar "mostrar precios". Si los ocultas, los clientes ven los servicios y reservan, pero conocen el precio hasta que confirman o al llegar.',
      },
      {
        q: '¿Qué visibilidad tiene mi negocio en la plataforma?',
        a: 'Tu negocio aparece en el buscador de AgendaYa ordenado por plan (Premium primero, luego Pro, después Starter). Además, cada negocio tiene su página pública con URL personalizada. Los clientes te encuentran buscando por categoría, ciudad o nombre.',
      },
    ],
    mecánica: [
      {
        q: 'Mi taller siempre está lleno. ¿Para qué necesito AgendaYa?',
        a: 'Tener el taller lleno no significa que estés optimizado. Con AgendaYa eliminas las "ventanitas" de clientes que llegan sin cita y saturan el flujo. Programa cada servicio con su duración exacta (cambio de aceite 30 min, frenos 60 min) y distribuye mejor tu jornada.',
      },
      {
        q: 'Mis clientes son conductores, no usuarios de apps. ¿Van a reservar online?',
        a: 'Los conductores usan Waze, Uber y MercadoLibre a diario. Reservar un servicio de taller online es natural para ellos. Además, desde la página de tu taller pueden ver los servicios disponibles con precios y duración, sin tener que llamar a preguntar.',
      },
      {
        q: '¿Manejan presupuestos o solo servicios fijos?',
        a: 'Puedes listar servicios con precio fijo (cambio de aceite, alineación, scanner) y dejar los trabajos más complejos para presupuestar por separado. AgendaYa es flexible — tú decides qué servicios publicas con precio y cuáles requieren contacto directo.',
      },
      {
        q: '¿Qué pasa si un servicio toma más tiempo del estimado?',
        a: 'AgendaYa bloquea ese horario para otros clientes, dándote tiempo para terminar sin presión. Si necesitas ajustar, puedes modificar la duración del servicio desde el panel. El sistema no programa citas en horarios ocupados.',
      },
    ],
    alimentación: [
      {
        q: 'Tengo restaurante, no necesito reservas porque trabajo con mesas libres. ¿Me sirve?',
        a: 'Si aceptas reservas, AgendaYa te ayuda a llenar el restaurante en horas valle permitiendo a los clientes apartar mesa. Muchos restaurantes ofrecen descuentos por reservar en horarios tranquilos. Además, puedes usar la plataforma para eventos privados o cenas especiales con cupo limitado.',
      },
      {
        q: '¿Puedo limitar las reservas por horario o capacidad?',
        a: 'Sí. Defines el aforo por turno y el sistema no acepta más reservas una vez alcanzado el límite. Ideal para cenas temáticas, menús degustación o cualquier evento con cupo restringido.',
      },
      {
        q: '¿Ofrecen algo para promocionar mi restaurante?',
        a: 'Los planes Pro y Premium mejoran tu posición en el buscador de AgendaYa, dándote más visibilidad frente a clientes que buscan dónde comer. También puedes compartir tu página pública en redes sociales para que los clientes reserven directo.',
      },
    ],
    psicología: [
      {
        q: 'Mis pacientes son recurrentes y tenemos horarios fijos. ¿Necesito AgendaYa?',
        a: 'AgendaYa simplifica la gestión aunque sean pacientes fijos. Ellos reciben recordatorios automáticos y pueden reagendar desde el enlace si necesitan cambiar la cita, sin llamarte. Tú liberas tiempo administrativo y lo dedicas a tu práctica.',
      },
      {
        q: '¿Sirve para sesiones virtuales?',
        a: 'Completamente. AgendaYa no requiere que el servicio sea presencial. Publicas tu servicio de "consulta virtual" con la duración de 50 minutos, el paciente reserva, y tú le envías el enlace de videollamada por separado o lo incluyes en las notas de la cita.',
      },
      {
        q: '¿Manejan confidencialidad de datos?',
        a: 'AgendaYa almacena solo datos básicos de contacto (nombre, email, teléfono). No compartimos información con terceros ni almacenamos notas de sesiones clínicas. La plataforma usa HTTPS y cumple con estándares de seguridad para datos personales.',
      },
      {
        q: '¿Puedo ofrecer paquetes de sesiones?',
        a: 'Actualmente los servicios son individuales, pero puedes crear un "Paquete de 4 sesiones" como un servicio con precio especial y el paciente reserva cada sesión por separado. Es una solución práctica mientras incorporamos suscripciones.',
      },
    ],
    veterinaria: [
      {
        q: '¿Sirve para citas de mascotas? ¿El dueño reserva a nombre de la mascota?',
        a: 'Sí, el dueño reserva con su cuenta y en las notas de la cita puede indicar el nombre y datos de la mascota. Tú ves toda la información desde el panel. Muchas clínicas veterinarias en AgendaYa lo usan así y funciona perfectamente.',
      },
      {
        q: '¿Manejan servicios de urgencia?',
        a: 'Puedes crear un servicio de "urgencia" con un horario específico o dejarlo como servicio siempre disponible. Los clientes ven los horarios disponibles y reservan. Para urgencias reales, recomendamos mantener el teléfono como canal principal y usar AgendaYa para consultas programadas.',
      },
      {
        q: '¿Puedo tener diferentes veterinarios con horarios distintos?',
        a: 'Sí, con el plan Premium puedes gestionar hasta 3 negocios (o sedes). Para múltiples veterinarios en una misma sede, cada uno puede tener servicios y horarios personalizados, y los dueños reservan con el profesional que prefieran.',
      },
      {
        q: '¿Incluye recordatorios de vacunas o citas de seguimiento?',
        a: 'AgendaYa envía recordatorios automáticos de las citas programadas. Para seguimientos a largo plazo (vacunas anuales, desparasitaciones), puedes crear servicios específicos y los dueños reservan cuando les corresponda. El sistema no reemplaza un historial médico especializado.',
      },
    ],
    restaurantes: [
      {
        q: 'Trabajo por mesas, no por servicios. ¿Cómo uso AgendaYa en mi restaurante?',
        a: 'Puedes crear servicios como "Mesa para 2", "Mesa para 4" o "Menú degustación" con la duración promedio de la experiencia. Los clientes reservan el turno, y tú controlas el aforo limitando la disponibilidad por horario. Ideal para evitar saturación en horas pico.',
      },
      {
        q: '¿Puedo ofrecer descuentos por reservar en horas valle?',
        a: 'Sí, puedes crear servicios específicos con precios reducidos para horarios de baja demanda (ej: "Almuerzo ejecutivo antes de las 12:30"). Los clientes ven el precio al reservar y eso incentiva la ocupación en horas tranquilas.',
      },
      {
        q: '¿Cómo manejo las reservas de grupos grandes?',
        a: 'Crea un servicio de "Evento privado" o "Grupo grande" con duración extendida y requisito de pago por adelantado (disponible en planes Pro y Premium). Así filtras reservas serias y evitas no shows que afectan tu operación.',
      },
      {
        q: '¿Puedo mostrar mi menú y precios en la página pública?',
        a: 'Cada servicio que crees se muestra con nombre, descripción, duración y precio. Tus clientes ven el menú completo al explorar tu página pública y reservan con toda la información, sin necesidad de llamar para preguntar precios.',
      },
    ],
    bar: [
      {
        q: 'Tengo bar y trabajo con consumo en sitio, no con servicios. ¿Me sirve?',
        a: 'AgendaYa te permite crear servicios como "Reserva de mesa", "Barra VIP" o "Mesa con consumo" para gestionar el aforo. Especialmente útil para fines de semana o eventos especiales donde el espacio es limitado y quieres evitar aglomeraciones.',
      },
      {
        q: '¿Puedo cobrar una entrada o consumo mínimo al reservar?',
        a: 'Sí, con los planes Pro y Premium puedes requerir un pago por adelantado (porcentaje o valor fijo). Ideal para cobrar consumo mínimo en mesa VIP o entrada a eventos nocturnos, reduciendo cancelaciones de último momento.',
      },
      {
        q: '¿Sirve para promocionar eventos de música en vivo o fiestas?',
        a: 'Completamente. Crea servicios especiales para cada evento con fecha, horario y precio de entrada. Los clientes ven la disponibilidad y reservan su cupo. Además, compartes tu página pública en redes para promocionar cada evento.',
      },
      {
        q: '¿Cómo evito que se llene demasiado el local?',
        a: 'Define cupo máximo por servicio o por horario. Cuando se alcanza el límite, el sistema deja de aceptar reservas automáticamente y crea lista de espera. Controlas el aforo sin tener que estar pendiente del teléfono.',
      },
    ],
    cafeteria: [
      {
        q: 'Soy una cafetería pequeña y mis clientes vienen sin reserva. ¿Necesito AgendaYa?',
        a: 'AgendaYa te ayuda a fidelizar clientes ofreciendo reservas para brunch de fin de semana, degustaciones de café o eventos especiales. Además, tu página pública funciona como carta digital disponible 24/7 para que te descubran nuevos clientes.',
      },
      {
        q: '¿Puedo vender bonos de café o tarjetas de regalo?',
        a: 'Sí, AgendaYa tiene un sistema de códigos de regalo. Tus clientes compran un bono por un servicio específico (ej: "Café de especialidad + postre"), lo reciben por correo para regalar, y quien lo recibe lo canjea al reservar.',
      },
      {
        q: '¿Manejan reservas para degustaciones o catas de café?',
        a: 'Crea servicios como "Cata de café" o "Degustación de origen" con duración definida y cupo máximo. Los clientes reservan su lugar y tú preparas la experiencia sabiendo exactamente cuántos asistentes tendrás.',
      },
      {
        q: '¿Puedo ofrecer domicilios o pickup a través de la plataforma?',
        a: 'Aunque AgendaYa está enfocado en reservas de experiencias, puedes crear servicios de "Pedido para llevar" con horarios disponibles y los clientes reservan su ventana de recogida. Es una solución práctica mientras evaluamos domicilios.',
      },
    ],
    estanco: [
      {
        q: 'Soy estanco y no trabajo con citas. ¿Cómo uso AgendaYa?',
        a: 'AgendaYa te permite ofrecer servicios como "Apartado de lotería", "Pedido especial" o "Recarga virtual". Tus clientes pueden solicitar productos específicos, apartar su lotería favorita o hacer pedidos al por mayor desde la página, sin tener que ir al local.',
      },
      {
        q: '¿Puedo promocionar promociones y nuevos productos?',
        a: 'Cada servicio en tu página pública funciona como vitrina digital. Puedes publicar promociones temporales, nuevos productos o lotería especial, y tus clientes lo ven al instante. Además, compartes tu página en redes sociales.',
      },
      {
        q: '¿Sirve para gestionar pedidos al por mayor?',
        a: 'Crea un servicio de "Pedido al por mayor" donde los clientes reservan una ventana de atención y especifican su pedido en las notas de la reserva. Tú preparas el pedido y ellos pasan a recogerlo en el horario acordado.',
      },
      {
        q: '¿Qué ventajas tiene tener mi estanco en AgendaYa?',
        a: 'Tener presencia digital aunque tu negocio sea tradicional. Los clientes te encuentran en el buscador de AgendaYa, ven tus productos y servicios, y pueden contactarte directamente. Es una vitrina adicional sin costo con el plan Starter.',
      },
    ],
    tecnologia: [
      {
        q: 'Reparo computadores. ¿Cómo gestiono las citas con AgendaYa?',
        a: 'Crea servicios como "Diagnóstico", "Reparación" y "Mantenimiento" con la duración estimada de cada uno. Los clientes reservan su hora, traen el equipo, y tú organizas tu día sabiendo exactamente qué trabajos te esperan.',
      },
      {
        q: '¿Puedo atender presupuestos sin costo y cobrar solo las reparaciones?',
        a: 'Sí, crea un servicio de "Diagnóstico y presupuesto" con duración de 30 minutos y precio $0. El cliente agenda la revisión, identificas la falla, y luego puedes crear una cotización personalizada para la reparación.',
      },
      {
        q: 'A veces un trabajo toma más tiempo del estimado. ¿Cómo manejo eso?',
        a: 'AgendaYa bloquea el horario del servicio para otros clientes. Si necesitas más tiempo, puedes ajustar la duración desde el panel. Entre diagnósticos cortos y reparaciones largas, distribuye tu jornada sin presiones.',
      },
      {
        q: '¿Puedo ofrecer soporte técnico remoto o virtual?',
        a: 'Completamente. AgendaYa no distingue entre presencial y virtual. Publica un servicio de "Soporte remoto" con la duración que necesites. El cliente reserva y tú le envías el enlace de conexión remota (TeamViewer, AnyDesk, etc.) por separado.',
      },
    ],
    limpieza: [
      {
        q: 'Mis servicios de limpieza varían según el tamaño del hogar. ¿Cómo los publico?',
        a: 'Crea diferentes servicios según el tipo de inmueble: "Limpieza apartamento pequeño", "Limpieza casa grande", "Limpieza oficina". Cada uno con su duración y precio específicos. Los clientes eligen el que mejor se ajusta a sus necesidades.',
      },
      {
        q: '¿Cómo manejo la disponibilidad si trabajo con varios clientes al día?',
        a: 'AgendaYa bloquea automáticamente los horarios ocupados. Si una limpieza toma 3 horas, ese bloque queda reservado y no recibes solicitudes que se traslapen. Ideal para organizar jornadas completas sin agendar de más.',
      },
      {
        q: '¿Puedo requerir un pago por adelantado para asegurar la cita?',
        a: 'Sí, con los planes Pro y Premium puedes configurar un porcentaje de pago anticipado. Así evitas que los clientes reserven y no se presenten, especialmente en servicios de limpieza profunda o mudanzas donde preparas insumos.',
      },
      {
        q: '¿Ofrecen algo para promocionar mis servicios de limpieza?',
        a: 'Los planes Pro y Premium mejoran tu posición en el buscador de AgendaYa, dándote más visibilidad frente a clientes que buscan servicios de limpieza. Tu página pública también sirve como carta de presentación profesional.',
      },
    ],
    construccion: [
      {
        q: 'Trabajo por proyectos, no por hora. ¿AgendaYa es para mí?',
        a: 'AgendaYa es perfecto para la primera visita: crea un servicio de "Cotización y visita" de 30 minutos, el cliente agenda, vas al lugar, evalúas el trabajo y generas el presupuesto. Una vez aceptado, coordinas el resto por fuera.',
      },
      {
        q: '¿Puedo ofrecer mantenimientos preventivos programados?',
        a: 'Crea servicios de "Mantenimiento general", "Revisión eléctrica" o "Revisión de plomería". Los clientes agendan revisiones periódicas y reciben recordatorios automáticos para no olvidar el mantenimiento de su hogar.',
      },
      {
        q: '¿Cómo manejo servicios de emergencia como reparaciones urgentes?',
        a: 'Puedes habilitar servicios de "Urgencia eléctrica" o "Urgencia de plomería" con disponibilidad inmediata. Los clientes que necesitan ayuda urgente ven los horarios libres más próximos y reservan al instante, sin llamar.',
      },
      {
        q: '¿Puedo tener varios oficios registrados (eléctrico, plomería, pintura)?',
        a: 'Sí, cada servicio es independiente. Puedes tener "Reparación eléctrica", "Plomería" y "Pintura" como servicios distintos con sus propios precios y duraciones. Los clientes reservan el que necesitan según su urgencia.',
      },
    ],
    transporte: [
      {
        q: 'Hago mudanzas y fletes. ¿Cómo publico mis servicios?',
        a: 'Crea servicios por tipo de trabajo: "Mudanza local" (3 horas), "Flete pequeño" (1 hora), "Mensajería exprés" (30 min). Cada servicio con su precio y duración. Los clientes ven la disponibilidad y reservan el servicio que necesitan.',
      },
      {
        q: '¿Cómo manejo la disponibilidad si tengo varios vehículos?',
        a: 'Con el plan Premium puedes gestionar hasta 3 negocios (o flotas). Para múltiples vehículos en una sola cuenta, define servicios con duraciones y horarios que reflejen tu capacidad operativa. El sistema evita reservas duplicadas.',
      },
      {
        q: '¿Puedo cotizar un servicio antes de que el cliente reserve?',
        a: 'Crea un servicio de "Cotización y visita" sin costo. El cliente agenda una breve reunión para evaluar la mudanza o flete, y luego le generas el presupuesto final. Así evitas comprometerte sin conocer el volumen de carga.',
      },
      {
        q: '¿Sirve para transporte ejecutivo o de pasajeros?',
        a: 'Perfectamente. Publica servicios de "Traslado ejecutivo", "Alquiler con conductor por hora" o "Transporte aeropuerto". Los clientes reservan con anticipación y reciben confirmación con todos los detalles del servicio.',
      },
    ],
  };

  return map[key] || [
    {
      q: `¿Por qué mi negocio de ${name.toLowerCase()} necesita AgendaYa?`,
      a: 'AgendaYa automatiza todo el proceso de reservas: tus clientes ven disponibilidad en tiempo real, eligen el servicio, reservan y reciben recordatorios automáticos. Tú te ahorras llamadas, reduces cancelaciones y ofreces una experiencia profesional 24/7.',
    },
    {
      q: '¿Es fácil de configurar?',
      a: 'Sí. En menos de 5 minutos creas tu perfil, agregas tus servicios con duración y precio, defines tu horario, y ya puedes recibir reservas. No necesitas página web ni conocimientos técnicos.',
    },
    {
      q: '¿Cuánto cuesta?',
      a: 'El plan Starter es completamente gratis e incluye todo lo que necesitas para empezar: perfil público, gestión de citas y recordatorios. Los planes Pro ($49.900/mes) y Premium ($99.900/mes) agregan WhatsApp, analytics, badges de calidad y mejor posición en búsquedas.',
    },
  ];
}

export const testimonials: Testimonial[] = [
  {
    business: 'Barbería El Dorado',
    category: 'Belleza',
    avatar: 'BD',
    achievement: '+40% reservas en el primer mes',
    quote: 'Antes pasaba el día contestando WhatsApp. Ahora los clientes ven mi agenda y reservan solos. Recuperé horas de trabajo perdidas.',
  },
  {
    business: 'Clínica Dental Care',
    category: 'Salud',
    avatar: 'DC',
    achievement: 'Redujo un 60% las llamadas',
    quote: 'Nuestra recepcionista antes solo contestaba el teléfono. AgendaYa liberó su tiempo para lo que realmente importa: atender pacientes.',
  },
  {
    business: 'FitZone Gym',
    category: 'Fitness',
    avatar: 'FZ',
    achievement: 'Cero overbooking en clases',
    quote: 'Las clases se llenaban y teníamos que rechazar gente en la puerta. Ahora el cupo se controla solo y nadie se queda afuera.',
  },
  {
    business: 'Spa Zen',
    category: 'Bienestar',
    avatar: 'SZ',
    achievement: '25% más reservas con recordatorios',
    quote: 'Las cancelaciones de último minuto eran un dolor de cabeza. Los recordatorios automáticos las redujeron casi a cero.',
  },
  {
    business: 'Taller Rápido',
    category: 'Mecánica',
    avatar: 'TR',
    achievement: 'Optimizó 2 horas diarias',
    quote: 'Los clientes llegaban a cualquier hora y desordenaban el flujo. Con AgendaYa programamos cada servicio con su tiempo exacto.',
  },
  {
    business: 'Dra. Martínez Psicología',
    category: 'Psicología',
    avatar: 'DM',
    achievement: 'Ahorra 5 horas/semana en llamadas',
    quote: 'Mis pacientes reprograman desde el link sin tener que llamarme. Yo solo entro al panel y veo mi semana organizada.',
  },
  {
    business: 'La Terraza Restaurante',
    category: 'Restaurantes',
    avatar: 'LT',
    achievement: '30% más ocupación en horas valle',
    quote: 'Con los descuentos por reserva anticipada logramos llenar mesas que antes se quedaban vacías al mediodía.',
  },
  {
    business: 'Bar 33',
    category: 'Bar',
    avatar: 'B3',
    achievement: 'Redujo un 70% las filas en la entrada',
    quote: 'Las reservas para mesa VIP eliminaron las aglomeraciones en la puerta. Ahora los clientes llegan y pasan directo.',
  },
  {
    business: 'Café del Parque',
    category: 'Cafetería',
    avatar: 'CP',
    achievement: '+50 clientes nuevos por el buscador',
    quote: 'Los turistas nos encuentran por la categoría Cafetería en AgendaYa y reservan su brunch antes de llegar.',
  },
  {
    business: 'Estanco Don Carlos',
    category: 'Estanco',
    avatar: 'DC',
    achievement: 'Pedidos especiales sin llamadas',
    quote: 'Mis clientes apartan su lotería y hacen pedidos desde la página. Yo solo preparo y ellos pasan a recoger.',
  },
  {
    business: 'TechFix',
    category: 'Tecnología',
    avatar: 'TF',
    achievement: 'Duplicó reparaciones diarias',
    quote: 'Antes perdía tiempo contestando teléfonos. Ahora los clientes reservan su diagnóstico online y yo solo reparo.',
  },
  {
    business: 'Limpieza Total',
    category: 'Limpieza',
    avatar: 'LT',
    achievement: 'Jornadas completas organizadas',
    quote: 'Programo 3 limpiezas diarias sin traslapar horarios. El sistema bloquea automáticamente los tiempos entre clientes.',
  },
  {
    business: 'Mantenimientos GB',
    category: 'Construcción',
    avatar: 'MG',
    achievement: 'Ahorra 10 horas semanales en llamadas',
    quote: 'Los clientes agendan la visita de cotización directo. Yo solo voy, evalúo y presupuesto sin contestar el teléfono.',
  },
  {
    business: 'Mudanzas Rápidas',
    category: 'Transporte',
    avatar: 'MR',
    achievement: 'Optimizó rutas semanales',
    quote: 'Con las reservas programadas organizo las mudanzas por zonas y ahorro tiempo de desplazamiento.',
  },
];
