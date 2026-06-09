import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Globe, MessageCircle, Facebook, Instagram, Mail, Star, Heart } from 'lucide-react';
import { Business, getBusinessCategories, BusinessCategory, toggleLike, checkIfLiked } from '../../../lib/api';
import { supabase } from '../../../lib/supabase';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import ShareButton from '../../ui/ShareButton';

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
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(businessData.likes_count || 0);
  const [isLiking, setIsLiking] = useState(false);
  // Memoria local para URL inválidas para evitar intentos repetidos
  const invalidUrlsRef = React.useRef<Set<string>>(new Set());

  // Verificar si el usuario ya dio like
  useEffect(() => {
    const checkLike = async () => {
      if (currentUser?.id && businessData.id) {
        const liked = await checkIfLiked(currentUser.id, businessData.id, 'business');
        setIsLiked(liked);
      }
    };
    checkLike();
  }, [currentUser, businessData.id]);

  const handleToggleLike = async () => {
    if (!currentUser) {
      toast.error('Debes iniciar sesión para dar me gusta');
      return;
    }

    try {
      setIsLiking(true);
      const result = await toggleLike(currentUser.id, businessData.id, 'business');
      if (result.success) {
        setIsLiked(result.action === 'added');
        setLikesCount(prev => result.action === 'added' ? prev + 1 : prev - 1);
        toast.success(result.action === 'added' ? '¡Te gusta este negocio!' : 'Ya no te gusta este negocio');
      }
    } catch (error) {
      toast.error('Error al procesar tu me gusta');
    } finally {
      setIsLiking(false);
    }
  };

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
    <div className="card overflow-hidden">
      <div className="h-48 md:h-72 bg-primary-100 dark:bg-primary-900/20 relative group overflow-hidden">
        {logoUrl ? (
          <>
            <img
              src={logoUrl}
              alt={businessData.name}
              className="w-full h-full object-cover md:object-contain transition-transform duration-500 group-hover:scale-105"
              onLoad={handleImageLoaded}
              onError={handleImageError}
            />
            {imageState === 'loading' && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-100/50 dark:bg-slate-800/50 backdrop-blur-sm">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-600"></div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-primary-600 dark:text-primary-400 text-5xl md:text-8xl font-black opacity-20">
              {businessData.name.charAt(0)}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
      </div>

      <div className="p-6 md:p-10">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                {businessData.name}
              </h1>
              {categoryName && (
                <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded-full font-bold text-xs uppercase tracking-wider">
                  {categoryName}
                </span>
              )}
              {businessData.plan === 'premium' && (
                <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-full font-bold text-xs uppercase tracking-wider">
                  Premium
                </span>
              )}
              {businessData.plan === 'pro' && (
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full font-bold text-xs uppercase tracking-wider">
                  Pro
                </span>
              )}
            </div>

            {reviewsCount > 0 && (
              <div className="flex items-center mb-6">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-5 w-5 ${i < Math.round(averageRating) ? 'fill-current' : 'text-slate-300 dark:text-slate-600'}`} />
                  ))}
                </div>
                <span className="ml-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                  {averageRating.toFixed(1)}
                </span>
                <span className="ml-1 text-sm text-slate-500 dark:text-slate-400">
                  ({reviewsCount} {reviewsCount === 1 ? 'reseña' : 'reseñas'})
                </span>
              </div>
            )}

            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
              {businessData.description}
            </p>

            <div className="space-y-4 mt-8">
              {/* — Grupo 1: Acciones del usuario (compartir, like) — */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Compartir</p>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <button
                      onClick={handleToggleLike}
                      disabled={isLiking}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                        isLiked 
                          ? 'bg-rose-500 text-white shadow-md shadow-rose-200 dark:shadow-rose-900/20' 
                          : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                      title={isLiked ? 'Ya no me gusta' : 'Me gusta'}
                    >
                      <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
                      <span className="font-bold text-sm">{likesCount}</span>
                    </button>
                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                    <ShareButton
                      title={businessData.name}
                      description={businessData.description || 'Visita este negocio en AgendaYa'}
                      variant="full"
                    />
                  </div>
                </div>
              </div>

              {/* — Grupo 2: Contactar al negocio — */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Contactar</p>
                <div className="flex flex-wrap items-center gap-2">
                  {businessData.whatsapp && (
                    <a
                      href={`https://wa.me/${businessData.whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all border border-emerald-200 dark:border-emerald-800/50 font-bold text-sm"
                      title="Contactar por WhatsApp"
                    >
                      <MessageCircle className="h-5 w-5" />
                      <span className="hidden sm:inline">WhatsApp</span>
                    </a>
                  )}
                  {businessData.facebook && businessData.config?.mostrar_redes_sociales && (
                    <a href={`https://facebook.com/${businessData.facebook}`} target="_blank" rel="noopener noreferrer"
                      className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-primary-600 hover:text-white transition-all shadow-sm border border-slate-200 dark:border-slate-700" title="Facebook">
                      <Facebook className="h-5 w-5" />
                    </a>
                  )}
                  {businessData.instagram && businessData.config?.mostrar_redes_sociales && (
                    <a href={`https://instagram.com/${businessData.instagram}`} target="_blank" rel="noopener noreferrer"
                      className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-primary-600 hover:text-white transition-all shadow-sm border border-slate-200 dark:border-slate-700" title="Instagram">
                      <Instagram className="h-5 w-5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="w-full md:w-auto min-w-[280px]">
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-700/50">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Información de contacto</h3>
              <div className="space-y-4">
                {businessData.address && businessData.config?.mostrar_direccion && (
                  <div className="flex items-start group">
                    <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 mr-3 text-primary-600">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <span className="text-sm text-slate-600 dark:text-slate-300 pt-1 leading-snug">{businessData.address}</span>
                  </div>
                )}
                {businessData.phone && businessData.config?.mostrar_telefono && (
                  <div className="flex items-center group">
                    <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 mr-3 text-primary-600">
                      <Phone className="h-4 w-4" />
                    </div>
                    <a href={`tel:${businessData.phone}`} className="text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-primary-600 transition-colors">
                      {businessData.phone}
                    </a>
                  </div>
                )}
                {businessData.email && businessData.config?.mostrar_email && (
                  <div className="flex items-center group">
                    <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 mr-3 text-primary-600">
                      <Mail className="h-4 w-4" />
                    </div>
                    <a href={`mailto:${businessData.email}`} className="text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-primary-600 transition-colors truncate max-w-[200px]">
                      {businessData.email}
                    </a>
                  </div>
                )}
                {businessData.website && (
                  <div className="flex items-center group">
                    <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 mr-3 text-primary-600">
                      <Globe className="h-4 w-4" />
                    </div>
                    <a href={businessData.website} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-primary-600 transition-colors truncate max-w-[200px]">
                      Sitio Web
                    </a>
                  </div>
                )}
              </div>
            </div>

            {currentUser && currentUser.id === businessData.owner_id && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Link
                  to="/business/dashboard?tab=profile"
                  className="flex items-center justify-center py-2 px-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Editar Perfil
                </Link>
                <Link
                  to="/business/dashboard?tab=services"
                  className="flex items-center justify-center py-2 px-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Servicios
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessHeader; 
