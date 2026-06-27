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
): Promise<string> {
  const systemPrompt = `Eres un redactor profesional de descripciones para negocios en AgendaYa, una plataforma de reservas colombiana.

Tu tarea es generar una descripción breve, atractiva y profesional para el negocio. Debes seguir estas reglas:
- Extensión: entre 80 y 200 caracteres.
- Tono: profesional pero cercano, en español de Colombia.
- Debe incluir: qué ofrece el negocio, por qué es especial o qué valor aporta al cliente.
- NO incluir frases genéricas como "Somos los mejores" sin fundamento.
- NO incluir emojis.
- NO incluir información de contacto (dirección, teléfono, horarios).
- Redactar en párrafo corrido, sin viñetas ni listas.`;

  const userPrompt = categoryName
    ? `Genera una descripción profesional para un negocio llamado "${businessName}" de la categoría "${categoryName}".`
    : `Genera una descripción profesional para un negocio llamado "${businessName}".`;

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
      max_tokens: 300,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error de Groq API: ${res.status} - ${text}`);
  }

  const data = await res.json();
  const content: string = data.choices?.[0]?.message?.content;

  if (!content) throw new Error('Respuesta vacía de Groq');

  return content.trim();
}
