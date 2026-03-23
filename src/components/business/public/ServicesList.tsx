import React, { useState } from 'react';
import { Clock, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Service } from '../../../lib/api';

interface ServicesListProps {
  services: Service[];
  selectedService: string | null;
  onSelectService: (serviceId: string) => void;
  showPrices: boolean;
  currentUser: any;
  businessOwnerId: string;
}

const ServicesList: React.FC<ServicesListProps> = ({ 
  services, 
  selectedService, 
  onSelectService, 
  showPrices,
  currentUser,
  businessOwnerId 
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState<Record<string, number>>({});
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  if (!services || services.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 italic">No hay servicios disponibles</p>
      </div>
    );
  }

  const handleNextImage = (e: React.MouseEvent, serviceId: string, max: number) => {
    e.stopPropagation();
    setActiveImageIndex(prev => ({
      ...prev,
      [serviceId]: ((prev[serviceId] || 0) + 1) % max
    }));
  };

  const handlePrevImage = (e: React.MouseEvent, serviceId: string, max: number) => {
    e.stopPropagation();
    setActiveImageIndex(prev => ({
      ...prev,
      [serviceId]: ((prev[serviceId] || 0) - 1 + max) % max
    }));
  };

  const openFullscreen = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    setFullscreenImage(url);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {services.map((service) => {
        // Normalizar image_urls para que siempre sea un array
        let images: string[] = [];
        if (Array.isArray(service.image_urls)) {
          images = service.image_urls;
        } else if (typeof service.image_urls === 'string') {
          try {
            images = JSON.parse(service.image_urls);
          } catch (e) {
            images = [];
          }
        }

        const hasImages = images.length > 0;
        const currentImgIdx = activeImageIndex[service.id] || 0;

        return (
          <div
            key={service.id}
            onClick={() => currentUser && currentUser.id !== businessOwnerId && onSelectService(service.id)}
            className={`relative flex flex-col rounded-3xl border-2 transition-all overflow-hidden ${currentUser && currentUser.id !== businessOwnerId ? 'cursor-pointer group' : ''} ${
              selectedService === service.id
                ? 'border-primary-600 bg-primary-50/30 dark:bg-primary-900/20 shadow-xl'
                : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-2xl'
            }`}
          >
            {/* Gallery Header */}
            {hasImages && (
              <div className="relative aspect-video overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img 
                  src={images[currentImgIdx]} 
                  alt={service.name} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  onClick={(e) => openFullscreen(e, images[currentImgIdx])}
                />
                
                {images.length > 1 && (
                  <>
                    <button 
                      onClick={(e) => handlePrevImage(e, service.id, images.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={(e) => handleNextImage(e, service.id, images.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {images.map((_, i) => (
                        <div 
                          key={i} 
                          className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentImgIdx ? 'bg-white scale-125' : 'bg-white/40'}`} 
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="p-6 flex flex-col flex-grow">
              <div className="flex justify-between items-start mb-3">
                <h4 className={`font-black text-xl tracking-tight transition-colors ${
                  selectedService === service.id ? 'text-primary-700 dark:text-primary-300' : 'text-slate-900 dark:text-white'
                }`}>
                  {service.name}
                </h4>
                {showPrices && service.price && (
                  <span className="text-xl font-black text-primary-600 dark:text-primary-400">
                    ${service.price.toLocaleString()}
                  </span>
                )}
              </div>
              
              <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-6 leading-relaxed flex-grow">
                {service.description}
              </p>
              
              <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  <Clock className="w-4 h-4 mr-2" />
                  {service.duration} min
                </div>

                {selectedService === service.id && (
                  <div className="bg-primary-600 text-white rounded-full p-1.5 shadow-lg animate-in zoom-in duration-300">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
              
              {!currentUser && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">
                  Inicia sesión para reservar
                </div>
              )}
              
              {currentUser && currentUser.id === businessOwnerId && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-primary-500 text-center">
                  Tu negocio
                </div>
              )}
            </div>
          </div>
        );
      })}

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
};

export default ServicesList; 
