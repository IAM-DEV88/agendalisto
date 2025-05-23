import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Globe, MessageCircle, Facebook, Instagram, Mail, Star } from 'lucide-react';
import { Business, getBusinessCategories, BusinessCategory } from '../../../lib/api';
import { supabase } from '../../../lib/supabase';
import { Link } from 'react-router-dom';

interface BusinessHeaderProps {
  businessData: Business;
  averageRating?: number;
  reviewsCount?: number;
}

const BusinessHeader: React.FC<BusinessHeaderProps> = ({ businessData, averageRating = 0, reviewsCount = 0 }) => {
  const [imageState, setImageState] = useState<'loading' | 'success' | 'error'>('loading');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  
  // Memoria local para URL inválidas para evitar intentos repetidos
  const invalidUrlsRef = React.useRef<Set<string>>(new Set());
  
  // Verificar si una URL realmente existe y es accesible
  const verifyImageUrl = async (url: string): Promise<boolean> => {
    if (!url || url === 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png') return true; // La URL fallback siempre existe
    
    try {
      // Método 1: Intentar hacer un HEAD request
      try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
          return true;
        }
      } catch (e) {
      }
      
      // Método 2: Crear un objeto Image y esperar a que cargue
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          resolve(true);
        };
        img.onerror = () => {
          resolve(false);
        };
        img.src = url;
        
        // Si después de 5 segundos no hay respuesta, considerarla inaccesible
        setTimeout(() => resolve(false), 5000);
      });
    } catch (error) {
      return false;
    }
  };
  
  // Procesamos la URL del logo cuando se carga el componente o cambia businessData
  useEffect(() => {
    const processLogoUrl = async () => {
      if (!businessData.logo_url) return;
      
      // Corregir URL si contiene rutas duplicadas
      let logoUrlToProcess = businessData.logo_url;
      if (logoUrlToProcess.includes('/business-logos/business-logos/')) {
        logoUrlToProcess = logoUrlToProcess.replace('/business-logos/business-logos/', '/business-logos/');
      }
      
      // Verificar URLs problemáticas conocidas
      if (logoUrlToProcess && logoUrlToProcess.endsWith('_1746130038843.png')) {
        setLogoUrl('https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png');
        setImageState('error');
        return;
      }
      
      setImageState('loading');
      
      // Si la URL ya se sabe que es inválida, usar fallback directamente
      if (invalidUrlsRef.current.has(logoUrlToProcess)) {
        setLogoUrl('https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png');
        setImageState('error');
        return;
      }
      
      // Si ya es una URL completa (posiblemente corregida), usarla directamente
      if (logoUrlToProcess.startsWith('http')) {
        const isAccessible = await verifyImageUrl(logoUrlToProcess);
        
        if (!isAccessible) {
          invalidUrlsRef.current.add(logoUrlToProcess);
          setLogoUrl('https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png');
          setImageState('error');
          return;
        }
        
        setLogoUrl(logoUrlToProcess);
        return;
      }
      
      // Si es una clave de storage, intentar generar URL pública
      try {
        // Intentar primero con el bucket business-logos
        const cleanKey = logoUrlToProcess.replace('business-logos/business-logos/', 'business-logos/');
        
        const { data: businessLogoData } = supabase.storage
          .from('business-logos')
          .getPublicUrl(cleanKey);
        
        // Verificar si tenemos una URL
        if (businessLogoData?.publicUrl) {
          const isAccessible = await verifyImageUrl(businessLogoData.publicUrl);
          
          if (!isAccessible) {
            // Intentar con avatars como fallback
            throw new Error(`URL generada inaccesible`);
          }
          
          setLogoUrl(businessLogoData.publicUrl);
          return;
        }
        
        // Si no funciona, intentar con el bucket avatars
        const { data: avatarsData } = supabase.storage
          .from('avatars')
          .getPublicUrl(logoUrlToProcess);
        
        if (avatarsData?.publicUrl) {
          setLogoUrl(avatarsData.publicUrl);
          return;
        }
      } catch (error) {
        setLogoUrl('https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png');
        setImageState('error');
      }
    };
    
    processLogoUrl();
  }, [businessData.logo_url]);
  
  // Fetch current authenticated user to determine ownership
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    fetchUser();
  }, []);
  
  // Fetch categories to display category name
  useEffect(() => {
    const fetchCategories = async () => {
      const { success, data } = await getBusinessCategories();
      if (success && data) setCategories(data);
    };
    fetchCategories();
  }, []);
  
  // Determine the name of this business's category
  const categoryName = categories.find(c => c.id === businessData.category_id)?.name;
  
  // Marcar URL como válida una vez cargada correctamente
  const handleImageLoaded = () => {
    setImageState('success');
  };
  
  // Marcar URL como inválida y usar fallback
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    // Guardar URL fallida para evitar intentos futuros
    if (logoUrl && logoUrl !== 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png') {
      invalidUrlsRef.current.add(logoUrl);
    }
    
    e.currentTarget.src = 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png';
    setImageState('error');
  };
  
  return (
    <div className="bg-gray-50 dark:bg-gray-50 dark:bg-opacity-10 shadow-md overflow-hidden rounded-md">
      <div className="h-48 md:h-64 bg-indigo-100 relative">
        {logoUrl ? (
          <>
            <img
              src={logoUrl}
              alt={businessData.name}
              className="w-full h-full object-contain"
              onLoad={handleImageLoaded}
              onError={handleImageError}
            />
            {imageState === 'loading' && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50">
                <span className="text-gray-500">Cargando imagen...</span>
              </div>
            )}
          </>
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
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 ">{businessData.name}</h1>
            {reviewsCount > 0 && (
              <div className="flex items-center mt-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-5 w-5 ${i < Math.round(averageRating) ? 'fill-current text-yellow-400' : 'text-gray-300'}`} />
                ))}
                <span className="ml-2 text-sm text-gray-600">{averageRating.toFixed(1)} ({reviewsCount})</span>
              </div>
            )}
            <p className="mt-3 text-gray-600 ">{businessData.description}</p>
            {categoryName && (
              <p className="mt-2 inline-block px-2 py-1 bg-indigo-100 text-indigo-800 rounded dark:bg-indigo-800 dark:text-indigo-200 uppercase text-xs">
                {categoryName}
              </p>
            )}
          </div>

          <div className="flex flex-col space-y-3 text-sm">
            {businessData.address && businessData.config?.mostrar_direccion && (
              <div className="flex items-center">
                <MapPin className="h-5 w-5 text-indigo-600 mr-2" />
                <span className="">{businessData.address}</span>
              </div>
            )}
            {businessData.phone && businessData.config?.mostrar_telefono && (
              <div className="flex items-center">
                <Phone className="h-5 w-5 text-indigo-600 mr-2" />
                <a href={`tel:${businessData.phone}`} className="hover:text-indigo-600 ">
                  {businessData.phone}
                </a>
              </div>
            )}
            {businessData.email && businessData.config?.mostrar_email && (
              <div className="flex items-center">
                <Mail className="h-5 w-5 text-indigo-600 mr-2" />
                <a href={`mailto:${businessData.email}`} className="hover:text-indigo-600 ">
                  {businessData.email}
                </a>
              </div>
            )}
            {businessData.website && (
              <div className="flex items-center">
                <Globe className="h-5 w-5 text-indigo-600 mr-2" />
                <a href={businessData.website} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600  truncate">
                  {businessData.website.replace(/https?:\/\/(www\.)?/, '')}
                </a>
              </div>
            )}
            {businessData.whatsapp && (
              <div className="flex items-center">
                <MessageCircle className="h-5 w-5 text-indigo-600 mr-2" />
                <a href={`https://wa.me/${businessData.whatsapp}`} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 ">
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
              className="bg-gray-500 p-2 rounded-full hover:bg-indigo-100 transition-colors"
            >
              <Facebook className="h-5 w-5 text-indigo-600" />
            </a>
          )}
          {businessData.instagram && businessData.config?.mostrar_redes_sociales && (
            <a
              href={`https://instagram.com/${businessData.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-500 p-2 rounded-full hover:bg-indigo-100 transition-colors"
            >
              <Instagram className="h-5 w-5 text-indigo-600" />
            </a>
          )}
        </div>
        {currentUser && currentUser.id === businessData.owner_id && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to="/business/dashboard?tab=profile"
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Datos
            </Link>
            <Link
              to="/business/dashboard?tab=services"
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Servicios
            </Link>
            <Link
              to="/business/dashboard?tab=availability"
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Horarios
            </Link>
            <Link
              to="/business/dashboard?tab=settings"
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Configuración
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessHeader; 
