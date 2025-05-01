import React from 'react';
import { MapPin, Phone, Globe, MessageCircle, Facebook, Instagram, Mail, Star } from 'lucide-react';
import { Business } from '../../../lib/api';

interface BusinessHeaderProps {
  businessData: Business;
  averageRating?: number;
  reviewsCount?: number;
}

const BusinessHeader: React.FC<BusinessHeaderProps> = ({ businessData, averageRating = 0, reviewsCount = 0 }) => {
  return (
    <div className="bg-white dark:bg-white dark:bg-opacity-10 shadow-md overflow-hidden">
      <div className="h-48 md:h-64 bg-indigo-100 relative">
        {businessData.logo_url ? (
          <img
            src={businessData.logo_url}
            alt={businessData.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-indigo-600 text-4xl md:text-6xl font-bold">
              {businessData.name.charAt(0)}
            </span>
          </div>
        )}
      </div>

      <div className="p-6 md:p-8">
        <div className="flex flex-wrap justify-between items-start">
          <div className="mb-4 md:mb-0">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{businessData.name}</h1>
            {reviewsCount > 0 && (
              <div className="flex items-center mt-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-5 w-5 ${i < Math.round(averageRating) ? 'fill-current text-yellow-400' : 'text-gray-300'}`} />
                ))}
                <span className="ml-2 text-sm text-gray-600">{averageRating.toFixed(1)} ({reviewsCount})</span>
              </div>
            )}
            <p className="mt-3 text-gray-600 dark:text-white">{businessData.description}</p>
          </div>

          <div className="flex flex-col space-y-3 text-sm">
            {businessData.address && businessData.config?.mostrar_direccion && (
              <div className="flex items-center">
                <MapPin className="h-5 w-5 text-indigo-600 mr-2" />
                <span className="dark:text-white">{businessData.address}</span>
              </div>
            )}
            {businessData.phone && businessData.config?.mostrar_telefono && (
              <div className="flex items-center">
                <Phone className="h-5 w-5 text-indigo-600 mr-2" />
                <a href={`tel:${businessData.phone}`} className="hover:text-indigo-600 dark:text-white">
                  {businessData.phone}
                </a>
              </div>
            )}
            {businessData.email && businessData.config?.mostrar_email && (
              <div className="flex items-center">
                <Mail className="h-5 w-5 text-indigo-600 mr-2" />
                <a href={`mailto:${businessData.email}`} className="hover:text-indigo-600 dark:text-white">
                  {businessData.email}
                </a>
              </div>
            )}
            {businessData.website && (
              <div className="flex items-center">
                <Globe className="h-5 w-5 text-indigo-600 mr-2" />
                <a href={businessData.website} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 dark:text-white truncate">
                  {businessData.website.replace(/https?:\/\/(www\.)?/, '')}
                </a>
              </div>
            )}
            {businessData.whatsapp && (
              <div className="flex items-center">
                <MessageCircle className="h-5 w-5 text-indigo-600 mr-2" />
                <a href={`https://wa.me/${businessData.whatsapp}`} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 dark:text-white">
                  WhatsApp
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="flex space-x-2 mt-6">
          {businessData.facebook && businessData.config?.mostrar_redes_sociales && (
            <a
              href={`https://facebook.com/${businessData.facebook}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-100 p-2 rounded-full hover:bg-indigo-100 transition-colors"
            >
              <Facebook className="h-5 w-5 text-indigo-600" />
            </a>
          )}
          {businessData.instagram && businessData.config?.mostrar_redes_sociales && (
            <a
              href={`https://instagram.com/${businessData.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-100 p-2 rounded-full hover:bg-indigo-100 transition-colors"
            >
              <Instagram className="h-5 w-5 text-indigo-600" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusinessHeader; 