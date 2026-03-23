import React from 'react';
import { Clock } from 'lucide-react';
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
  if (!services || services.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 italic">No hay servicios disponibles</p>
      </div>
    );
  }

  const handleServiceClick = (serviceId: string) => {
    // Business owners shouldn't be able to book their own services
    if (currentUser && currentUser.id !== businessOwnerId) {
      onSelectService(serviceId);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {services.map((service) => (
        <div
          key={service.id}
          onClick={() => currentUser && currentUser.id !== businessOwnerId && onSelectService(service.id)}
          className={`relative p-5 rounded-2xl border-2 transition-all ${currentUser && currentUser.id !== businessOwnerId ? 'cursor-pointer group' : ''} ${
            selectedService === service.id
              ? 'border-primary-600 bg-primary-50/50 dark:bg-primary-900/20 shadow-md'
              : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-lg'
          }`}
        >
          <div className="flex justify-between items-start mb-3">
            <h4 className={`font-bold text-lg transition-colors ${
              selectedService === service.id ? 'text-primary-700 dark:text-primary-300' : 'text-slate-900 dark:text-white'
            }`}>
              {service.name}
            </h4>
            {showPrices && service.price && (
              <span className="text-lg font-black text-primary-600 dark:text-primary-400">
                ${service.price.toFixed(2)}
              </span>
            )}
          </div>
          
          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
            {service.description}
          </p>
          
          <div className="flex items-center text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            <Clock className="w-4 h-4 mr-1.5" />
            {service.duration} min
          </div>

          {selectedService === service.id && (
            <div className="absolute top-3 right-3">
              <div className="bg-primary-600 text-white rounded-full p-1 shadow-sm">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          )}
          
          {!currentUser && (
            <div className="mt-3 text-xs text-gray-500 italic">
              Inicia sesión para reservar
            </div>
          )}
          
          {currentUser && currentUser.id === businessOwnerId && (
            <div className="mt-3 text-xs text-gray-500 italic">
              Tu negocio
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ServicesList; 
