import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  getBusinessBySlug, 
  getService, 
  Service, 
  Business
} from '../lib/api';
import { supabase } from '../lib/supabase';
import { BookingForm } from '../components/business/public';
import { Clock, ArrowLeft, ChevronLeft, ChevronRight, X, Info, ShieldCheck } from 'lucide-react';

function BookingPage() {
  const { slug, serviceId } = useParams();
  const navigate = useNavigate();
  
  const [businessData, setBusinessData] = useState<Business | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!slug || !serviceId) {
        setError('URL inválida');
        return;
      }

      try {
        setLoading(true);
        
        // Auth check
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate(`/login?redirect=/${slug}/book/${serviceId}`);
          return;
        }
        setUser(user);

        // Get business
        const { success: bSuccess, business, error: bError } = await getBusinessBySlug(slug);
        if (!bSuccess || !business) {
          setError(bError || 'Negocio no encontrado');
          return;
        }
        setBusinessData(business);

        // Get service
        const { success: sSuccess, data: sData, error: sError } = await getService(serviceId);
        if (!sSuccess || !sData) {
          setError(sError || 'Servicio no encontrado');
          return;
        }
        setService(sData);

      } catch (err) {
        setError('Error al cargar la información');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug, serviceId, navigate]);

  const handleNextImage = () => {
    if (!service?.image_urls) return;
    setActiveImageIndex((prev) => (prev + 1) % service.image_urls!.length);
  };

  const handlePrevImage = () => {
    if (!service?.image_urls) return;
    setActiveImageIndex((prev) => (prev - 1 + service.image_urls!.length) % service.image_urls!.length);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !businessData || !service) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
        <div className="card p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <X className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Ups, algo salió mal</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8">{error || 'No pudimos cargar la información de la reserva.'}</p>
          <Link to="/" className="btn-primary">Volver al inicio</Link>
        </div>
      </div>
    );
  }

  const images = Array.isArray(service.image_urls) ? service.image_urls : [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Header Simplificado */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <button 
            onClick={() => navigate(`/${slug}`)}
            className="flex items-center gap-2 text-slate-500 hover:text-primary-600 font-bold transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Volver a {businessData.name}</span>
          </button>
          <div className="text-center flex-grow">
            <h1 className="text-sm font-black text-slate-400 uppercase tracking-widest">Agendamiento de Cita</h1>
          </div>
          <div className="w-20 sm:w-32 flex justify-end">
            <img 
              src={businessData.logo_url || 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png'} 
              className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
              alt="Logo"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Columna Izquierda: Información del Servicio */}
          <div className="lg:col-span-5 space-y-6">
            {/* Galería si existe */}
            {images.length > 0 && (
              <div className="card overflow-hidden group relative">
                <div className="relative aspect-square sm:aspect-video lg:aspect-square bg-slate-100 dark:bg-slate-800">
                  <img 
                    src={images[activeImageIndex]} 
                    alt={service.name}
                    className="w-full h-full object-cover cursor-zoom-in"
                    onClick={() => setFullscreenImage(images[activeImageIndex])}
                  />
                  
                  {images.length > 1 && (
                    <>
                      <button 
                        onClick={handlePrevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full backdrop-blur-md transition-all opacity-0 group-hover:opacity-100"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button 
                        onClick={handleNextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full backdrop-blur-md transition-all opacity-0 group-hover:opacity-100"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {images.map((_, i) => (
                          <div 
                            key={i} 
                            className={`w-2 h-2 rounded-full transition-all ${i === activeImageIndex ? 'bg-white scale-125' : 'bg-white/40'}`} 
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Detalles del Servicio */}
            <div className="card p-8">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                  {service.name}
                </h2>
                {businessData.config?.mostrar_precios && (
                  <span className="text-3xl font-black text-primary-600 dark:text-primary-400">
                    ${service.price.toLocaleString()}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-6 mb-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Clock className="w-5 h-5 text-primary-500" />
                  <span className="font-bold">{service.duration} minutos</span>
                </div>
                <div className="h-4 w-px bg-slate-200 dark:bg-slate-700"></div>
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <span className="font-bold">Reserva Segura</span>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Descripción del servicio
                </h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg">
                  {service.description}
                </p>
              </div>

              {service.provider && (
                <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-primary-600">
                      <span className="text-lg font-black">{service.provider.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Profesional a cargo</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">{service.provider}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Columna Derecha: Formulario de Reserva */}
          <div className="lg:col-span-7">
            <div className="card p-8 lg:p-10 border-primary-100 dark:border-primary-900/30 bg-white dark:bg-slate-900 shadow-2xl">
              <BookingForm
                businessId={businessData.id}
                serviceId={service.id}
                userId={user.id}
                service={service}
                onClose={() => navigate(`/${slug}`)}
                showPrices={businessData.config?.mostrar_precios ?? true}
                requireConfirmation={businessData.config?.requiere_confirmacion}
                notifyEmail={businessData.config?.notificaciones_email}
                notifyWhatsapp={businessData.config?.notificaciones_whatsapp}
                minCancellationHours={businessData.config?.tiempo_minimo_cancelacion}
              />
            </div>
          </div>

        </div>
      </div>

      {/* Lightbox */}
      {fullscreenImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-in fade-in duration-300"
          onClick={() => setFullscreenImage(null)}
        >
          <button className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors">
            <X className="w-8 h-8" />
          </button>
          <img 
            src={fullscreenImage} 
            className="max-w-full max-h-full rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300" 
            alt="Fullscreen" 
          />
        </div>
      )}
    </div>
  );
}

export default BookingPage;