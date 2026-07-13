import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getBusinessBySlug,
  getService,
  Service,
  Business
} from '../lib/api';
import { supabase } from '../lib/supabase';
import { BookingForm } from '../components/business/public';
import { ArrowLeft, ChevronLeft, ChevronRight, X, Store, Calendar, Clock, Mail, User, Phone, Eye, CheckCircle } from 'lucide-react';
import EmptyState from '../components/ui/EmptyState';
import SEO from '../components/SEO';


function BookingPageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 pb-20 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-lg w-32 animate-pulse" />
          <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="aspect-video bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
            <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-lg w-3/4 animate-pulse" />
          </div>
          <div className="space-y-4">
            <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/2 animate-pulse" />
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-full animate-pulse" />
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-3/4 animate-pulse" />
            <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

function BookingPage() {
  const { slug, serviceId } = useParams();
  const navigate = useNavigate();

  const [businessData, setBusinessData] = useState<Business | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [guestMode, setGuestMode] = useState(false);
  const [guestInfo, setGuestInfo] = useState({ name: '', email: '', phone: '' });

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  const isOwner = !!user && !!businessData && user.id === businessData.owner_id;

  useEffect(() => {
    const fetchData = async () => {
      if (!slug || !serviceId) { setError('URL inválida'); return; }
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        setGuestMode(!user);

        const { success: bS, business, error: bE } = await getBusinessBySlug(slug);
        if (!bS || !business) { setError(bE || 'Negocio no encontrado'); return; }
        if (business.showcase_only && (!user || user.id !== business.owner_id)) { setError('Este negocio no acepta reservas online'); navigate(`/${slug}`); return; }
        setBusinessData(business);

        const { success: sS, data: sD, error: sE } = await getService(serviceId);
        if (!sS || !sD) { setError(sE || 'Servicio no encontrado'); return; }
        setService(sD);
      } catch { setError('Error al cargar la información'); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [slug, serviceId]);

  const images = service?.image_urls
    ? (Array.isArray(service.image_urls) ? service.image_urls : [])
    : [];

  if (loading) return <BookingPageSkeleton />;

  if (error || !businessData || !service) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
        <EmptyState
          icon={<Store className="w-10 h-10" />}
          title="No pudimos cargar la reserva"
          description={error || 'La información solicitada no está disponible.'}
          action={{ label: 'Volver al inicio', to: '/' }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 pb-20">
      <SEO title={`Reservar ${service.name} — ${businessData.name}`} />

      {/* Sticky Header */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate(`/${slug}`)}
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Volver</span>
          </button>
          <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
            <Calendar className="w-3.5 h-3.5" />
            Agendar cita
          </div>
          <div className="flex items-center">
            <img
              src={businessData.logo_url || 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png'}
              className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
              alt="Logo"
            />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
          {/* ─── LEFT: Service Summary + Confirmation Banner ─── */}
          <div className="lg:col-span-2 space-y-5">
            {/* Service header card — image as small thumbnail */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
              <div className="flex items-start gap-4">
                {images.length > 0 && (
                  <div
                    className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-zoom-in flex-shrink-0 shadow-sm border border-slate-200 dark:border-slate-700"
                    onClick={() => setFullscreenImage(images[0])}
                  >
                    <img
                      src={images[0]}
                      alt={service.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="font-black text-lg sm:text-xl text-slate-900 dark:text-white leading-tight mb-0">{service.name}</h2>
                  <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-1.5">
                    <div className="flex items-center gap-1 text-sm font-bold text-slate-500 dark:text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-primary-500" />
                      {service.duration} min
                    </div>
                    {(businessData.config?.mostrar_precios ?? true) && service.price > 0 && (
                      <div className="text-base font-black text-primary-600 dark:text-primary-400">
                        ${service.price.toLocaleString()}
                      </div>
                    )}
                    {service.provider && (
                      <div className="text-sm font-bold text-slate-500 dark:text-slate-400">
                        Encargado: {service.provider}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {service.description && (
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  {service.description}
                </p>
              )}
            </div>

            {/* Gallery for multiple images — compact like marketplace */}
            {images.length > 1 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 space-y-3">
                <div className="relative aspect-video bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden group">
                  <img
                    src={images[activeImageIndex]}
                    alt={service.name}
                    className="w-full h-full object-contain bg-slate-100 dark:bg-slate-800 cursor-zoom-in transition-transform duration-300 group-hover:scale-105"
                    onClick={() => setFullscreenImage(images[activeImageIndex])}
                  />
                  <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                  <span className="absolute top-2 right-2 px-2 py-0.5 bg-black/40 backdrop-blur-sm text-white text-[10px] font-bold rounded-lg">
                    {activeImageIndex + 1}/{images.length}
                  </span>
                  <button onClick={() => setActiveImageIndex(prev => (prev - 1 + images.length) % images.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/80 hover:bg-white text-slate-700 rounded-lg shadow-sm transition-all opacity-0 group-hover:opacity-100">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={() => setActiveImageIndex(prev => (prev + 1) % images.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/80 hover:bg-white text-slate-700 rounded-lg shadow-sm transition-all opacity-0 group-hover:opacity-100">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                  {images.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImageIndex(i)}
                      className={`w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                        i === activeImageIndex
                          ? 'border-primary-500 ring-1 ring-primary-500/30 shadow-sm'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt="" className="w-full h-full object-contain bg-slate-100 dark:bg-slate-800" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Confirmation banner */}
            {!isOwner && (
              <div className={`rounded-2xl p-4 border flex items-start gap-3 ${
                businessData.config?.requiere_confirmacion
                  ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/50'
                  : 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/50'
              }`}>
                {businessData.config?.requiere_confirmacion ? (
                  <>
                    <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-amber-800 dark:text-amber-300 mb-0">Requiere confirmación</p>
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5 mb-0">
                        El negocio revisará tu solicitud y confirmará la cita manualmente.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300 mb-0">Reserva inmediata</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 mb-0">
                        Tu cita será agendada automáticamente sin necesidad de confirmación.
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Rescheduling & cancellation policy */}
            {!isOwner && (service.cancellation_policy_text || service.reschedule_policy_text) && (
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Políticas</p>
                {service.cancellation_policy_text && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cancelación</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-0">{service.cancellation_policy_text}</p>
                  </div>
                )}
                {service.reschedule_policy_text && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Reagendamiento</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-0">{service.reschedule_policy_text}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ─── RIGHT: Booking Form ─── */}
          <div className="lg:col-span-3 space-y-4">
            {isOwner && (
              <div className="bg-primary-50 dark:bg-primary-900/20 rounded-2xl p-4 border border-primary-200 dark:border-primary-800/50 flex items-start gap-3">
                <Eye className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-primary-800 dark:text-primary-300">Vista previa — Tu negocio</p>
                  <p className="text-xs text-primary-600 dark:text-primary-400 mt-0.5">
                    Esta es la vista pública de tu servicio. No puedes agendar citas en tu propio negocio.
                  </p>
                </div>
              </div>
            )}
            {guestMode && (
              <div className="bg-amber-50 dark:bg-amber-900/10 rounded-2xl p-5 border border-amber-200 dark:border-amber-800/50">
                <p className="text-sm font-bold text-amber-800 dark:text-amber-300 mb-3">
                  Reserva sin cuenta
                </p>
                <div className="space-y-3">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={guestInfo.name}
                      onChange={(e) => setGuestInfo({ ...guestInfo, name: e.target.value })}
                      placeholder="Tu nombre"
                      className="w-full pl-10 py-2.5 text-sm rounded-xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={guestInfo.email}
                      onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
                      placeholder="Tu correo"
                      className="w-full pl-10 py-2.5 text-sm rounded-xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      value={guestInfo.phone}
                      onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })}
                      placeholder="Tu teléfono"
                      className="w-full pl-10 py-2.5 text-sm rounded-xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>
              </div>
            )}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none p-6 sm:p-8">
              <BookingForm
                businessId={businessData.id}
                businessName={businessData.name}
                businessAddress={businessData.address}
                serviceId={service.id}
                userId={user?.id}
                service={service}
                onClose={() => navigate(`/${slug}`)}
                showPrices={businessData.config?.mostrar_precios ?? true}
                requireConfirmation={businessData.config?.requiere_confirmacion}
                notifyEmail={businessData.config?.notificaciones_email}
                notifyWhatsapp={businessData.config?.notificaciones_whatsapp}
                minCancellationHours={service.min_cancellation_hours ?? 48}
                guestInfo={guestMode ? guestInfo : undefined}
                isOwnerPreview={isOwner}
                slotIntervalMinutes={businessData.config?.slot_interval_minutes ?? 30}
                bufferMinutes={businessData.config?.buffer_minutes ?? 0}
                maxAdvanceBookingDays={businessData.config?.max_advance_booking_days ?? 90}
              />
              {guestMode && (
                <p className="text-xs text-slate-400 text-center mt-4">
                  ¿Ya tienes cuenta?{' '}
                  <a href={`/login?redirect=/${slug}/book/${serviceId}`} className="font-bold text-primary-600 hover:text-primary-500">
                    Inicia sesión
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {fullscreenImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-in fade-in duration-200" onClick={() => setFullscreenImage(null)}>
          <button onClick={() => setFullscreenImage(null)} className="absolute top-5 right-5 p-2 text-white/50 hover:text-white transition-colors">
            <X className="w-7 h-7" />
          </button>
          <img src={fullscreenImage} className="max-w-full max-h-full rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200" alt="Fullscreen" />
        </div>
      )}
    </div>
  );
}

export default BookingPage;
