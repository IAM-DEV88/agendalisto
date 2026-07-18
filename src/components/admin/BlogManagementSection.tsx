import { useState, useEffect } from 'react';
import { adminGetAllPosts, createBlogPost, updateBlogPost, deleteBlogPost, BlogPost } from '../../lib/api';
import { toast } from 'react-hot-toast';
import { Plus, Edit2, Trash2, Eye, X, Loader2, Save, FileText, User, MessageSquare } from 'lucide-react';
import EmptyState from '../ui/EmptyState';
import ImageUpload from '../ui/ImageUpload';
import { supabase } from '../../lib/supabase';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';

export default function BlogManagementSection() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPost, setPreviewPost] = useState<BlogPost | null>(null);
  useLockBodyScroll(modalOpen || previewOpen);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [form, setForm] = useState({ title: '', content: '', excerpt: '', author_name: '', image_url: '' });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    const res = await adminGetAllPosts();
    if (res.success && res.data) setPosts(res.data);
    setLoading(false);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', content: '', excerpt: '', author_name: '', image_url: '' });
    setModalOpen(true);
  };

  const openEdit = (post: BlogPost) => {
    setEditing(post);
    setForm({
      title: post.title,
      content: post.content,
      excerpt: post.excerpt || '',
      author_name: post.author_name,
      image_url: post.image_url || '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('Título y contenido son obligatorios');
      return;
    }
    setSaving(true);
    const author = form.author_name.trim() || 'Admin';
    if (editing) {
      const res = await updateBlogPost(editing.id, {
        title: form.title,
        content: form.content,
        excerpt: form.excerpt || null,
        image_url: form.image_url || null,
        author_name: author,
      });
      if (res.success) {
        toast.success('Post actualizado');
        setModalOpen(false);
        loadPosts();
      } else toast.error(res.error || 'Error al actualizar');
    } else {
      const res = await createBlogPost({
        title: form.title,
        content: form.content,
        excerpt: form.excerpt || null,
        image_url: form.image_url || null,
        author_name: author,
      });
      if (res.success) {
        toast.success('Post creado');
        setModalOpen(false);
        loadPosts();
      } else toast.error(res.error || 'Error al crear');
    }
    setSaving(false);
  };

  const handleDelete = async (post: BlogPost) => {
    if (!window.confirm(`¿Eliminar "${post.title}"? Esta acción no se puede deshacer.`)) return;
    const res = await deleteBlogPost(post.id);
    if (res.success) {
      toast.success('Post eliminado');
      loadPosts();
    } else toast.error(res.error || 'Error al eliminar');
  };

  const handlePreview = (post: BlogPost) => {
    setPreviewPost(post);
    setPreviewOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Gestión de Blog</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{posts.length} publicaciones</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm rounded-lg transition-all shadow-lg shadow-primary-500/20"
        >
          <Plus className="w-4 h-4" /> Nueva publicación
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 animate-pulse" />)}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState icon={<Eye className="w-8 h-8" />} title="Sin publicaciones" description="Crea la primera publicación del blog." />
      ) : (
        <div className="space-y-2">
          {posts.map(post => (
            <div key={post.id} className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all">
              {post.image_url && (
                <img src={post.image_url} alt={`${post.title} imagen`} className="w-14 h-14 rounded-lg object-cover flex-shrink-0 bg-slate-100" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{post.title}</p>
                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-3">
                  <span>{post.author_name}</span>
                  <span>{new Date(post.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{post.likes_count}</span>
                  <span className="flex items-center gap-1">💬{post.comment_count || 0}</span>
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button type="button" onClick={() => handlePreview(post)} className="p-2 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all" title="Vista previa">
                  <Eye className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => openEdit(post)} className="p-2 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all" title="Editar">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => handleDelete(post)} className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all" title="Eliminar">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 animate-in zoom-in-95 duration-200 scrollbar-fino">
            <button type="button" onClick={() => setModalOpen(false)} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-all">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6">{editing ? 'Editar publicación' : 'Nueva publicación'}</h3>

            <div className="space-y-5 p-2 md:p-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Título</label>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Título del artículo" className="w-full pl-10" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Autor</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input type="text" value={form.author_name} onChange={e => setForm({ ...form, author_name: e.target.value })} placeholder="Nombre del autor" className="w-full pl-10" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Extracto</label>
                  <div className="relative">
                    <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input type="text" value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })} placeholder="Resumen breve" className="w-full pl-10" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Imagen destacada</label>
                <ImageUpload folder="blog-images" userId={userId} currentUrl={form.image_url} onUpload={(url) => setForm({ ...form, image_url: url })} maxSizeMB={10} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Contenido</label>
                <div className="relative">
                  <MessageSquare className="absolute top-3.5 left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  <textarea
                    value={form.content}
                    onChange={e => setForm({ ...form, content: e.target.value })}
                    placeholder="Escribe el contenido aquí... Puedes usar **negritas** con markdown"
                    className="w-full pl-10 pr-4 py-2.5 h-64 resize-none font-mono text-sm leading-relaxed rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">Soporta **negritas** y [enlaces](url)</p>
              </div>

              {/* Live preview */}
              {form.content && (
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-5 border border-slate-200 dark:border-slate-700">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Vista previa</p>
                  <h4 className="font-black text-lg text-slate-900 dark:text-white mb-2">{form.title || 'Sin título'}</h4>
                  <div className="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                    {form.content.split('\n').map((line, i) => {
                      const bold = line.split(/(\*\*.*?\*\*)/g);
                      return <p key={i} className="mb-1">{bold.map((part, j) => {
                        const m = part.match(/^\*\*(.*)\*\*$/);
                        return m ? <strong key={j} className="font-bold text-slate-800 dark:text-slate-200">{m[1]}</strong> : part;
                      })}</p>;
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setModalOpen(false)} className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-sm rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                  Cancelar
                </button>
                <button type="button" onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm rounded-lg transition-all disabled:opacity-50 shadow-lg shadow-primary-500/20">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editing ? 'Guardar cambios' : 'Publicar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewOpen && previewPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setPreviewOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xl max-h-[80vh] overflow-y-auto p-6 sm:p-8 animate-in zoom-in-95 duration-200 scrollbar-fino">
            <button type="button" onClick={() => setPreviewOpen(false)} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-all">
              <X className="w-5 h-5" />
            </button>
            {previewPost.image_url && (
              <img src={previewPost.image_url} alt={`${previewPost.title} portada`} className="w-full h-48 object-cover rounded-lg mb-6 bg-slate-100" />
            )}
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
              {previewPost.author_name} · {new Date(previewPost.created_at).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4">{previewPost.title}</h2>
            {previewPost.excerpt && <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 italic">{previewPost.excerpt}</p>}
            <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
              {previewPost.content}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
