import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MessageSquare, Heart, Clock, User, ArrowLeft, Send, Bot } from 'lucide-react';
import { getBlogPost, getBlogComments, createBlogComment, toggleBlogLike, BlogPost, BlogComment, getBlogPosts } from '../lib/api';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import SEO from '../components/SEO';
import ShareButton from '../components/ui/ShareButton';

// Función para parsear el contenido del mensaje (reutilizada del chat)
const MessageContent = ({ content }: { content: string }) => {
  const boldParts = content.split(/(\*\*.*?\*\*)/g);
  const renderBold = (text: string, key: string) => {
    const boldMatch = text.match(/\*\*(.*?)\*\*/);
    if (boldMatch) return <strong key={key} className="font-black text-primary-700 dark:text-primary-300">{boldMatch[1]}</strong>;
    const linkParts = text.split(/(\[.*?\]\(.*?\))/g);
    return linkParts.map((part, i) => {
      const match = part.match(/\[(.*?)\]\((.*?)\)/);
      if (match) {
        const linkText = match[1];
        const url = match[2];
        if (url.startsWith('/')) {
          return <Link key={`${key}-${i}`} to={url} className="font-bold underline decoration-2 decoration-primary-400 hover:text-primary-500 transition-colors">{linkText}</Link>;
        }
        return <a key={`${key}-${i}`} href={url} target="_blank" rel="noopener noreferrer" className="font-bold underline decoration-2 decoration-primary-400 hover:text-primary-500 transition-colors">{linkText}</a>;
      }
      return part;
    });
  };
  return <div className="whitespace-pre-wrap">{boldParts.map((part, i) => renderBold(part, i.toString()))}</div>;
};

