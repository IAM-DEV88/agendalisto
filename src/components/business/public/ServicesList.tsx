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
    <div className="space-y-4">
      {services.map((service) => (
        <div
          key={service.id}
          className={`bg-gray-50 dark:bg-opacity-10 border rounded-lg p-4 ${currentUser && currentUser.id !== businessOwnerId ? 'cursor-pointer' : ''} transition-colors ${
            selectedService === service.id ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-200 hover:border-indigo-300'
          }`}
          onClick={() => currentUser && handleServiceClick(service.id)}
        >
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium text-gray-900">{service.name}</h4>
              <p className="text-sm text-gray-600 mt-1">{service.description}</p>
              <div className="flex items-center mt-2 text-sm text-gray-500">
                <Clock className="h-4 w-4 mr-1" />
                <span>{service.duration} min</span>
              </div>
            </div>
            {showPrices && (
              <div className="text-right">
                <span className="text-lg font-semibold text-gray-900">${service.price.toFixed(2)}</span>
              </div>
            )}
          </div>
          
          {!currentUser && (
            <div className="mt-3 text-xs text-gray-500">
              Inicia sesión para reservar este servicio
            </div>
          )}
          
          {currentUser && currentUser.id === businessOwnerId && (
            <div className="mt-3 dark:text-white text-xs text-gray-500">
              Este es tu negocio, no puedes reservar tus propios servicios
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ServicesList; 
