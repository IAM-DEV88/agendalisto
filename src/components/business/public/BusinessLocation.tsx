import React from 'react';
import { MapPin, ExternalLink } from 'lucide-react';

interface BusinessLocationProps {
  address: string;
}

const BusinessLocation: React.FC<BusinessLocationProps> = ({ address }) => {
  if (!address) return (
    <p className="text-sm text-slate-400 italic text-center py-4">Dirección no disponible</p>
  );

  const mapsUrl = `https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className="space-y-3">
      <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
        <iframe
          title="Ubicación del negocio"
          className="w-full h-44"
          src={mapsUrl}
          allowFullScreen
          loading="lazy"
        />
      </div>
      <a
        href={`https://www.google.com/maps/search/${encodeURIComponent(address)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-sm font-bold text-primary-600 dark:text-primary-400 hover:text-primary-500 transition-colors"
      >
        <MapPin className="w-4 h-4" />
        <span className="truncate">{address}</span>
        <ExternalLink className="w-3 h-3 flex-shrink-0" />
      </a>
    </div>
  );
};

export default BusinessLocation;
