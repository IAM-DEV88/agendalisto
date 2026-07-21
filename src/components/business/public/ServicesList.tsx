import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Heart, Gift, ChevronRight } from 'lucide-react';
import { Service, toggleLike, checkIfLiked } from '../../../lib/api';
import { toast } from 'react-hot-toast';
import ShareButton from '../../ui/ShareButton';
import { useDominantColor } from '../../../hooks/useDominantColor';

interface ServicesListProps {
  services: Service[];
  currentUser: import('@supabase/supabase-js').User | null;
  showcaseOnly?: boolean;
}

const ServiceCard: React.FC<{
  service: Service;
  index: number;
  currentUser: import('@supabase/supabase-js').User | null;
  showcaseOnly?: boolean;
}> = ({ service, index, currentUser, showcaseOnly }) => {
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
  const navigate = useNavigate();
  const dominantColor = useDominantColor(hasImages ? images[0] : null);

  const goToBook = () => navigate(`/${window.location.pathname.split('/')[1]}/book/${service.id}`);

  return (
    <div
      onClick={goToBook}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goToBook(); } }}
      role="link"
      tabIndex={0}
      aria-label={`${index + 1}. ${service.name} — ${service.duration} min — ${service.price ? '$' + service.price.toLocaleString() : 'Consultar precio'}`}
      className="group relative flex items-stretch rounded-lg border transition-all cursor-pointer border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 min-h-[88px]"
    >
      {/* Number badge */}
      <div className="flex items-center justify-center w-10 shrink-0 bg-slate-50 dark:bg-slate-800/80 border-r border-slate-200 dark:border-slate-700">
        <span className="text-xs font-black text-slate-300 dark:text-slate-600 leading-none">
          {(index + 1).toString().padStart(2, '0')}
        </span>
      </div>

      {/* Thumbnail */}
      {hasImages && (
        <div
          className="relative w-24 shrink-0 overflow-hidden"
          style={{ background: dominantColor }}
        >
          <img
            src={images[0]}
            alt={service.name}
            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center min-w-0 px-3 py-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight truncate">
              {service.name}
            </h4>
            {service.description && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight truncate mt-0.5">
                {service.description}
              </p>
            )}
          </div>
          {service.mostrar_precios !== false && service.price ? (
            <span className="text-sm font-black text-primary-600 dark:text-primary-400 flex-shrink-0 leading-tight">
              ${service.price.toLocaleString()}
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 dark:text-slate-500">
            <Clock className="w-2.5 h-2.5" />
            {service.duration} min
          </div>

          <span className="w-px h-3 bg-slate-200 dark:bg-slate-700" />

          <button
            onClick={handleToggleLike}
            disabled={isLiking}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
              isLiked ? 'text-rose-500' : 'text-slate-400 dark:text-slate-500 hover:text-rose-400'
            }`}
            aria-label={isLiked ? 'Quitar me gusta' : 'Me gusta'}
          >
            <Heart className={`w-2.5 h-2.5 ${isLiked ? 'fill-current' : ''}`} />
            {likesCount > 0 && likesCount}
          </button>

          {service.can_be_gifted && (
            <a
              href={`/${window.location.pathname.split('/')[1]}/gift/${service.id}`}
              onClick={(e) => { e.stopPropagation(); }}
              className="text-slate-400 dark:text-slate-500 hover:text-rose-400 transition-colors p-0.5"
              aria-label={`Regalar ${service.name}`}
            >
              <Gift className="w-2.5 h-2.5" />
            </a>
          )}

          <div onClick={(e) => e.stopPropagation()} className="text-slate-400 dark:text-slate-500 hover:text-primary-500 transition-colors flex-shrink-0">
            <ShareButton
              url={shareUrl}
              title={`Reservar: ${service.name}`}
              variant="text"
              iconSize={11}
              className="p-0.5 bg-transparent hover:bg-transparent text-slate-400 dark:text-slate-500 hover:text-primary-500 !rounded !gap-1"
            />
          </div>

          <div className="hidden sm:block ml-auto">
            <span className="flex items-center gap-0.5 text-[10px] font-bold text-primary-600 dark:text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity">
              {showcaseOnly || !canBook ? 'Ver' : 'Reservar'} <ChevronRight className="w-2.5 h-2.5" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ServicesList: React.FC<ServicesListProps> = ({
  services, currentUser, showcaseOnly,
}) => {
  if (!services || services.length === 0) {
    return (
      <p className="text-sm text-slate-400 italic text-center py-8">No hay servicios disponibles</p>
    );
  }

  return (
    <div className="space-y-2">
      {services.map((service, i) => (
        <ServiceCard
          key={service.id}
          service={service}
          index={i}
          currentUser={currentUser}
          showcaseOnly={showcaseOnly}
        />
      ))}
    </div>
  );
};

export default ServicesList;
