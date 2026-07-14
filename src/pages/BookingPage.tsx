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
import { ArrowLeft, X, Calendar, Eye, Store } from 'lucide-react';
import EmptyState from '../components/ui/EmptyState';
import SEO from '../components/SEO';


function BookingPageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 pb-20 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-lg w-32 animate-pulse" />
          <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        <div className="aspect-video sm:aspect-[21/9] bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-2/3 animate-pulse" />
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-full animate-pulse" />
        <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
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
  const [onlineBookable, setOnlineBookable] = useState(true);

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
        setBusinessData(business);

        const { success: sS, data: sD, error: sE } = await getService(serviceId);
        if (!sS || !sD) { setError(sE || 'Servicio no encontrado'); return; }
        setOnlineBookable(sD.permitir_reservas_online !== false && !business.showcase_only);
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate(`/${slug}`)}
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Volver</span>
          </button>
          <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
            {onlineBookable || isOwner ? <><Calendar className="w-3.5 h-3.5" /> Agendar cita</> : <><Eye className="w-3.5 h-3.5" /> Información</>}
          </div>
          <div className="flex items-center">
            {businessData.logo_url && (
              <img
                src={businessData.logo_url}
                className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                alt={businessData.name}
              />
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* ─── Owner preview banner ─── */}
        {isOwner && (
          <div className="bg-primary-50 dark:bg-primary-900/20 rounded-2xl p-4 mb-6 border border-primary-200 dark:border-primary-800/50 flex items-start gap-3">
            <Eye className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-primary-800 dark:text-primary-300">Vista previa — Tu negocio</p>
              <p className="text-xs text-primary-600 dark:text-primary-400 mt-0.5">
                Esta es la vista pública de tu servicio. No puedes agendar citas en tu propio negocio.
              </p>
            </div>
          </div>
        )}

        {/* ─── Booking Form unificado ─── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none p-5 sm:p-6">
          <BookingForm
            businessId={businessData.id}
            businessName={businessData.name}
            businessAddress={businessData.address}
            businessContact={{ phone: businessData.phone || undefined, email: businessData.email || undefined, whatsapp: businessData.whatsapp || undefined, address: businessData.address || undefined }}
            serviceId={service.id}
            userId={user?.id}
            service={service}
            onClose={() => navigate(`/${slug}`)}
            showPrices={service.mostrar_precios ?? true}
            requireConfirmation={service.requiere_confirmacion ?? true}
            notifyEmail={businessData.config?.notificaciones_email}
            notifyWhatsapp={businessData.config?.notificaciones_whatsapp}
            minCancellationHours={service.min_cancellation_hours ?? 48}
            minRescheduleHours={service.min_reschedule_hours ?? 48}
            isOwnerPreview={isOwner}
            onlineBookable={onlineBookable}
            slotIntervalMinutes={businessData.config?.slot_interval_minutes ?? 30}
            bufferMinutes={businessData.config?.buffer_minutes ?? 0}
            maxAdvanceBookingDays={businessData.config?.max_advance_booking_days ?? 90}
            images={images}
            activeImageIndex={activeImageIndex}
            onImageChange={setActiveImageIndex}
            onFullscreenImage={setFullscreenImage}
            cancellationPolicy={service.cancellation_policy_text}
            reschedulePolicy={service.reschedule_policy_text}
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
