import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // URL pública de la mascota (estándar del sitio)
    const MASCOTA_IMAGE_URL = "https://ralivarwsyunylsswbuk.supabase.co/storage/v1/object/public/business-logos/5615eaec-524c-47bc-9380-3235bbf44e34_1774234514340.jpg";

    const categorias = {
      problema: [
        "Por qué tu negocio tiene horarios vacíos y cómo solucionarlo sin bajar precios",
        "Qué hacer cuando los clientes reservan pero no asisten",
        "Cómo dejar de depender de clientes ocasionales y crear ingresos constantes",
        "Errores silenciosos que están afectando tus reservas sin que lo notes",
        "Por qué tus clientes no vuelven aunque tu servicio sea bueno"
      ],
      dinero: [
        "Cómo aumentar ingresos sin trabajar más horas",
        "Estrategias simples para duplicar reservas en negocios locales",
        "Cómo convertir clientes únicos en clientes recurrentes",
        "Cómo subir precios sin perder clientes",
        "Cómo identificar a tus clientes más rentables"
      ],
      psicologia: [
        "Qué hace que un cliente reserve en segundos o abandone",
        "Cómo influye la urgencia en la toma de decisiones de tus clientes",
        "Por qué algunos clientes cancelan a último momento",
        "Cómo generar confianza antes de que el cliente llegue",
        "El efecto de la primera impresión en servicios presenciales"
      ],
      herramientas: [
        "Cómo organizar tu agenda sin estrés ni errores manuales",
        "Ventajas de digitalizar reservas en negocios pequeños",
        "Cómo automatizar recordatorios y reducir cancelaciones",
        "Cómo usar WhatsApp para llenar tu agenda más rápido",
        "Cómo centralizar clientes, horarios y servicios en un solo lugar"
      ],
      eficiencia: [
        "Cómo optimizar tu jornada laboral para atender más clientes",
        "Cómo evitar tiempos muertos entre citas",
        "Cómo estructurar horarios para maximizar ganancias",
        "Cómo organizar servicios para reducir tiempos improductivos",
        "Cómo manejar picos de demanda sin perder clientes"
      ],
      crecimiento: [
        "Cómo empezar un negocio de servicios desde cero",
        "Primeros clientes: estrategias que realmente funcionan",
        "Cómo validar si tu servicio tiene demanda",
        "Errores comunes al iniciar un negocio independiente",
        "Cómo diferenciarte de otros negocios similares"
      ],
      marketing: [
        "Cómo conseguir clientes sin pagar publicidad",
        "Estrategias locales para atraer clientes cerca de ti",
        "Cómo usar redes sociales sin volverte esclavo de ellas",
        "Qué tipo de contenido realmente atrae clientes",
        "Cómo convertir seguidores en reservas reales"
      ],
      experiencia: [
        "Cómo crear una experiencia que haga que el cliente regrese",
        "Detalles pequeños que hacen que un cliente recomiende tu negocio",
        "Cómo manejar clientes difíciles sin perder profesionalismo",
        "Cómo pedir reseñas sin incomodar",
        "Qué valoran realmente los clientes en servicios locales"
      ],
      tendencias: [
        "Tendencias en negocios de servicios para 2026",
        "Cómo está cambiando el comportamiento del cliente",
        "El futuro de las reservas digitales en LATAM",
        "Nuevas formas de fidelizar clientes en negocios pequeños",
        "Tecnologías que están transformando servicios locales"
      ],
      casos: [
        "Historia: cómo un negocio local aumentó sus reservas en semanas",
        "Caso real: de agenda vacía a agenda llena",
        "Lecciones de negocios pequeños que crecieron rápido",
        "Errores reales de emprendedores y cómo evitarlos",
        "Antes y después de organizar correctamente una agenda"
      ]
    };

    const categoriaKeys = Object.keys(categorias);
    const categoriaRandom = categoriaKeys[Math.floor(Math.random() * categoriaKeys.length)] as keyof typeof categorias;
    const temaAleatorio = categorias[categoriaRandom][
      Math.floor(Math.random() * categorias[categoriaRandom].length)
    ];

    // 1. GENERACIÓN CON GROQ
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${GROQ_API_KEY}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `Eres el Guía de AgendaYa. Escribe un post (content) lo más extenso y actual posible para el blog referente a: ${temaAleatorio}. 
            REGLAS:
            - EVITA usar negritas (**) o html en el contenido.
            - Usa espaciado apropiado en títulos y párrafos.
            - Responde ÚNICAMENTE en formato JSON con estas llaves: title, content, excerpt.`
          },
          { role: 'user', content: 'Genera el post ahora.' }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.8
      })
    });

    const result = await response.json();
    const aiResponse = JSON.parse(result.choices[0].message.content);

    // 3. LIMPIEZA E INSERCIÓN
    const cleanPostData = {
      title: aiResponse.title,
      content: aiResponse.content,
      excerpt: aiResponse.excerpt,
      image_url: MASCOTA_IMAGE_URL, // Forzamos la imagen de marca
      author_name: 'Guía de AgendaYa'
    };

    console.log("Insertando post:", cleanPostData.title);

    const { data, error } = await supabase
      .from('blog_posts')
      .insert([cleanPostData])
      .select();

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, post: data }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Error detallado:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
})
