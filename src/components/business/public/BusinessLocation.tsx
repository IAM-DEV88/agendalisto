import React from 'react';
import { MapPin } from 'lucide-react';

interface BusinessLocationProps {
  address: string;
}

const BusinessLocation: React.FC<BusinessLocationProps> = ({ address }) => {
  if (!address) {
    return (
      <div className="text-center py-2">
        <p className="text-gray-500 italic">Dirección no disponible</p>
      </div>
    );
  }

  return (
    <div>
      <iframe
        title="Ubicación del negocio"
        className="w-full h-48 rounded-lg border-0 mb-3"
        src={`https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
        allowFullScreen
      ></iframe>
      <div className="flex items-center text-gray-600 text-sm">
        <MapPin className="h-4 w-4 mr-2 text-indigo-500" />
        <span>{address}</span>
      </div>
    </div>
  );
};

export default BusinessLocation; 
