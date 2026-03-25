import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, User, Bot, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { saveChatMessage, getChatHistory, ChatMessage, getBlogPosts, BlogPost, getPopularPosts, slugify } from '../lib/api';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

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

const ChatGuia = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [blogContext, setBlogContext] = useState<string>('');
  const [businessesContext, setBusinessContext] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef(localStorage.getItem('chat_session_id') || Math.random().toString(36).substring(7));

  useEffect(() => {
    localStorage.setItem('chat_session_id', sessionId.current);
    fetchHistory();
    fetchSiteContext();
  }, []);

  const fetchSiteContext = async () => {
    try {
      const [latestRes, popularRes, allBusinesses] = await Promise.all([
        getBlogPosts(),
        getPopularPosts(1),
        supabase.from('businesses').select('name, description')
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

      // Business Context (Directory of all registered businesses)
      let bizContext = 'DIRECTORIO COMPLETO DE NEGOCIOS REGISTRADOS (Usa estos enlaces exactos):\n';
      if (allBusinesses.data) {
        allBusinesses.data.forEach(biz => {
          const slug = slugify(biz.name);
          bizContext += `- [${biz.name}](/${slug})\n`;
        });
        
        // Add descriptions only for the first few to keep prompt size manageable
        bizContext += '\nDETALLES DE ALGUNOS NEGOCIOS:\n';
        allBusinesses.data.slice(0, 10).forEach(biz => {
          if (biz.description) {
            bizContext += `- ${biz.name}: ${biz.description.substring(0, 100)}...\n`;
          }
        });
      }
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

      // Call Groq API (via edge function or direct if proxy available)
      // Note: In a real app, this should be an edge function to protect the API key
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: `Eres el Guía de AgendaYa, un asistente cordial y profesional. Tu objetivo es ayudar a los usuarios a travez sel sitio. No menciones que eres una IA. NUNCA inventes slugs o rutas.

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
4. Mantén tus respuestas breves, amigables y enfocadas en ayudar al usuario a navegar o agendar.`
            },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMessage }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      const data = await response.json();
      const assistantContent = data.choices[0].message.content;

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
    <div className="fixed bottom-6 right-6 z-[100]">
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
                <h3 className="font-bold">Guía de AgendaYa</h3>
                <p className="text-xs text-primary-100">En línea ahora</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950">
            {messages.length === 0 && (
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
              className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white"
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
