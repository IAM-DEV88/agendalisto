import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ChevronLeft, ChevronRight, X, Heart, Gift } from 'lucide-react';
import { Service, toggleLike, checkIfLiked } from '../../../lib/api';
import { toast } from 'react-hot-toast';
import ShareButton from '../../ui/ShareButton';
import { useLockBodyScroll } from '../../../hooks/useLockBodyScroll';

interface ServicesListProps {
  services: Service[];
  currentUser: import('@supabase/supabase-js').User | null;
  businessOwnerId: string;
  showcaseOnly?: boolean;
}

const ServiceCard: React.FC<{
  service: Service;
  currentUser: import('@supabase/supabase-js').User | null;
  businessOwnerId: string;
  handlePrevImage: (e: React.MouseEvent, serviceId: string, max: number) => void;
  handleNextImage: (e: React.MouseEvent, serviceId: string, max: number) => void;
  openFullscreen: (e: React.MouseEvent, url: string) => void;
  currentImgIdx: number;
  showcaseOnly?: boolean;
}> = ({ service, currentUser, businessOwnerId, handlePrevImage, handleNextImage, openFullscreen, currentImgIdx, showcaseOnly }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(service.likes_count || 0);
  const [isLiking, setIsLiking] = useState(false);
  useEffect(() => {
    if (currentUser?.id && service.id) {
      checkIfLiked(currentUser.id, service.id, 'service').then(setIsLiked);
    }
  }, [currentUser, service.id]);

  const handleToggleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser) { toast.error('Debes iniciar sesión'); return; }
    try {
      setIsLiking(true);
      const result = await toggleLike(currentUser.id, service.id, 'service');
      if (result.success) {
        setIsLiked(result.action === 'added');
        setLikesCount(prev => result.action === 'added' ? prev + 1 : prev - 1);
        toast.success(result.action === 'added' ? 'Añadido a favoritos' : 'Eliminado de favoritos');
      }
    } catch { toast.error('Error al procesar'); } finally { setIsLiking(false); }
  };

  const shareUrl = `${window.location.origin}${window.location.pathname}/book/${service.id}`;

  let images: string[] = [];
  if (Array.isArray(service.image_urls)) {
    images = service.image_urls;
  } else if (typeof service.image_urls === 'string') {
    try { images = JSON.parse(service.image_urls); } catch { images = []; }
  }

  const hasImages = images.length > 0;
  const canBook = service.permitir_reservas_online !== false;
  const isOwner = currentUser && currentUser.id === businessOwnerId;
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/${window.location.pathname.split('/')[1]}/book/${service.id}`)}
      className={`relative flex flex-col rounded-lg border transition-all overflow-hidden cursor-pointer group border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-2xl ${
        isOwner ? 'ring-2 ring-primary-300 dark:ring-primary-700' : ''
      }`}
    >
      {/* Gallery */}
      {hasImages && (
        <div className="relative aspect-video overflow-hidden bg-slate-100 dark:bg-slate-800">
          <img
            src={images[currentImgIdx]}
            alt={service.name}
            className="w-full h-full object-contain bg-slate-100 dark:bg-slate-800 transition-transform duration-500 group-hover:scale-105"
            onClick={(e) => openFullscreen(e, images[currentImgIdx])}
          />
          {images.length > 1 && (
            <>
              <button type="button" onClick={(e) => handlePrevImage(e, service.id, images.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/30 hover:bg-black/50 text-white rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button type="button" onClick={(e) => handleNextImage(e, service.id, images.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/30 hover:bg-black/50 text-white rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100">
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {images.map((_, i) => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentImgIdx ? 'bg-white scale-125' : 'bg-white/40'}`} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h4 className="font-black text-lg tracking-tight text-slate-900 dark:text-white">
            {service.name}
          </h4>
          {service.mostrar_precios !== false && service.price ? (
            <span className="text-lg font-black text-primary-600 dark:text-primary-400 flex-shrink-0">
              ${service.price.toLocaleString()}
            </span>
          ) : null}
        </div>

        {service.description && (
          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 mb-4 leading-relaxed flex-1 whitespace-pre-line">
            {service.description}
          </p>
        )}

        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 dark:text-slate-500">
            <Clock className="w-3.5 h-3.5" />
            {service.duration} min
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleToggleLike}
              disabled={isLiking}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                isLiked ? 'bg-rose-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Heart className={`w-3 h-3 ${isLiked ? 'fill-current' : ''}`} />
              {likesCount}
            </button>
            <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-1">
              {service.can_be_gifted && (
                <a
                  href={`/${window.location.pathname.split('/')[1]}/gift/${service.id}`}
                  onClick={(e) => { e.stopPropagation(); }}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-black transition-all bg-rose-50 dark:bg-rose-900/20 text-rose-500 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40"
                  title="Regalar este servicio"
                >
                  <Gift className="w-3 h-3" />
                </a>
              )}
              <ShareButton
                url={shareUrl}
                title={`Reservar: ${service.name}`}
                variant="text"
                iconSize={12}
                className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              />
            </div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <a href={`/${window.location.pathname.split('/')[1]}/book/${service.id}`}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-[11px] font-bold rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-all active:scale-[0.98]">
            {showcaseOnly || !canBook ? 'Ver información' : 'Reservar ahora'} <ChevronRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {isOwner && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-center text-[10px] font-black uppercase tracking-widest text-primary-500">
            Tu negocio — Vista previa
          </div>
        )}
      </div>
    </div>
  );
};

const ServicesList: React.FC<ServicesListProps> = ({
  services, currentUser, businessOwnerId, showcaseOnly,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState<Record<string, number>>({});
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  useLockBodyScroll(!!fullscreenImage);

  if (!services || services.length === 0) {
    return (
      <p className="text-sm text-slate-400 italic text-center py-8">No hay servicios disponibles</p>
    );
  }

  const handleNextImage = (e: React.MouseEvent, serviceId: string, max: number) => {
    e.stopPropagation();
    setActiveImageIndex(prev => ({ ...prev, [serviceId]: ((prev[serviceId] || 0) + 1) % max }));
  };

  const handlePrevImage = (e: React.MouseEvent, serviceId: string, max: number) => {
    e.stopPropagation();
    setActiveImageIndex(prev => ({ ...prev, [serviceId]: ((prev[serviceId] || 0) - 1 + max) % max }));
  };

  const openFullscreen = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    setFullscreenImage(url);
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {services.map(service => (
            <ServiceCard
              key={service.id}
              service={service}
              currentUser={currentUser}
              businessOwnerId={businessOwnerId}
              handlePrevImage={handlePrevImage}
              handleNextImage={handleNextImage}
              openFullscreen={openFullscreen}
              currentImgIdx={activeImageIndex[service.id] || 0}
              showcaseOnly={showcaseOnly}
            />
        ))}
      </div>

      {fullscreenImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-in fade-in duration-200"
          onClick={() => setFullscreenImage(null)}
        >
          <button
            onClick={() => setFullscreenImage(null)}
            className="absolute top-5 right-5 p-2 text-white/50 hover:text-white transition-colors"
          >
            <X className="w-7 h-7" />
          </button>
          <img
            src={fullscreenImage}
            className="max-w-full max-h-full rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
            alt="Fullscreen"
          />
        </div>
      )}
    </>
  );
};

export default ServicesList;
