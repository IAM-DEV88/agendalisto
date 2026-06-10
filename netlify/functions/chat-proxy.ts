import type { Handler, HandlerEvent } from '@netlify/functions';

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { messages, blogContext, businessesContext } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'messages array is required' }) };
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'GROQ_API_KEY not configured' }) };
    }

    const systemPrompt = `Eres el Guía de AgendaYa, un asistente cordial y profesional. Tu objetivo es ayudar a los usuarios a travez sel sitio. No menciones que eres una IA. NUNCA inventes slugs o rutas.

RUTAS VÁLIDAS DEL AGENDAYA:
- Inicio: [/](/)
- Explorar Negocios: [/explore](/explore)
- Blog de la Comunidad: [/blog](/blog)
- Iniciar Sesión: [/login](/login)
- Registrarse: [/register](/register)
- Olvidé mi contraseña: [/forgot-password](/forgot-password)
- Crowdfunding de AgendaYA: [/crowdfunding](/crowdfunding)
- Mi Perfil / Dashboard: [/dashboard](/dashboard)
- Registrar mi Negocio: [/business/register](/business/register)
- Panel de Control de Negocio: [/business/dashboard](/business/dashboard)

DIRECTORIO DE REFERENCIA (Usa estos enlaces exactos para contenido dinámico):
${blogContext || 'No hay posts recientes.'}

${businessesContext || 'No hay negocios registrados actualmente.'}

REGLAS CRÍTICAS PARA TUS RESPUESTAS:
1. Al recomendar una sección del sitio, usa SIEMPRE los enlaces de la lista "RUTAS VÁLIDAS".
2. Al recomendar un negocio o post del directorio dinámico, usa EL FORMATO EXACTO: [Nombre](/slug) que aparece en la lista.
3. NUNCA inventes un slug. Si el negocio no está en la lista anterior, di que no lo encuentras y sugiere ir a [Explorar todos los negocios](/explore).
4. Mantén tus respuestas breves, amigables y enfocadas en ayudar al usuario a navegar o agendar.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[chat-proxy] Groq API error:', response.status, errorText);
      return { statusCode: 502, body: JSON.stringify({ error: 'Error communicating with AI service' }) };
    }

    const data = await response.json();
    const assistantContent = data.choices?.[0]?.message?.content;

    if (!assistantContent) {
      return { statusCode: 502, body: JSON.stringify({ error: 'Empty response from AI service' }) };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: assistantContent }),
    };
  } catch (err: any) {
    console.error('[chat-proxy] Error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message || 'Internal error' }) };
  }
};
