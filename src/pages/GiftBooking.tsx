import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBusinessBySlug, getService, createGiftCode, Service } from '../lib/api';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import SEO from '../components/SEO';
import { Gift, Send, User, Mail, Phone, ArrowLeft, CheckCircle } from 'lucide-react';

export default function GiftBooking() {
  const { slug, serviceId } = useParams<{ slug: string; serviceId: string }>();
  const navigate = useNavigate();
  const [business, setBusiness] = useState<any>(null);
  const [service, setService] = useState<Service | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ recipientName: '', recipientEmail: '', recipientPhone: '', message: '' });
  const [giftCode, setGiftCode] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    if (!slug || !serviceId) return;
    Promise.all([
      getBusinessBySlug(slug).then(r => { if (r.success) setBusiness(r.business); }),
      getService(serviceId).then(r => { if (r.success && r.data) setService(r.data); }),
    ]).finally(() => setLoading(false));
  }, [slug, serviceId]);

  const handleSend = async () => {
    if (!form.recipientName.trim() || !form.recipientEmail.trim()) {
      toast.error('Nombre y email del destinatario son obligatorios');
      return;
    }
    if (!user) {
      toast.error('Debes iniciar sesión para regalar un servicio');
      return;
    }
    setSending(true);
    const code = `GIFT-${Date.now().toString(36).toUpperCase()}`;
    setGiftCode(code);

    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const { success, error } = await createGiftCode({
      code,
      service_id: serviceId!,
      business_id: business?.id || '',
      sender_user_id: user.id,
      recipient_name: form.recipientName.trim(),
      recipient_email: form.recipientEmail.trim(),
      recipient_phone: form.recipientPhone.trim() || undefined,
      message: form.message.trim() || undefined,
      expires_at: expiresAt.toISOString(),
    });

    if (!success) {
      toast.error(error || 'Error al generar el código de regalo');
      setSending(false);
      return;
    }

    setSent(true);
    setSending(false);
    toast.success(`¡Regalo enviado! Código: ${code}`);

    const waMsg = encodeURIComponent(`🎁 Te regalaron un servicio en ${business?.name || ''} desde AgendaYa.
 
Servicio: ${service?.name}
Código: ${code}
 
Canjea aquí: ${window.location.origin}/${slug}

Mensaje: ${form.message || '¡Disfrútalo!'}`);
    window.open(`https://wa.me/?text=${waMsg}`, '_blank');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary-600" /></div>;

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 flex items-center justify-center px-4">
        <div className="text-center max-w-md animate-in fade-in zoom-in-95 duration-500">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3">¡Regalo enviado!</h2>
          <p className="text-slate-500 mb-2">Código de regalo: <strong className="text-primary-600">{giftCode}</strong></p>
          <p className="text-sm text-slate-400 mb-6">Comparte este código con el destinatario para que pueda canjearlo.</p>
          <p className="text-xs text-slate-400 mb-8">El destinatario debe registrarse en AgendaYa y usar el código al reservar.</p>
          <button onClick={() => navigate(`/${slug}`)} className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all">Volver al negocio</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 py-12 px-4">
      <SEO title="Regalar servicio" description="Regala un servicio de AgendaYa a alguien especial." />
      <div className="max-w-lg mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary-600 mb-6 transition-all">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>

        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-8">
          <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center">
            <Gift className="w-7 h-7 text-rose-500" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white text-center mb-2">Regala {service?.name}</h1>
          <p className="text-sm text-slate-500 text-center mb-8">
            En {business?.name} · {service?.duration} min{service && service.price ? ` · $${service.price.toLocaleString()}` : ''}
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Nombre del destinatario</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" value={form.recipientName} onChange={e => setForm({ ...form, recipientName: e.target.value })} placeholder="Nombre completo" className="w-full pl-10" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Email del destinatario</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="email" value={form.recipientEmail} onChange={e => setForm({ ...form, recipientEmail: e.target.value })} placeholder="correo@ejemplo.com" className="w-full pl-10" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Teléfono del destinatario (opcional)</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="tel" value={form.recipientPhone} onChange={e => setForm({ ...form, recipientPhone: e.target.value })} placeholder="+57 300..." className="w-full pl-10" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Mensaje personalizado (opcional)</label>
              <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="¡Feliz cumpleaños! Este regalo es para ti..." className="w-full h-20 resize-none" />
            </div>

            <button onClick={handleSend} disabled={sending || !user}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-rose-500/25"
            >
              {sending ? 'Enviando...' : <><Send className="w-4 h-4" /> Enviar regalo por WhatsApp</>}
            </button>

            {!user && <p className="text-xs text-center text-slate-400">Debes <a href="/login" className="font-bold text-primary-600">iniciar sesión</a> para regalar un servicio.</p>}
            <p className="text-[10px] text-slate-400 text-center leading-relaxed">
              Al enviar, se generará un código único que el destinatario usará al reservar el servicio.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
