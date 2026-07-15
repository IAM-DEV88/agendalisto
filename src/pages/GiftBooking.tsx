import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBusinessBySlug, getService, Service } from '../lib/api';
import { supabase } from '../lib/supabase';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import { toast } from 'react-hot-toast';
import SEO from '../components/SEO';
import PaymentMethodSelector from '../components/PaymentMethodSelector';
import { Gift, Send, User, Mail, Phone, ArrowLeft, CheckCircle, Lock } from 'lucide-react';

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID;

export default function GiftBooking() {
  const { slug, serviceId } = useParams<{ slug: string; serviceId: string }>();
  const navigate = useNavigate();
  const [business, setBusiness] = useState<any>(null);
  const [service, setService] = useState<Service | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sent, setSent] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
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

  const handleProceedToPayment = () => {
    if (!form.recipientName.trim() || !form.recipientEmail.trim()) {
      toast.error('Nombre y email del destinatario son obligatorios');
      return;
    }
    if (!user) {
      toast.error('Debes iniciar sesión para regalar un servicio');
      return;
    }
    if (!service?.can_be_gifted) {
      toast.error('Este servicio no está disponible para regalar');
      return;
    }
    if (!service?.price || service.price <= 0) {
      toast.error('Este servicio no tiene un precio válido para regalar');
      return;
    }
    setShowPayment(true);
  };

  const handlePayPalCreateOrder = async (): Promise<string> => {
    const res = await fetch('/.netlify/functions/create-service-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'paypal',
        amount: service!.price,
        currency: 'COP',
        serviceName: service!.name,
        businessName: business?.name || '',
        userId: user!.id,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.orderId) throw new Error(data.error || 'Error al crear pago');
    return data.orderId;
  };

  const handlePayPalApprove = async (orderId: string) => {
    const code = `GIFT-${Date.now().toString(36).toUpperCase()}`;
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const res = await fetch('/.netlify/functions/capture-service-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'paypal',
        orderId,
        action: 'create_gift',
        actionData: {
          code,
          service_id: serviceId!,
          business_id: business?.id || '',
          sender_user_id: user!.id,
          recipient_name: form.recipientName.trim(),
          recipient_email: form.recipientEmail.trim(),
          recipient_phone: form.recipientPhone.trim() || undefined,
          message: form.message.trim() || undefined,
          expires_at: expiresAt.toISOString(),
          payment_provider: 'paypal',
          payment_amount: service!.price,
          payment_currency: 'COP',
        },
      }),
    });

    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.error || 'Error al capturar pago');
    }

    setGiftCode(code);
    setSent(true);
    toast.success(`¡Regalo enviado! Código: ${code}`);

    const waMsg = encodeURIComponent(`🎁 Te regalaron un servicio en ${business?.name || ''} desde AgendaYa.\n\nServicio: ${service?.name}\nCódigo: ${code}\n\nCanjea aquí: ${window.location.origin}/${slug}\n\nMensaje: ${form.message || '¡Disfrútalo!'}`);
    window.open(`https://wa.me/?text=${waMsg}`, '_blank');
  };

  const handleWompiPay = async () => {
    const code = `GIFT-${Date.now().toString(36).toUpperCase()}`;
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const res = await fetch('/.netlify/functions/create-service-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'wompi',
        amount: service!.price,
        currency: 'COP',
        serviceName: service!.name,
        businessName: business?.name || '',
        userId: user!.id,
        userEmail: user!.email,
        userName: user!.user_metadata?.full_name || form.recipientName,
        action: 'create_gift',
        actionData: {
          code,
          giftCode: code,
          service_id: serviceId!,
          business_id: business?.id || '',
          sender_user_id: user!.id,
          recipient_name: form.recipientName.trim(),
          recipient_email: form.recipientEmail.trim(),
          recipient_phone: form.recipientPhone.trim() || undefined,
          message: form.message.trim() || undefined,
          expires_at: expiresAt.toISOString(),
          amount: service!.price,
          currency: 'COP',
        },
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.checkoutUrl) {
      toast.error(data.error || 'Error al iniciar pago con Wompi');
      return;
    }

    setGiftCode(code);
    window.location.href = data.checkoutUrl;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary-600" /></div>;

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 flex items-center justify-center px-4">
        <div className="text-center max-w-md animate-in fade-in zoom-in-95 duration-500">
          <div className="w-20 h-20 mx-auto mb-6 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3">¡Regalo enviado!</h2>
          <p className="text-slate-500 mb-2">Código de regalo: <strong className="text-primary-600">{giftCode}</strong></p>
          <p className="text-sm text-slate-400 mb-6">Comparte este código con el destinatario para que pueda canjearlo.</p>
          <p className="text-xs text-slate-400 mb-8">El destinatario debe registrarse en AgendaYa y usar el código al reservar.</p>
          <button onClick={() => navigate(`/${slug}`)} className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg transition-all">Volver al negocio</button>
        </div>
      </div>
    );
  }

  const needsPayment = service?.can_be_gifted && service?.price && service.price > 0;

  const content = (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 py-12 px-4">
      <SEO title="Regalar servicio" description="Regala un servicio de AgendaYa a alguien especial." />
      <div className="max-w-lg mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary-600 mb-6 transition-all">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>

        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-8">
          <div className="w-14 h-14 mx-auto mb-5 rounded-lg bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center">
            <Gift className="w-7 h-7 text-rose-500" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white text-center mb-2">Regala {service?.name}</h1>
          <p className="text-sm text-slate-500 text-center mb-8">
            En {business?.name} · {service?.duration} min{service && service.price ? ` · $${service.price.toLocaleString()}` : ''}
          </p>

          {!showPayment ? (
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
                <div className="relative">
                  <Send className="absolute top-3 left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="¡Feliz cumpleaños! Este regalo es para ti..." className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all h-20 resize-none" />
                </div>
              </div>

              {needsPayment && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800/50">
                  <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Al regalar este servicio se cobrará <strong>${service!.price.toLocaleString()} COP</strong>. El destinatario recibirá un código para canjearlo gratis.
                  </p>
                </div>
              )}

              <button onClick={handleProceedToPayment} disabled={!user || !needsPayment}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-all disabled:opacity-50 shadow-lg shadow-rose-500/25"
              >
                <><Send className="w-4 h-4" /> Continuar al pago</>
              </button>

              {!user && <p className="text-xs text-center text-slate-400">Debes <a href="/login" className="font-bold text-primary-600">iniciar sesión</a> para regalar un servicio.</p>}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Resumen del regalo</p>
                <p className="text-xs text-slate-500">
                  Para: {form.recipientName} · {service?.name} · ${service?.price?.toLocaleString()} COP
                </p>
              </div>
              <PaymentMethodSelector
                amount={service?.price || 0}
                currency="COP"
                serviceName={service?.name || ''}
                businessName={business?.name || ''}
                userId={user?.id || ''}
                onPayPalCreateOrder={handlePayPalCreateOrder}
                onPayPalApprove={handlePayPalApprove}
                onWompiPay={handleWompiPay}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (PAYPAL_CLIENT_ID && showPayment && !sent) {
    return (
      <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, vault: false, intent: 'capture' }}>
        {content}
      </PayPalScriptProvider>
    );
  }

  return content;
}
