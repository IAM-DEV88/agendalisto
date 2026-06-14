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
];