const BlogPostView = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showOffensiveWarning, setShowOffensiveWarning] = useState(false);
  const [otherPostsContext, setOtherPostsContext] = useState<string>('');

  useEffect(() => {
    if (id) {
      fetchPostAndComments();
      fetchOtherPostsContext();
    }
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();
  }, [id]);

  const fetchOtherPostsContext = async () => {
    try {
      const res = await getBlogPosts();
      if (res.success && res.data) {
        // Excluir el post actual y tomar los otros 4 más recientes
        const others = res.data
          .filter(p => p.id !== id)
          .slice(0, 4);
        
        let context = 'OTRAS PUBLICACIONES QUE PUEDES RECOMENDAR:\n';
        others.forEach(p => {
          context += `- [${p.title}](/blog/${p.id})\n`;
        });
        setOtherPostsContext(context);
      }
    } catch (error) {
      console.error('Error fetching context posts:', error);
    }
  };

  const fetchPostAndComments = async () => {
    setLoading(true);
    const [postRes, commentsRes] = await Promise.all([
      getBlogPost(id!),
      getBlogComments(id!)
    ]);

    if (postRes.success && postRes.data) setPost(postRes.data);
    if (commentsRes.success && commentsRes.data) setComments(commentsRes.data);
    setLoading(false);
  };

  const handleLike = async (targetId: string, type: 'post' | 'comment') => {
    if (!user) {
      toast.error('Inicia sesión para dar me gusta');
      return;
    }
    const res = await toggleBlogLike(user.id, targetId, type);
    if (res.success) {
      if (type === 'post') {
        setPost(prev => prev ? { ...prev, likes_count: res.action === 'added' ? prev.likes_count + 1 : prev.likes_count - 1 } : null);
        toast.success(res.action === 'added' ? 'Añadido a favoritos' : 'Eliminado de favoritos');
      } else {
        setComments(prev => prev.map(c => c.id === targetId ? { ...c, likes_count: res.action === 'added' ? c.likes_count + 1 : c.likes_count - 1 } : c));
      }
    } else {
      toast.error(res.error || 'Error al procesar');
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user || isSubmitting) return;

    setIsSubmitting(true);
    
    try {
      // 1. Detección de contenido ofensivo usando Groq
      const checkResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
              content: 'Tu tarea es detectar si el siguiente mensaje es ofensivo, contiene insultos, odio o contenido inapropiado para una plataforma profesional de agendamiento llamada AgendaYa. Responde ÚNICAMENTE con la palabra "OFENSIVO" o "SEGURO".'
            },
            { role: 'user', content: newComment.trim() }
          ],
          temperature: 0,
          max_tokens: 10
        })
      });

      const checkData = await checkResponse.json();
      const isOffensive = checkData.choices[0].message.content.includes('OFENSIVO');

      if (isOffensive) {
        setShowOffensiveWarning(true);
        setNewComment('');
        setTimeout(() => setShowOffensiveWarning(false), 5000);
        setIsSubmitting(false);
        return;
      }

      // 2. Guardar comentario del usuario
      const res = await createBlogComment({
        post_id: id!,
        user_id: user.id,
        author_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario',
        content: newComment.trim(),
        is_agent_reply: false
      });

      if (res.success && res.data) {
        setComments(prev => [...prev, res.data!]);
        const userCommentContent = newComment.trim();
        setNewComment('');
        toast.success('Comentario publicado');

        // 3. Generar respuesta del agente
        const replyResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
                content: `Eres el Guía de AgendaYa. Tu tarea es responder a comentarios con gratitud y profesionalismo. NUNCA inventes slugs o rutas. Para recomendar otros posts, usa ÚNICAMENTE esta lista:\n${otherPostsContext || 'No hay otros posts disponibles.'}\n4. Mantén las respuestas cortas y cordiales.`
              },
              { role: 'user', content: `El usuario comentó en el post "${post?.title}": "${userCommentContent}". Responde como el Guía.` }
            ],
            temperature: 0.7,
            max_tokens: 200
          })
        });

        const replyData = await replyResponse.json();
        const agentContent = replyData.choices[0].message.content;

        // 4. Guardar respuesta del agente en la DB
        const agentRes = await createBlogComment({
          post_id: id!,
          user_id: null, // ID nulo para el agente
          author_name: 'Guía de AgendaYa',
          content: agentContent,
          is_agent_reply: true
        });

        if (agentRes.success && agentRes.data) {
          setComments(prev => [...prev, agentRes.data!]);
        }
      } else {
        toast.error('Error al publicar comentario');
      }
    } catch (error) {
      console.error('Error en el proceso de comentario:', error);
      toast.error('Hubo un problema al procesar tu comentario');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
    </div>
  );

  if (!post) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-black mb-4">Publicación no encontrada</h2>
        <Link to="/blog" className="text-primary-600 font-bold hover:underline flex items-center gap-2 justify-center">
          <ArrowLeft className="w-4 h-4" /> Volver al blog
        </Link>
      </div>
    </div>
  );

  // Schema.org for Article
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.excerpt || post.content.substring(0, 160),
    "image": post.image_url,
    "author": {
      "@type": "Person",
      "name": post.author_name
    },
    "datePublished": post.created_at,
    "dateModified": post.updated_at
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200 py-12">
      <SEO 
        title={post.title}
        description={post.excerpt || post.content.substring(0, 160)}
        ogImage={post.image_url || undefined}
        ogType="article"
        schemaData={articleSchema}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/blog" className="inline-flex items-center gap-2 text-slate-500 hover:text-primary-600 font-bold mb-8 transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Volver al blog
        </Link>

        <article className="card p-8 sm:p-12 shadow-2xl shadow-slate-200/50 dark:shadow-none mb-12">
          {post.image_url && (
            <div className="h-64 sm:h-96 -mx-8 sm:-mx-12 -mt-8 sm:-mt-12 mb-10 overflow-hidden bg-slate-100 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-800">
              <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="flex items-center gap-4 text-xs font-black text-slate-400 uppercase tracking-widest mb-6">
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {new Date(post.created_at).toLocaleDateString()}</span>
            <span className="flex items-center gap-1.5 text-primary-600 dark:text-primary-400"><User className="w-4 h-4" /> {post.author_name}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white mb-8 tracking-tight leading-tight">
            {post.title}
          </h1>

          <div className="prose prose-lg dark:prose-invert max-w-none mb-12 text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
            {(() => {
              const paragraphs = post.content.split('\n').filter(p => p.trim() !== '');
              
              let leftColumn: string[] = [];
              let rightColumn: string[] = [];

              if (paragraphs.length > 1) {
                const midpoint = Math.ceil(paragraphs.length / 2);
                leftColumn = paragraphs.slice(0, midpoint);
                rightColumn = paragraphs.slice(midpoint);
              } else if (paragraphs.length === 1) {
                // Si solo hay un párrafo, intentamos dividirlo por frases
                const text = paragraphs[0];
                const sentences = text.match(/[^.!?]+[.!?]|\s*[^.!?]+$/g) || [text];
                
                if (sentences.length > 1) {
                  const midpoint = Math.ceil(sentences.length / 2);
                  leftColumn = [sentences.slice(0, midpoint).join(' ')];
                  rightColumn = [sentences.slice(midpoint).join(' ')];
                } else {
                  // Si solo hay una frase o el regex falló, dividimos por palabras
                  const words = text.split(' ');
                  const midpoint = Math.ceil(words.length / 2);
                  leftColumn = [words.slice(0, midpoint).join(' ')];
                  rightColumn = [words.slice(midpoint).join(' ')];
                }
              }

              return (
                <div className="lg:grid lg:grid-cols-2 lg:gap-16 relative">
                  {/* Vertical Line */}
                  <div className="hidden lg:block absolute left-1/2 top-4 bottom-4 w-[2px] bg-slate-200 dark:bg-gray-500 -translate-x-1/2"></div>
                  
                  <div className="space-y-6">
                    {leftColumn.map((para, i) => (
                      <p 
                        key={`left-${i}`} 
                        className={`text-justify ${
                          i === 0 
                            ? 'first-letter:text-7xl first-letter:font-black first-letter:text-primary-600 first-letter:mr-3 first-letter:float-left first-letter:leading-[0.8]' 
                            : ''
                        }`}
                      >
                        {para}
                      </p>
                    ))}
                  </div>
                  
                  <div className="space-y-6 mt-6 lg:mt-0">
                    {rightColumn.map((para, i) => (
                      <p key={`right-${i}`} className="text-justify">
                        {para}
                      </p>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <button onClick={() => handleLike(post.id, 'post')} className="flex items-center gap-2 text-slate-500 hover:text-rose-500 transition-colors">
                <Heart className={`w-6 h-6 ${post.likes_count > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
                <span className="font-bold text-lg">{post.likes_count}</span>
              </button>
              <div className="flex items-center gap-2 text-slate-500">
                <MessageSquare className="w-6 h-6" />
                <span className="font-bold text-lg">{comments.length}</span>
              </div>
            </div>
            <ShareButton
              variant="icon"
              iconSize={24}
              className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-primary-600 hover:text-white !rounded-xl !shadow-none"
              title={post.title}
              description={post.excerpt || post.content.substring(0, 160)}
            />
          </div>
        </article>

        {/* Comments Section */}
        <section className="space-y-8">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-primary-600" /> Conversación
          </h2>

          {/* New Comment Form */}
          {user ? (
            <div className="space-y-4">
              {showOffensiveWarning && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                  <p className="text-amber-800 dark:text-amber-300 text-sm font-bold flex items-center gap-2">
                    <Bot className="w-5 h-5" /> 
                    Lo siento, solo tratamos asuntos referentes a AgendaYa de manera cordial y profesional.
                  </p>
                </div>
              )}
              <form onSubmit={handleSubmitComment} className="card p-6 border-2 border-primary-100 dark:border-primary-900/30">
                <textarea 
                  placeholder="Escribe tu opinión..." 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 mb-4 h-32"
                />
                <div className="flex justify-end">
                  <button 
                    type="submit" 
                    disabled={!newComment.trim() || isSubmitting}
                    className="btn-primary inline-flex items-center gap-2 px-8 py-3 rounded-2xl shadow-xl shadow-primary-500/20 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Publicando...' : 'Publicar comentario'} <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="card p-8 text-center bg-primary-50 dark:bg-primary-900/20 border-primary-100 dark:border-primary-800 border-dashed border-2">
              <p className="text-slate-700 dark:text-slate-300 font-bold mb-4">Inicia sesión para participar en la conversación.</p>
              <Link to="/login" className="btn-primary inline-block">Iniciar Sesión</Link>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-10">
            {comments.map((comment, index) => {
              if (comment.is_agent_reply) return null;

              const nextComment = comments[index + 1];
              const agentReply = nextComment && nextComment.is_agent_reply ? nextComment : null;

              return (
                <div key={comment.id} className="relative group">
                  {/* Hilo de conversación en recuadro común */}
                  <div className="bg-white dark:bg-slate-800/40 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                    {/* Comentario del Usuario */}
                    <div className="p-6 sm:p-7">
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full flex-shrink-0 bg-slate-100 dark:bg-slate-700 flex items-center justify-center ring-2 ring-slate-50 dark:ring-slate-800">
                          <User className="w-5 h-5 text-slate-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-black text-slate-900 dark:text-white text-sm">{comment.author_name}</h4>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(comment.created_at).toLocaleDateString()}</p>
                            </div>
                            <button 
                              onClick={() => handleLike(comment.id, 'comment')} 
                              className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all text-xs font-bold"
                            >
                              <Heart className={`w-3.5 h-3.5 ${comment.likes_count > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
                              {comment.likes_count}
                            </button>
                          </div>
                          <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed font-medium">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Respuesta del Agente (Integrada en el mismo recuadro) */}
                    {agentReply && (
                      <div className="bg-primary-50/30 dark:bg-primary-900/10 border-t border-primary-100/50 dark:border-primary-800/30 p-6 sm:p-7 animate-in fade-in duration-500">
                        <div className="flex gap-4">
                          <div className="w-10 h-10 rounded-full flex-shrink-0 bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20 ring-4 ring-white dark:ring-slate-900">
                            <Bot className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <h4 className="font-black text-primary-900 dark:text-primary-300 text-sm">Guía de AgendaYa</h4>
                                <span className="px-2 py-0.5 bg-primary-600 text-white text-[8px] font-black uppercase tracking-tighter rounded-full">Oficial</span>
                              </div>
                              <button 
                                onClick={() => handleLike(agentReply.id, 'comment')} 
                                className="flex items-center gap-1.5 px-3 py-1 bg-white/50 dark:bg-slate-800 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all text-xs font-bold"
                              >
                                <Heart className={`w-3.5 h-3.5 ${agentReply.likes_count > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
                                {agentReply.likes_count}
                              </button>
                            </div>
                            <div className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed font-bold italic bg-white/40 dark:bg-slate-900/40 p-4 rounded-2xl border border-white dark:border-slate-800/50 shadow-sm">
                              <MessageContent content={agentReply.content} />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

export default BlogPostView;
