import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getBusinessBySlug,
  getService,
  getBusinessCategories,
  Service,
  Business,
  BusinessCategory
} from '../lib/api';
import { supabase } from '../lib/supabase';
import { BookingForm } from '../components/business/public';
import { ArrowLeft, X, Clock, Store, User, MessageCircle, Phone, Mail, Info, Heart } from 'lucide-react';
import EmptyState from '../components/ui/EmptyState';
import SEO from '../components/SEO';
import type { Tab } from '../components/ui/TabNav';
import StickyGlassHeader from '../components/ui/StickyGlassHeader';
import ConnectedPillCard from '../components/ui/ConnectedPillCard';
import { useStickyDetection } from '../hooks/useStickyDetection';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';


function BookingPageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 pb-20 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-lg w-32 animate-pulse" />
          <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        <div className="aspect-video sm:aspect-[21/9] bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-2/3 animate-pulse" />
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-full animate-pulse" />
        <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
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
  const [onlineBookable, setOnlineBookable] = useState(true);
  const [activeBookTab, setActiveBookTab] = useState('detalles');

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  useLockBodyScroll(!!fullscreenImage);
  const [categories, setCategories] = useState<BusinessCategory[]>([]);

  const { ref: headerSentinelRef, stuck: headerStuck } = useStickyDetection(65, !loading);

  const isOwner = !!user && !!businessData && user.id === businessData.owner_id;

  useEffect(() => {
    const fetchData = async () => {
      if (!slug || !serviceId) { setError('URL inválida'); return; }
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        const { success: bS, business, error: bE } = await getBusinessBySlug(slug);
        if (!bS || !business) { setError(bE || 'Negocio no encontrado'); return; }
        setBusinessData(business);

        const { success: sS, data: sD, error: sE } = await getService(serviceId);
        if (!sS || !sD) { setError(sE || 'Servicio no encontrado'); return; }
        setOnlineBookable(sD.permitir_reservas_online !== false && !business.showcase_only);
        setService(sD);

        getBusinessCategories().then(res => {
          if (res.success && res.data) setCategories(res.data);
        });
      } catch { setError('Error al cargar la información'); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [slug, serviceId]);

  const handleUserRegistered = async () => {
    const { data: { user: freshUser } } = await supabase.auth.getUser();
    if (freshUser) setUser(freshUser);
  };

  const images = service?.image_urls
    ? (Array.isArray(service.image_urls) ? service.image_urls : [])
    : [];

  const bookTabs: Tab[] = [
    { id: 'detalles', label: 'Detalles' },
    { id: 'agendar', label: 'Agendar' },
    ...(service?.can_be_gifted ? [{ id: 'regalar', label: 'Regalar' }] : []),
  ];

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

      {/* Back button */}
      <div className="max-w-7xl mx-auto px-4 pt-4 pb-2">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-500 hover:text-primary-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver</span>
        </button>
      </div>

      {/* Sentinel for sticky detection */}
      <div ref={headerSentinelRef} className="h-px" />

      {/* Sticky Header: business + service */}
      <StickyGlassHeader stuck={headerStuck} data-underline-nav>
        <div className="flex items-center gap-3">
          <div className="shrink-0">
            {businessData.logo_url ? (
              <img
                src={businessData.logo_url}
                width={80}
                height={80}
                className="w-20 h-20 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                alt={businessData.name}
              />
            ) : (
              <div className="w-20 h-20 rounded-lg bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center">
                <Store className="w-8 h-8 text-primary-500" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-base font-black text-slate-900 dark:text-white truncate leading-tight">{businessData.name}</p>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate leading-tight">{service.name}</p>
            <div className="flex flex-wrap items-center gap-1 mt-1">
              {(() => {
                const cat = categories.find(c => c.id === businessData.category_id);
                return cat ? (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300 text-[10px] font-bold">{cat.name}</span>
                ) : null;
              })()}
              {businessData.plan && businessData.plan !== 'starter' && (
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                  businessData.plan === 'premium'
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                }`}>{businessData.plan}</span>
              )}
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-bold">
                <Heart className="w-2.5 h-2.5" />{service.likes_count}
              </span>
            </div>
          </div>
        </div>
      </StickyGlassHeader>

      <div className="max-w-7xl mx-auto px-4 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* ─── Owner preview indicator ─── */}
        {isOwner && (
          <div className="flex items-center gap-2 px-4 py-2 mb-6 bg-primary-50/50 dark:bg-primary-900/10 rounded-lg border border-primary-200/50 dark:border-primary-800/30">
            <div className="w-2 h-2 rounded-full bg-primary-500 shrink-0" />
            <p className="text-xs font-medium text-primary-600 dark:text-primary-400">
              Vista pública de tu servicio — Vista previa
            </p>
          </div>
        )}

        {/* ─── Pill TabNav + connected card ─── */}
        <ConnectedPillCard tabs={bookTabs} activeTabId={activeBookTab} onTabChange={setActiveBookTab}>
            <div className="animate-in fade-in zoom-in-95 duration-300">

              {/* ── Agenda ── */}
              {activeBookTab === 'agendar' && (
                <BookingForm
                  hideHero
                  hideGift
                  businessId={businessData.id}
                  businessName={businessData.name}
                  businessAddress={businessData.address}
                  businessContact={{ phone: businessData.phone || undefined, email: businessData.email || undefined, whatsapp: businessData.whatsapp || undefined, address: businessData.address || undefined }}
                  serviceId={service.id}
                  userId={user?.id}
                  service={service}
                  onClose={() => navigate(-1)}
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
                  onUserRegistered={handleUserRegistered}
                />
              )}

              {/* ── Detalles ── */}
              {activeBookTab === 'detalles' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400 rounded-lg">
                      <Info className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Información del Servicio</h3>
                  </div>

                  {/* Service details grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Precio</p>
                      <p className="text-lg font-black text-slate-900 dark:text-white">
                        {service.mostrar_precios !== false ? `$${service.price.toLocaleString()}` : 'Consultar'}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Duración</p>
                      <p className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-400" />
                        {service.duration} min
                      </p>
                    </div>
                    {service.provider && (
                      <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Profesional</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-400" />
                          {service.provider}
                        </p>
                      </div>
                    )}
                    {service.requires_payment && (
                      <div className="p-4 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-500/10">
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Pago</p>
                        <p className="text-sm font-bold text-blue-800 dark:text-blue-300">Requiere pago del {service.payment_percentage}% para reservar</p>
                      </div>
                    )}
                    <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Reserva online</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {service.permitir_reservas_online !== false && !businessData.showcase_only ? 'Disponible' : 'Solo consulta'}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Confirmación</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {service.requiere_confirmacion ? 'Requiere confirmación' : 'Automática'}
                      </p>
                    </div>
                  </div>

                  {/* Términos y tiempos */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg">
                        <Clock className="w-4 h-4" />
                      </div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">Términos y tiempos</h4>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Duración</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white">{service.duration} min</p>
                      </div>
                      <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Cancelación</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white">{service.min_cancellation_hours ?? 48}h antes</p>
                      </div>
                      <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Reprogramación</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white">{service.min_reschedule_hours ?? 48}h antes</p>
                      </div>
                      <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Antelación máx.</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white">{businessData.config?.max_advance_booking_days ?? 90} días</p>
                      </div>
                      {businessData.config?.slot_interval_minutes ? (
                        <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Intervalo</p>
                          <p className="text-sm font-black text-slate-900 dark:text-white">C/{businessData.config.slot_interval_minutes} min</p>
                        </div>
                      ) : null}
                      {businessData.config?.buffer_minutes ? (
                        <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Tiempo entre citas</p>
                          <p className="text-sm font-black text-slate-900 dark:text-white">{businessData.config.buffer_minutes} min</p>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Description */}
                  {service.description && (
                    <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Descripción</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">{service.description}</p>
                    </div>
                  )}

                  {/* Policies */}
                  {(service.cancellation_policy_text || service.reschedule_policy_text) && (
                    <div className="space-y-3">
                      {service.cancellation_policy_text && (
                        <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Política de cancelación</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{service.cancellation_policy_text}</p>
                        </div>
                      )}
                      {service.reschedule_policy_text && (
                        <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Política de reprogramación</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{service.reschedule_policy_text}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Image gallery */}
                  {images.length > 0 && (
                    <div className="space-y-3">
                      <div className="relative aspect-video sm:aspect-[21/9] rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                        <img
                          src={images[activeImageIndex]}
                          alt={service.name}
                          className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setFullscreenImage(images[activeImageIndex])}
                        />
                        {images.length > 1 && (
                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                            {images.map((_, i) => (
                              <button
                                key={i}
                                onClick={(e) => { e.stopPropagation(); setActiveImageIndex(i); }}
                                className={`w-2 h-2 rounded-full transition-all ${i === activeImageIndex ? 'bg-white w-4' : 'bg-white/50 hover:bg-white/80'}`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 overflow-x-auto no-scrollbar">
                        {images.map((img, i) => (
                          <button
                            key={i}
                            onClick={() => setActiveImageIndex(i)}
                            className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${i === activeImageIndex ? 'border-primary-500 ring-1 ring-primary-500' : 'border-transparent opacity-60 hover:opacity-100'}`}
                          >
                            <img src={img} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contact */}
                  <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Contacto del negocio</p>
                    <div className="space-y-2">
                      {businessData.phone && (
                        <a href={`tel:${businessData.phone}`} className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-primary-600 transition-colors">
                          <Phone className="w-4 h-4 text-primary-500" /> {businessData.phone}
                        </a>
                      )}
                      {businessData.whatsapp && (
                        <a href={`https://wa.me/${businessData.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-300 hover:text-emerald-600 transition-colors">
                          <MessageCircle className="w-4 h-4" /> WhatsApp
                        </a>
                      )}
                      {businessData.email && (
                        <a href={`mailto:${businessData.email}`} className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-primary-600 transition-colors">
                          <Mail className="w-4 h-4 text-primary-500" /> {businessData.email}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Regalo ── */}
              {activeBookTab === 'regalar' && service.can_be_gifted && (
                <BookingForm
                  hideHero
                  hideForm
                  hideGift={false}
                  businessId={businessData.id}
                  businessName={businessData.name}
                  businessAddress={businessData.address}
                  businessContact={{ phone: businessData.phone || undefined, email: businessData.email || undefined, whatsapp: businessData.whatsapp || undefined, address: businessData.address || undefined }}
                  serviceId={service.id}
                  userId={user?.id}
                  service={service}
                  onClose={() => navigate(-1)}
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
                  onUserRegistered={handleUserRegistered}
                />
              )}
            </div>
        </ConnectedPillCard>

      {/* Lightbox */}
      {fullscreenImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-in fade-in duration-200" onClick={() => setFullscreenImage(null)}>
          <button type="button" onClick={() => setFullscreenImage(null)} className="absolute top-5 right-5 p-2 text-white/50 hover:text-white transition-colors">
            <X className="w-7 h-7" />
          </button>
          <img src={fullscreenImage} className="max-w-full max-h-full rounded-lg shadow-2xl animate-in zoom-in-95 duration-200" alt="Fullscreen" />
        </div>
      )}
      </div>
    </div>
  );
}

export default BookingPage;
