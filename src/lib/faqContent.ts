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
    educación: [
      {
        q: 'Doy clases particulares a domicilio. ¿Cómo publico mis servicios?',
        a: 'Crea servicios por materia o nivel: "Clase de matemáticas", "Refuerzo de inglés", "Preparación examen". Cada uno con su duración y precio. Tus alumnos ven tu disponibilidad y reservan la hora que mejor les quede.',
      },
      {
        q: '¿Puedo ofrecer clases virtuales y presenciales?',
        a: 'Sí, AgendaYa no distingue entre modalidades. Publica servicios separados: "Clase presencial" y "Clase online". En la descripción del servicio incluye los requisitos (plataforma, materiales) y los alumnos reservan según prefieran.',
      },
      {
        q: '¿Cómo manejo grupos de estudiantes?',
        a: 'Crea servicios como "Taller grupal" o "Curso intensivo" con cupo máximo definido. El sistema bloquea las reservas cuando se alcanza el límite. Ideal para academias que ofrecen cursos regulares.',
      },
      {
        q: '¿Sirve para academias o escuelas grandes?',
        a: 'Con el plan Premium puedes gestionar hasta 3 sedes o departamentos. Cada instructor puede tener sus propios servicios y horarios, y los estudiantes reservan directamente con el profesor que prefieran.',
      },
    ],
    hotelería: [
      {
        q: 'Tengo un hotel pequeño. ¿Cómo uso AgendaYa para reservas?',
        a: 'Crea servicios por tipo de habitación: "Habitación estándar", "Suite" o "Habitación ejecutiva". Define la duración como 1440 minutos (1 día) y el precio por noche. Los huéspedes reservan su habitación y reciben confirmación automática.',
      },
      {
        q: '¿Puedo gestionar check-in y check-out?',
        a: 'Puedes crear servicios adicionales como "Check-in temprano" o "Late check-out" con duraciones más cortas y precios independientes. Así ofreces flexibilidad sin complicar la reserva principal.',
      },
      {
        q: '¿Manejan reservas para varios días?',
        a: 'Crea un servicio de "Paquete de 3 noches" o "Semana completa" con el precio total. El cliente reserva una sola vez y recibe los detalles de su estancia completa en la confirmación.',
      },
      {
        q: '¿Cómo evito overbooking si tengo pocas habitaciones?',
        a: 'Define el cupo máximo por servicio (cantidad de habitaciones disponibles). Cuando se alcanza el límite, el sistema deja de aceptar reservas automáticamente, evitando sobreventas.',
      },
    ],
    artesanía: [
      {
        q: 'Vendo artesanías, no servicios con cita. ¿Me sirve AgendaYa?',
        a: 'AgendaYa te permite ofrecer servicios como "Taller de cerámica", "Curso de tejido" o "Pieza personalizada". Tus clientes reservan su espacio en el taller o solicitan una pieza única hecha a la medida.',
      },
      {
        q: '¿Puedo ofrecer visitas guiadas a mi taller?',
        a: 'Crea un servicio de "Visita al taller" con duración de 60 minutos. Los clientes reservan su recorrido y conocen tu proceso creativo en vivo. Ideal para conectar con compradores interesados en el arte local.',
      },
      {
        q: '¿Cómo vendo piezas personalizadas?',
        a: 'Publica "Pieza personalizada" como servicio y pide al cliente que describa lo que necesita en las notas de la reserva. Con los planes Pro y Premium puedes requerir un anticipo para empezar la elaboración.',
      },
      {
        q: '¿Sirve para ferias y exposiciones?',
        a: 'Puedes crear servicios temporales para ferias o mercados artesanales. Los clientes reservan su visita y tú organizas tu agenda de participación en eventos sin mezclarla con tus talleres regulares.',
      },
    ],
    moda: [
      {
        q: 'Soy diseñador de moda independiente. ¿Cómo publico mis servicios?',
        a: 'Crea servicios como "Diseño personalizado", "Arreglo de prendas" o "Asesoría de imagen". Cada uno con su duración y precio. Tus clientes reservan la sesión que necesitan sin tener que llamarte.',
      },
      {
        q: '¿Puedo ofrecer servicio de styling para eventos?',
        a: 'Crea "Styling para evento" con duración de 2 horas donde incluyes asesoría de vestuario para bodas, graduaciones o sesiones de fotos. El cliente reserva y tú preparas las opciones antes de la cita.',
      },
      {
        q: '¿Manejan venta de prendas o solo servicios?',
        a: 'AgendaYa está enfocado en servicios, pero puedes crear "Valoración de guardarropa" o "Closet coaching" como servicios. Para la venta directa de prendas, complementa con tu tienda física o redes sociales.',
      },
      {
        q: '¿Cómo manejo clientes que necesitan varias pruebas?',
        a: 'Puedes crear un servicio de "Paquete de 3 sesiones" que incluya prueba inicial, ajuste intermedio y entrega final. Así el cliente reserva una vez y tú gestionas las sesiones internamente sin que tenga que agendar cada una.',
      },
    ],
    fotografía: [
      {
        q: 'Soy fotógrafo freelance. ¿Cómo gestiono mis sesiones?',
        a: 'Crea servicios por tipo de sesión: "Retratos", "Sesión de productos", "Cobertura de eventos". Cada servicio con su duración estimada. Los clientes ven tu disponibilidad y reservan la fecha que prefieren.',
      },
      {
        q: '¿Puedo cobrar una parte por adelantado?',
        a: 'Sí, los planes Pro y Premium te permiten requerir un porcentaje de pago anticipado. Así te aseguras de que el cliente confirme la sesión y reduces las cancelaciones de último minuto.',
      },
      {
        q: '¿Cómo entrego las fotos a mis clientes?',
        a: 'AgendaYa no almacena archivos. Después de la sesión, puedes usar Google Drive, Dropbox o WeTransfer para compartir las fotos. La información de entrega la incluyes en las notas posteriores a la cita.',
      },
      {
        q: '¿Sirve para sesiones de fotos de producto para e-commerce?',
        a: 'Perfectamente. Crea "Sesión de productos" con duración según la cantidad de artículos. Tus clientes del mundo empresarial reservan sesiones periódicas para mantener actualizado su catálogo digital.',
      },
    ],
    inmobiliaria: [
      {
        q: 'Soy agente inmobiliario. ¿Cómo uso AgendaYa para mostrar propiedades?',
        a: 'Crea servicios como "Visita a propiedad", "Asesoría de compra" o "Tasación". Los clientes reservan una cita para recorrer el inmueble o recibir asesoría personalizada sin tener que llamar a la oficina.',
      },
      {
        q: '¿Puedo mostrar varias propiedades como servicios diferentes?',
        a: 'Sí, cada propiedad puede ser un servicio con su nombre, descripción y duración de visita. Incluso puedes incluir el precio de la propiedad en la descripción para atraer compradores calificados.',
      },
      {
        q: '¿Cómo gestiono las visitas a propiedades?',
        a: 'El sistema bloquea automáticamente los horarios ocupados. Si programas una visita para las 10am, ese bloque queda reservado y no recibes solicitudes que se traslapen, organizando tu jornada de showing.',
      },
      {
        q: '¿Ofrecen algo para promocionar mis propiedades?',
        a: 'Cada servicio se muestra en tu página pública con fotos y descripción. Los planes Pro y Premium mejoran tu posición en el buscador de AgendaYa, dando más visibilidad a tus propiedades destacadas.',
      },
    ],
    legal: [
      {
        q: 'Soy abogado. ¿AgendaYa sirve para consultas jurídicas?',
        a: 'Completamente. Crea servicios como "Consulta jurídica", "Revisión de contrato" o "Asesoría laboral". Tus clientes reservan su cita y tú atiendes sin interrupciones telefónicas. Los recordatorios automáticos reducen las inasistencias.',
      },
      {
        q: '¿Puedo ofrecer consultas virtuales?',
        a: 'Sí, AgendaYa no distingue entre presencial y virtual. Publica "Consulta virtual" con duración de 30-45 minutos. El cliente reserva y tú le envías el enlace de la videollamada (Zoom, Meet, etc.) antes de la cita.',
      },
      {
        q: '¿Manejan confidencialidad de datos?',
        a: 'AgendaYa almacena solo datos básicos de contacto. No compartimos información con terceros. La plataforma usa HTTPS. Para información sensible del caso, recomendamos usar canales seguros fuera de la plataforma.',
      },
      {
        q: '¿Cómo manejo pagos por adelantado?',
        a: 'Con los planes Pro y Premium puedes requerir un pago parcial al reservar. Ideal para consultorías especializadas donde quieres asegurar la asistencia del cliente antes de preparar el caso.',
      },
    ],
    finanzas: [
      {
        q: 'Soy contador o asesor financiero. ¿Cómo publico mis servicios?',
        a: 'Crea servicios como "Declaración de renta", "Contabilidad mensual" o "Asesoría financiera". Cada servicio con su duración y precio. Tus clientes reservan su cita y saben exactamente qué incluye cada servicio.',
      },
      {
        q: '¿Manejan información fiscal sensible?',
        a: 'AgendaYa solo gestiona la reserva. Los documentos fiscales los compartes por canales seguros externos (correo cifrado, nube privada). En las notas de la cita puedes incluir instrucciones sobre qué documentos debe llevar el cliente.',
      },
      {
        q: '¿Puedo ofrecer paquetes de servicios?',
        a: 'Crea servicios como "Paquete contable mensual" con precio recurrente. El cliente reserva una vez al mes y tú llevas el control de sus obligaciones. Ideal para pequeños empresarios que buscan formalizarse.',
      },
      {
        q: '¿Cómo gestiono clientes recurrentes?',
        a: 'Los clientes recurrentes ven tu disponibilidad y reservan directamente sin tener que llamar. Los recordatorios automáticos aseguran que no olviden sus citas mensuales de declaración o revisión contable.',
      },
    ],
    entretenimiento: [
      {
        q: 'Organizo eventos. ¿Cómo publico mis servicios?',
        a: 'Crea servicios por tipo de evento: "Fiesta privada", "Show en vivo", "Alquiler de equipo". Los clientes reservan con anticipación y recibes toda la información del evento en la confirmación.',
      },
      {
        q: '¿Puedo vender entradas o boletas?',
        a: 'Publica "Entrada general" o "Reserva VIP" como servicios con precio. Controlas el aforo definiendo el cupo máximo. Cuando se agotan, el sistema deja de aceptar reservas automáticamente.',
      },
      {
        q: '¿Cómo promociono eventos especiales?',
        a: 'Cada servicio es una página pública que puedes compartir en redes sociales. Los clientes ven la descripción, precios y disponibilidad. Ideal para promocionar shows, talleres o experiencias temporales.',
      },
      {
        q: '¿Sirve para alquiler de equipos de sonido o gaming?',
        a: 'Sí, crea "Alquiler de equipo" con duración del período de alquiler (ej: 24 horas). El cliente reserva, tú preparas el equipo y coordinas la entrega. Los recordatorios evitan que se olviden de devolverlo.',
      },
    ],
    turismo: [
      {
        q: 'Soy guía turístico. ¿Cómo publico mis recorridos?',
        a: 'Crea servicios como "City tour", "Tour gastronómico" o "Aventura extremo" con la duración exacta del recorrido. Los viajeros reservan su cupo y tú organizas los grupos sabiendo cuántos asistentes tendrás.',
      },
      {
        q: '¿Puedo ofrecer paquetes de varios días?',
        a: 'Crea "Paquete turístico" con duración de 8 horas o más. Incluye en la descripción todos los detalles: transporte, alimentación, entradas. El cliente reserva una vez y recibe la confirmación con el itinerario completo.',
      },
      {
        q: '¿Cómo manejo cancelaciones por mal clima?',
        a: 'Define en la configuración de tu negocio el tiempo mínimo de cancelación. Si el clima no acompaña, el cliente puede cancelar dentro del plazo y tú quedas libre para reagendar sin penalización.',
      },
      {
        q: '¿Sirve para agencias de viaje establecidas?',
        a: 'Perfectamente. Publica diferentes destinos y paquetes como servicios independientes. Los clientes exploran tus ofertas, reservan su viaje favorito y reciben asesoría personalizada en cada paso.',
      },
    ],
    diseño: [
      {
        q: 'Soy diseñador gráfico freelance. ¿Cómo gestiono mis proyectos?',
        a: 'Crea servicios como "Diseño de logo", "Branding completo" o "Edición de video" con la duración que necesites. Los clientes reservan su proyecto y tú organizas tu carga de trabajo sin saturarte.',
      },
      {
        q: '¿Puedo cobrar una parte por adelantado?',
        a: 'Sí, los planes Pro y Premium permiten requerir un porcentaje de pago anticipado. Así te proteges de clientes que reservan y luego no confirman, asegurando tu tiempo de diseño.',
      },
      {
        q: '¿Cómo entrego los archivos finales?',
        a: 'AgendaYa no almacena archivos. Después de la sesión puedes compartir los entregables por WeTransfer, Google Drive o Dropbox. Incluye las instrucciones de entrega en las notas posteriores a la cita.',
      },
      {
        q: '¿Sirve para agencias o estudios grandes?',
        a: 'Con el plan Premium gestionas hasta 3 negocios (o carteras de servicios). Cada línea creativa (branding, video, web) puede tener sus propios servicios y horarios, y los clientes reservan según lo que necesiten.',
      },
    ],
    jardinería: [
      {
        q: 'Tengo un servicio de jardinería. ¿Cómo publico mis trabajos?',
        a: 'Crea servicios por tipo de trabajo: "Mantenimiento mensual", "Poda de árboles" o "Diseño de jardín". Cada uno con su duración estimada. Los clientes reservan y tú organizas tu ruta semanal de servicios.',
      },
      {
        q: '¿Cómo manejo trabajos que requieren varios días?',
        a: 'Para proyectos grandes como "Diseño de jardín", crea un servicio con la duración total estimada. El cliente reserva el inicio y tú coordinas el resto de las visitas internamente.',
      },
      {
        q: '¿Puedo ofrecer mantenimiento recurrente?',
        a: 'Crea "Mantenimiento mensual" como servicio. Los clientes reservan su primer servicio y luego pueden agendar las siguientes visitas desde su historial. Los recordatorios automáticos ayudan a que no olviden su próxima cita.',
      },
      {
        q: '¿Qué hago si el trabajo toma más tiempo del estimado?',
        a: 'AgendaYa bloquea el horario para otros clientes. Si necesitas más tiempo, ajusta la duración desde el panel. Entre trabajos pequeños y grandes, distribuye tu jornada sin presiones.',
      },
    ],
    música: [
      {
        q: 'Doy clases de música. ¿Cómo publico mis servicios?',
        a: 'Crea servicios por instrumento: "Clase de guitarra", "Clase de piano" o "Canto". Cada uno con su duración y precio. Tus estudiantes reservan su clase semanal y reciben recordatorios automáticos.',
      },
      {
        q: 'Soy músico para eventos. ¿Cómo ofrezco mis presentaciones?',
        a: 'Publica "Presentación en vivo" con duración según el evento (2-4 horas). Los clientes reservan tu show para bodas, fiestas o eventos empresariales. Incluye tu repertorio en la descripción del servicio.',
      },
      {
        q: '¿Puedo ofrecer clases grupales?',
        a: 'Crea "Taller musical" o "Clase grupal" con cupo máximo. Los estudiantes reservan su lugar y tú preparas la clase sabiendo exactamente cuántos asistentes tendrás. El sistema bloquea las reservas cuando se llena el cupo.',
      },
      {
        q: '¿Sirve para reparación de instrumentos?',
        a: 'Sí, crea "Afinación y mantenimiento" o "Reparación de instrumentos". Los músicos reservan su cita para dejar su instrumento y reciben notificación cuando está listo para recoger.',
      },
    ],
    'cuidado infantil': [
      {
        q: 'Tengo una guardería. ¿Cómo uso AgendaYa para las citas?',
        a: 'Crea servicios como "Jornada de cuidado", "Taller infantil" o "Apoyo escolar". Los padres reservan el servicio que necesitan y tú organizas el personal según la cantidad de niños agendados.',
      },
      {
        q: '¿Puedo ofrecer actividades extracurriculares?',
        a: 'Publica talleres específicos: "Clase de música infantil", "Pintura creativa" o "Estimulación temprana". Cada actividad con su duración y grupo de edad. Los padres eligen la actividad que más le gusta a sus hijos.',
      },
      {
        q: '¿Cómo manejo la seguridad y emergencias?',
        a: 'En la descripción de cada servicio incluye los requisitos y documentos necesarios. AgendaYa solo gestiona la agenda — los temas de seguridad se manejan directamente con los padres según tus protocolos.',
      },
      {
        q: '¿Sirve para fiestas infantiles?',
        a: 'Crea "Fiesta infantil" como servicio especial con duración de 3 horas. Los padres reservan la fecha, especifican el número de niños y tú preparas la animación y actividades. Ideal para cumpleaños y celebraciones.',
      },
    ],
    profesionales: [
      {
        q: 'Soy profesional independiente. ¿AgendaYa me sirve?',
        a: 'Completamente. AgendaYa está diseñado para cualquier profesional que ofrezca servicios por cita: consultores, asesores, coaches, mentores. Publica tus servicios, defines tu horario y tus clientes reservan directo.',
      },
      {
        q: '¿Cómo diferencio entre consulta inicial y seguimiento?',
        a: 'Crea servicios separados: "Consulta inicial" para nuevos clientes (más larga, menor precio) y "Sesión de seguimiento" para clientes recurrentes (más corta). Así gestionas mejor tu tiempo y tarifas.',
      },
      {
        q: '¿Puedo ofrecer sesiones virtuales?',
        a: 'Sí, publica "Consulta virtual" como servicio. El cliente reserva y tú compartes el enlace de la videollamada. AgendaYa no distingue entre modalidades, así que puedes tener servicios presenciales y virtuales al mismo tiempo.',
      },
      {
        q: '¿Cómo manejo la facturación de mis servicios?',
        a: 'AgendaYa te da el registro de todas las citas realizadas con cada cliente. Puedes usar esa información para generar tus facturas por separado según tus necesidades contables y fiscales.',
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
