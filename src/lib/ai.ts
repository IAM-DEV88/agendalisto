const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

function getApiKey(): string {
  const key = import.meta.env.VITE_GROQ_API_KEY;
  if (!key) throw new Error('VITE_GROQ_API_KEY no configurada en .env');
  return key;
}

export async function generateBusinessDescription(
  businessName: string,
  categoryName?: string
): Promise<{ option1: string; option2: string }> {
  const systemPrompt = `Eres un redactor profesional de descripciones para negocios en AgendaYa, una plataforma de reservas colombiana.

Tu tarea es generar DOS versiones de descripción breve, atractiva y profesional para el negocio. Debes seguir estas reglas:
- Extensión: entre 80 y 200 caracteres cada una.
- NO incluir emojis.
- NO incluir información de contacto (dirección, teléfono, horarios).
- Redactar en párrafo corrido, sin viñetas ni listas.

Opción 1 — Enfoque profesional: Tono formal e institucional. Destaca experiencia, calidad y trayectoria.
Opción 2 — Enfoque cercano: Tono cálido y acogedor. Destaca el trato al cliente y la experiencia personalizada.

Las dos opciones deben ser COMPLETAMENTE DIFERENTES en enfoque, tono y contenido. No repetir ideas.
NO incluir frases genéricas como "Somos los mejores" sin fundamento.

Debes responder ÚNICAMENTE con un objeto JSON con este formato exacto:
{"option1": "texto de la opción 1", "option2": "texto de la opción 2"}`;

  const userPrompt = categoryName
    ? `Genera dos descripciones para un negocio llamado "${businessName}" de la categoría "${categoryName}". Responde SOLO con el JSON.`
    : `Genera dos descripciones para un negocio llamado "${businessName}". Responde SOLO con el JSON.`;

  const groqKey = getApiKey();

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${groqKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 500,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error de Groq API: ${res.status} - ${text}`);
  }

  const data = await res.json();
  const content: string = data.choices?.[0]?.message?.content;

  if (!content) throw new Error('Respuesta vacía de Groq');

  try {
    const parsed = JSON.parse(content.trim());
    return {
      option1: (parsed.option1 || '').trim().slice(0, 500),
      option2: (parsed.option2 || '').trim().slice(0, 500),
    };
  } catch {
    const parts = content.split('\n').filter(l => l.trim());
    return {
      option1: (parts[0] || content).trim().slice(0, 500),
      option2: (parts[1] || content).trim().slice(0, 500),
    };
  }
}

export async function generateServiceDescription(
  serviceName: string,
  businessName?: string,
  categoryName?: string
): Promise<{ option1: string; option2: string }> {
  const systemPrompt = `Eres un redactor publicitario experto en servicios para AgendaYa, una plataforma de reservas colombiana.

Tu tarea es generar DOS versiones de descripción persuasiva y orientada a conversión para un servicio. Cada versión debe incluir:
- Un título corto y llamativo como primera línea (máximo 8 palabras).
- Una lista de 3 a 5 puntos clave con viñetas usando el carácter "-", cada uno en una línea nueva.
- Los puntos deben ser beneficios concretos y diferenciadores.

REGLAS DE ESTILO:
- Tono: persuasivo, directo, orientado a convertir visitantes en clientes, en español de Colombia.
- Opción 1: Enfoque en RESULTADOS — lenguaje aspiracional, promete un antes/después. Ej: "Consigue la sonrisa que siempre has querido" seguido de puntos como "- Corrige imperfecciones con resultados naturales", "- Recupera tu confianza al sonreír".
- Opción 2: Enfoque en PROCESO — lenguaje descriptivo, resalta calidad y confianza. Ej: "Cuidamos cada detalle para que luzcas espectacular" seguido de puntos como "- Materiales de primera calidad garantizados", "- Atención personalizada durante todo el proceso".
- Las dos opciones deben ser COMPLETAMENTE DIFERENTES en enfoque, tono y contenido. No repetir ideas.
- NO incluir frases genéricas como "Somos los mejores" sin fundamento.
- NO incluir emojis.
- NO incluir información de contacto, precios ni duración.

Debes responder ÚNICAMENTE con un objeto JSON con este formato exacto (las \\n representan saltos de línea literales):
{"option1": "Título llamativo\\n- punto 1\\n- punto 2\\n- punto 3", "option2": "Título llamativo\\n- punto 1\\n- punto 2\\n- punto 3"}`;

  let context = `el servicio "${serviceName}"`;
  if (businessName) context += ` ofrecido por "${businessName}"`;
  if (categoryName) context += ` en la categoría "${categoryName}"`;

  const userPrompt = `Genera dos descripciones persuasivas para ${context}. Responde SOLO con el JSON.`;

  const groqKey = getApiKey();

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${groqKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 500,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error de Groq API: ${res.status} - ${text}`);
  }

  const data = await res.json();
  const content: string = data.choices?.[0]?.message?.content;

  if (!content) throw new Error('Respuesta vacía de Groq');

  try {
    const parsed = JSON.parse(content.trim());
    return {
      option1: (parsed.option1 || '').trim().slice(0, 500),
      option2: (parsed.option2 || '').trim().slice(0, 500),
    };
  } catch {
    const parts = content.split('\n').filter(l => l.trim());
    return {
      option1: (parts[0] || content).trim().slice(0, 500),
      option2: (parts[1] || content).trim().slice(0, 500),
    };
  }
}
