import React, { useState, useEffect } from 'react';
import { Clock, ChevronLeft, ChevronRight, X, Heart, Share2, Check, LogIn } from 'lucide-react';
import { Service, toggleLike, checkIfLiked } from '../../../lib/api';
import { toast } from 'react-hot-toast';

interface ServicesListProps {
  services: Service[];
  selectedService: string | null;
  onSelectService: (serviceId: string) => void;
  showPrices: boolean;
  currentUser: any;
  businessOwnerId: string;
}

const ServiceCard: React.FC<{
  service: Service;
  selectedService: string | null;
  onSelectService: (serviceId: string) => void;
  showPrices: boolean;
  currentUser: any;
  businessOwnerId: string;
  handlePrevImage: (e: React.MouseEvent, serviceId: string, max: number) => void;
  handleNextImage: (e: React.MouseEvent, serviceId: string, max: number) => void;
  openFullscreen: (e: React.MouseEvent, url: string) => void;
  currentImgIdx: number;
}> = ({ service, selectedService, onSelectService, showPrices, currentUser, businessOwnerId, handlePrevImage, handleNextImage, openFullscreen, currentImgIdx }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(service.likes_count || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (currentUser?.id && service.id) {
      checkIfLiked(currentUser.id, service.id, 'service').then(setIsLiked);
    }
  }, [currentUser, service.id]);

  const handleToggleLike = async (e: React.MouseEvent) => {
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

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const baseUrl = window.location.origin;
    const currentPath = window.location.pathname;
    navigator.clipboard.writeText(`${baseUrl}${currentPath}/book/${service.id}`);
    setIsCopied(true);
    toast.success('¡Enlace de reserva copiado!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  let images: string[] = [];
  if (Array.isArray(service.image_urls)) {
    images = service.image_urls;
  } else if (typeof service.image_urls === 'string') {
    try { images = JSON.parse(service.image_urls); } catch { images = []; }
  }

  const hasImages = images.length > 0;
  const canReserve = currentUser && currentUser.id !== businessOwnerId;

  return (
    <div
      onClick={() => canReserve && onSelectService(service.id)}
      className={`relative flex flex-col rounded-2xl border transition-all overflow-hidden ${
        canReserve ? 'cursor-pointer group' : ''
      } ${
        selectedService === service.id
          ? 'border-primary-500 bg-primary-50/30 dark:bg-primary-900/20 shadow-xl shadow-primary-500/10'
          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-2xl'
      }`}
    >
      {/* Gallery */}
      {hasImages && (
        <div className="relative aspect-video overflow-hidden bg-slate-100 dark:bg-slate-800">
          <img
            src={images[currentImgIdx]}
            alt={service.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onClick={(e) => openFullscreen(e, images[currentImgIdx])}
          />
          {images.length > 1 && (
            <>
              <button onClick={(e) => handlePrevImage(e, service.id, images.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/30 hover:bg-black/50 text-white rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={(e) => handleNextImage(e, service.id, images.length)}
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
          <h4 className={`font-black text-lg tracking-tight ${
            selectedService === service.id ? 'text-primary-700 dark:text-primary-300' : 'text-slate-900 dark:text-white'
          }`}>
            {service.name}
          </h4>
          {showPrices && service.price ? (
            <span className="text-lg font-black text-primary-600 dark:text-primary-400 flex-shrink-0">
              ${service.price.toLocaleString()}
            </span>
          ) : null}
        </div>

        {service.description && (
          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed flex-1">
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
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-black transition-all ${
                isLiked ? 'bg-rose-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Heart className={`w-3 h-3 ${isLiked ? 'fill-current' : ''}`} />
              {likesCount}
            </button>
            <button
              onClick={handleShare}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-black transition-all ${
                isCopied ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {isCopied ? <Check className="w-3 h-3" /> : <Share2 className="w-3 h-3" />}
              {isCopied ? 'Copiado' : 'Compartir'}
            </button>
          </div>
        </div>

        {selectedService === service.id && (
          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-black text-primary-600 dark:text-primary-400 animate-in fade-in duration-200">
            <Check className="w-3.5 h-3.5" />
            Seleccionado
          </div>
        )}

        {!currentUser && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
            <LogIn className="w-3 h-3" />
            Inicia sesión para reservar
          </div>
        )}

        {currentUser && currentUser.id === businessOwnerId && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-center text-[10px] font-black uppercase tracking-widest text-primary-500">
            Tu negocio
          </div>
        )}
      </div>
    </div>
  );
};

const ServicesList: React.FC<ServicesListProps> = ({
  services, selectedService, onSelectService, showPrices, currentUser, businessOwnerId,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState<Record<string, number>>({});
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

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
            selectedService={selectedService}
            onSelectService={onSelectService}
            showPrices={showPrices}
            currentUser={currentUser}
            businessOwnerId={businessOwnerId}
            handlePrevImage={handlePrevImage}
            handleNextImage={handleNextImage}
            openFullscreen={openFullscreen}
            currentImgIdx={activeImageIndex[service.id] || 0}
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
            className="max-w-full max-h-full rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200"
            alt="Fullscreen"
          />
        </div>
      )}
    </>
  );
};

export default ServicesList;
