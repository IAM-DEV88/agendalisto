import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { saveChatMessage, getChatHistory, ChatMessage, getBlogPosts, getPopularPosts, getBusinessCategories } from '../lib/api';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { getCityConfig } from '../lib/cities';

// Función para parsear el contenido del mensaje y detectar enlaces en formato Markdown y negritas
const MessageContent = ({ content }: { content: string }) => {
  // 1. Detectar negritas **texto**
  const boldParts = content.split(/(\*\*.*?\*\*)/g);
  
  const renderBold = (text: string, key: string) => {
    const boldMatch = text.match(/\*\*(.*?)\*\*/);
    if (boldMatch) {
      return <strong key={key} className="font-black text-primary-700 dark:text-primary-300">{boldMatch[1]}</strong>;
    }
    
    // 2. Detectar enlaces [Texto](URL) dentro de las partes no negritas
    const linkParts = text.split(/(\[.*?\]\(.*?\))/g);
    return linkParts.map((part, i) => {
      const match = part.match(/\[(.*?)\]\((.*?)\)/);
      if (match) {
        const linkText = match[1];
        const url = match[2];
        
        if (url.startsWith('/')) {
          return (
            <Link 
              key={`${key}-${i}`} 
              to={url} 
              className="font-bold underline decoration-2 decoration-primary-400 hover:text-primary-500 dark:hover:text-primary-300 transition-colors inline-flex items-center"
            >
              {linkText}
            </Link>
          );
        }
        return (
          <a 
            key={`${key}-${i}`} 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="font-bold underline decoration-2 decoration-primary-400 hover:text-primary-500 dark:hover:text-primary-300 transition-colors inline-flex items-center"
          >
            {linkText}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <div className="whitespace-pre-wrap leading-relaxed">
      {boldParts.map((part, i) => renderBold(part, i.toString()))}
    </div>
  );
};

function getCityContext(): string {
  const match = window.location.pathname.match(/^\/ciudades\/([^/]+)/);
  if (!match) return '';
  const city = getCityConfig(match[1]);
  if (!city) return '';

  return `
═══ CONTEXTO: PÁGINA DE ${city.name.toUpperCase()} ═══
El usuario está viendo la página de **${city.name}**, ${city.department}, Colombia.

Categorías prioritarias en ${city.name}:
${city.priorityCategories.map(c => `- ${c}`).join('\n')}

${city.hasAgriculture ? `🌱 *Sector agrícola activo*: Productores de café, aguacate, pitaya pueden publicar sus fincas/bodegas.` : ''}

📌 *¿Qué puede hacer el usuario aquí?*
- Explorar negocios registrados en ${city.name}
- **Registrar su negocio gratis** llenando el formulario en la misma página
- Si hay sector agrícola: publicar finca/bodega para recibir cotizaciones

🎯 *Captura de leads — ASISTENTE PERSONAL*
Cuando un usuario quiera registrar su negocio en ${city.name}:
1. ✅ Pídele amablemente: **nombre**, **nombre del negocio**, **WhatsApp** y **categoría**.
2. ✅ Una vez tengas los datos, confírmale que quedaron listos.
3. ✅ Dile que el equipo de AgendaYa lo contactará pronto y que mientras tanto puede explorar la plataforma.
4. ✅ IMPORTANTE: Guíalo siempre al formulario que está en la misma página (sección "Publica tu negocio gratis") para que complete el registro formal.

📌 *Información útil sobre ${city.name}:*
- Categorías prioritarias: ${city.priorityCategories.join(', ')}.
${city.hasAgriculture ? `- 🌱 Sector agrícola: productores de café, aguacate y pitaya pueden publicar sus fincas gratis.` : ''}

🎯 *Reglas para captura de leads:*
- Sé conversacional y natural — no parezcas un bot de formulario.
- Si el usuario comparte sus datos, responde con entusiasmo y dale la bienvenida.
- NUNCA inventes datos de la ciudad — si no sabes algo, dirígelo al formulario en la página.`;
}

function buildSystemPrompt(blogContext: string, businessesContext: string, cityContext?: string) {
  return `Eres el **Guía de AgendaYa**, un asistente cordial, profesional y entusiasta. Tu objetivo es ayudar a los usuarios a navegar y aprovechar todo el sitio. NUNCA digas que eres una IA — eres el Guía de la plataforma. NUNCA inventes slugs, rutas ni precios. Responde siempre en español neutro de Colombia.

═══ TU PERSONALIDAD ═══
- Amigable pero profesional — como un recepcionista experto que conoce la plataforma al derecho y al revés.
- Responde breve y directo (máximo 3-4 párrafos). Si el tema requiere más profundidad, ofrece enlaces para que el usuario explore.
- Usa **negritas** para destacar conceptos clave y enlaces [texto](/ruta) para dirigir.
- Si alguien pregunta algo que no sabes, sé honesto: "No tengo esa información, pero puedo ayudarte con..." y redirige.

═══ RUTAS VÁLIDAS DE AGENDAYA ═══
- Inicio: [/](/)
- Explorar Negocios: [/explore](/explore)
- Planes y Precios: [/plans](/plans)
- Preguntas Frecuentes: [/faq](/faq)
- Blog de la Comunidad: [/blog](/blog)
- Iniciar Sesión: [/login](/login)
- Crear Cuenta Gratis: [/register](/register)
- Olvidé mi Contraseña: [/forgot-password](/forgot-password)
- Mi Perfil / Dashboard: [/dashboard](/dashboard)
- Registrar mi Negocio: [/business/register](/business/register)
- Panel de Control del Negocio: [/business/dashboard](/business/dashboard)
- Embajadores / Programa de Referidos: [/embajadores](/embajadores)
- Alianzas con Hoteles: [/hoteles](/hoteles)
- Cajas de Compensación: [/cajas-compensacion](/cajas-compensacion)
- Apóyanos / Crowdfunding: [/crowdfunding](/crowdfunding)

═══ PLANES Y PRECIOS ═══
Hay 3 planes (precios en COP mensuales):
- **Starter**: Gratis. 1 negocio, 5 servicios, perfil público, email notifications. Ideal para empezar.
- **Pro**: $49.900/mes. 1 negocio, servicios ilimitados, WhatsApp, analytics básicos, badge "Pro", mejor posición en búsquedas.
- **Premium**: $99.900/mes. 3 negocios, servicios ilimitados, analytics avanzados, badge "Premium", posición destacada.
Todos incluyen: gestión de citas online, recordatorios automáticos, página pública personalizada (agendalisto.com/tu-negocio), reseñas de clientes.

═══ ROLES DE USUARIO ═══
- **Visitor**: Solo ve páginas públicas (Home, Explorar, Blog, perfil público).
- **Client**: Puede reservar servicios, escribir reseñas, ver historial en /dashboard.
- **Business Owner**: Gestiona su negocio desde /business/dashboard (CRUD servicios, horarios, citas, clientes, config).
- **Moderator**: Administra reseñas y contenido desde /moderator/dashboard.
- **Admin**: Acceso total desde /admin/dashboard.

═══ CÓMO FUNCIONAN LAS RESERVAS ═══
1. El cliente encuentra un negocio en [/explore](/explore) o por su página pública.
2. Elige un servicio, selecciona fecha y hora disponibles, y reserva.
3. El negocio recibe la solicitud con estado "pendiente" y puede confirmarla, cancelarla o dejarla como completada.
4. El cliente recibe recordatorios automáticos por email (y WhatsApp en plan Pro+).
5. Después del servicio, el cliente puede dejar una reseña con fotos. La reseña pasa por moderación antes de publicarse.

═══ MÉTODOS DE PAGO ═══
- **PayPal**: Disponible para pagar planes y servicios en línea.
- **Wompi**: Integración colombiana para pagos con tarjeta (próximamente más métodos).
- El plan Starter es completamente gratis — no requiere tarjeta.

═══ MULTI-NEGOCIO ═══
Un usuario puede tener varios negocios. El plan Premium permite hasta 3 negocios. Desde el panel de control se cambia entre ellos con el selector de negocios.

═══ CÓDIGOS DE REGALO ═══
Los negocios pueden crear códigos de regalo para sus servicios. Un cliente compra un bono, lo recibe por email para regalar, y quien lo recibe lo canjea al reservar.

═══ PREGUNTAS FRECUENTES (usa respuestas como estas) ═══
Q: ¿Necesito página web para usar AgendaYa?
A: No. Cada negocio tiene su propia página pública dentro de la plataforma con URL personalizada. No necesitas conocimientos técnicos.

Q: ¿Mis clientes van a usar esto?
A: El 68% prefiere reservar online a llamar. Quienes prefieran llamar pueden seguir haciéndolo — AgendaYa es un canal adicional.

Q: ¿Es fácil de configurar?
A: En menos de 5 minutos tienes tu negocio listo. Escribes los servicios, su duración y precio, defines tu horario, y ya estás recibiendo reservas.

Q: ¿Cómo se manejan las cancelaciones?
A: El cliente puede cancelar desde el enlace que recibe. Los recordatorios automáticos reducen las inasistencias hasta un 40% (o más si usas pago anticipado).

Q: ¿Puedo tener empleados o múltiples profesionales?
A: Sí, con el plan Premium puedes gestionar hasta 3 negocios. Cada profesional define sus propios servicios y horarios.

Q: ¿Qué pasa si no tengo Instagram o Facebook?
A: No hay problema. Tu negocio aparece en el buscador de AgendaYa independientemente de tus redes sociales. La página pública incluye WhatsApp, teléfono, email y ubicación.

DIRECTORIO DE REFERENCIA DINÁMICO (usa estos enlaces EXACTOS):
${blogContext || 'No hay posts recientes.'}

${businessesContext || 'No hay negocios registrados actualmente.'}

REGLAS CRÍTICAS:
1. Usa SIEMPRE los enlaces de "RUTAS VÁLIDAS" o del directorio dinámico. NUNCA inventes rutas.
2. Al recomendar un negocio o post, usa EL FORMATO EXACTO del directorio: [Nombre](/slug).
3. Si el usuario pregunta por algo que no está en el directorio, sugiere ir a [/explore](/explore) o [/blog](/blog).
4. Si preguntan por precios, usa los de "PLANES Y PRECIOS". Si preguntan por costos de servicios individuales, redirige a la página del negocio.

${cityContext || ''}`;
}

const ChatGuia = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [blogContext, setBlogContext] = useState<string>('');
  const [businessesContext, setBusinessContext] = useState<string>('');
  const [cityContext, setCityContext] = useState<string>('');
  const hasProactiveGreeting = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef(localStorage.getItem('chat_session_id') || Math.random().toString(36).substring(7));

  useEffect(() => {
    localStorage.setItem('chat_session_id', sessionId.current);
    fetchHistory();
    fetchSiteContext();
    setCityContext(getCityContext());
  }, []);

  useEffect(() => {
    if (isOpen && cityContext && !hasProactiveGreeting.current && messages.length === 0) {
      hasProactiveGreeting.current = true;
      const citySlug = window.location.pathname.match(/^\/ciudades\/([^/]+)/)?.[1];
      const city = citySlug ? getCityConfig(citySlug) : null;
      if (city) {
        const msg = `¡Hola! 👋 Veo que estás explorando **${city.name}**. ¿Tienes un negocio aquí o estás buscando algún servicio en particular? Puedo ayudarte a registrar tu negocio gratis en menos de 5 minutos.`;
        const tempAssistantMsg: ChatMessage = {
          id: 'proactive-' + Date.now(),
          role: 'assistant',
          content: msg,
          session_id: sessionId.current,
          created_at: new Date().toISOString()
        };
        setMessages([tempAssistantMsg]);
      }
    }
  }, [isOpen, cityContext]);

  const fetchSiteContext = async () => {
    try {
      const [latestRes, popularRes, allBusinesses, categoriesRes] = await Promise.all([
        getBlogPosts(),
        getPopularPosts(1),
        supabase.from('agendaya_businesses').select('name, description, slug'),
        getBusinessCategories(),
      ]);

      // Blog Context
      let bContext = 'PUBLICACIONES RECIENTES EN EL BLOG:\n';
      if (latestRes.success && latestRes.data) {
        latestRes.data.slice(0, 5).forEach(post => {
          bContext += `- [${post.title}](/blog/${post.id})\n`;
        });
      }
      if (popularRes.success && popularRes.data && popularRes.data.length > 0) {
        const popular = popularRes.data[0];
        bContext += `\nPUBLICACIÓN MÁS POPULAR:\n- [${popular.title}](/blog/${popular.id})`;
      }
      setBlogContext(bContext);

      // Categories
      let catContext = '';
      if (categoriesRes.success && categoriesRes.data && categoriesRes.data.length > 0) {
        catContext = '\nCATEGORÍAS DE NEGOCIOS DISPONIBLES:\n';
        categoriesRes.data.forEach(cat => {
          catContext += `- [${cat.name}](/categorias/${cat.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-áéíóúüñ]/g, '')})\n`;
        });
      }

      // Business Context (Directory of all registered businesses)
      let bizContext = 'DIRECTORIO COMPLETO DE NEGOCIOS REGISTRADOS (Usa estos enlaces exactos):\n';
      if (allBusinesses.data) {
        allBusinesses.data.forEach(biz => {
          bizContext += `- [${biz.name}](/${biz.slug})\n`;
        });

        // Add descriptions only for the first few to keep prompt size manageable
        bizContext += '\nDETALLES DE ALGUNOS NEGOCIOS:\n';
        allBusinesses.data.slice(0, 10).forEach(biz => {
          if (biz.description) {
            bizContext += `- ${biz.name}: ${biz.description.substring(0, 100)}...\n`;
          }
        });
      }
      bizContext += catContext;
      setBusinessContext(bizContext);

    } catch (error) {
      console.error('Error fetching site context for AI:', error);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { success, data } = await getChatHistory(sessionId.current, user?.id);
    if (success && data) {
      setMessages(data);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    // Optimistic update
    const tempUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      session_id: sessionId.current,
      user_id: user?.id,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      // Save user message to DB
      await saveChatMessage({
        role: 'user',
        content: userMessage,
        session_id: sessionId.current,
        user_id: user?.id
      });

      // Call AI: localhost calls Groq directly (VITE_GROQ_API_KEY in .env),
      // production uses Netlify Function to protect the API key
      const convMessages = [
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMessage }
      ];

      let assistantContent: string;

      if (import.meta.env.DEV) {
        const groqKey = import.meta.env.VITE_GROQ_API_KEY;
        if (!groqKey) throw new Error('VITE_GROQ_API_KEY no configurada en .env');

        const systemPrompt = buildSystemPrompt(blogContext, businessesContext, cityContext);
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'system', content: systemPrompt }, ...convMessages],
            temperature: 0.7,
            max_tokens: 500,
          }),
        });
        if (!groqRes.ok) throw new Error('Error de Groq API');
        const groqData = await groqRes.json();
        assistantContent = groqData.choices?.[0]?.message?.content;
        if (!assistantContent) throw new Error('Respuesta vacía de Groq');
      } else {
        const response = await fetch('/.netlify/functions/chat-proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: convMessages, blogContext, businessesContext, cityContext }),
        });
        if (!response.ok) throw new Error('Error del servidor');
        assistantContent = (await response.json()).content;
      }

      // Save assistant message to DB
      await saveChatMessage({
        role: 'assistant',
        content: assistantContent,
        session_id: sessionId.current,
        user_id: user?.id
      });

      const tempAssistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantContent,
        session_id: sessionId.current,
        user_id: user?.id,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, tempAssistantMsg]);

    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Lo siento, tuve un problema al procesar tu mensaje.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[100]">
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-primary-600 hover:bg-primary-500 text-white rounded-full shadow-2xl flex items-center justify-center transition-all transform hover:scale-110 active:scale-95"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-[350px] sm:w-[400px] h-[500px] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="p-4 bg-primary-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold">Guía de AgendaYa</div>
                <div className="text-xs text-primary-100">En línea ahora</div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950 scrollbar-fino">
            {messages.length === 0 && !cityContext && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bot className="w-8 h-8 text-primary-600" />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-2">¡Hola!</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Soy tu Guía en AgendaYa. ¿En qué puedo ayudarte hoy?
                </p>
              </div>
            )}
            {cityContext && (
              <div className="text-center pb-2">
                <button
                  onClick={() => {
                    const form = document.getElementById('business-lead-form');
                    if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    setIsOpen(false);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-primary-500/25"
                >
                  📝 Registrar mi negocio
                </button>
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-primary-600 text-white rounded-tr-none'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm border border-slate-100 dark:border-slate-700 rounded-tl-none'
                  }`}
                >
                  <MessageContent content={msg.content} />
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 rounded-tl-none">
                  <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2 bg-primary-600 text-white rounded-xl hover:bg-primary-500 disabled:opacity-50 transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatGuia;
