import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Filter, MapPin, ArrowRight, Heart, Share2, Check } from 'lucide-react';
import { getBusinesses, getBusinessCategories, BusinessCategory, toggleLike, checkIfLiked } from '../lib/api';
import type { Business } from '../lib/api';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

// Fallback logo for businesses without an image
const FALLBACK_LOGO = 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png';

const BusinessCard = ({ business, categories, currentUser }: { business: Business, categories: BusinessCategory[], currentUser: any }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(business.likes_count || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const checkLike = async () => {
      if (currentUser?.id && business.id) {
        const liked = await checkIfLiked(currentUser.id, business.id, 'business');
        setIsLiked(liked);
      }
    };
    checkLike();
  }, [currentUser, business.id]);

  const handleToggleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!currentUser) {
      toast.error('Debes iniciar sesión para dar me gusta');
      return;
    }

    try {
      setIsLiking(true);
      const result = await toggleLike(currentUser.id, business.id, 'business');
      if (result.success) {
        setIsLiked(result.action === 'added');
        setLikesCount(prev => result.action === 'added' ? prev + 1 : prev - 1);
      }
    } catch (error) {
      toast.error('Error al procesar tu me gusta');
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/${business.slug}`;
    
    navigator.clipboard.writeText(shareUrl);
    setIsCopied(true);
    toast.success('¡Enlace del negocio copiado!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const cat = categories.find(c => c.id === business.category_id);

  return (
    <Link
      to={`/${business.slug}`}
      className="group card overflow-hidden hover:border-primary-400 dark:hover:border-primary-500 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
    >
      <div className="h-56 bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
        <img
          src={business.logo_url || FALLBACK_LOGO}
          alt={business.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => { e.currentTarget.src = FALLBACK_LOGO }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
          <div className="flex gap-2">
            <button
              onClick={handleToggleLike}
              disabled={isLiking}
              className={`p-2 rounded-xl backdrop-blur-md transition-all ${
                isLiked 
                  ? 'bg-rose-500 text-white' 
                  : 'bg-white/20 hover:bg-white/40 text-white'
              }`}
            >
              <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={handleShare}
              className={`p-2 rounded-xl backdrop-blur-md transition-all ${
                isCopied 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-white/20 hover:bg-white/40 text-white'
              }`}
            >
              {isCopied ? <Check className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>
      <div className="p-8">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {business.name}
          </h3>
          <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 font-bold text-xs">
            <Heart className={`h-3.5 w-3.5 ${likesCount > 0 ? 'text-rose-500 fill-rose-500' : ''}`} />
            <span>{likesCount}</span>
          </div>
        </div>
        
        {business.address && (
          <div className="flex items-start text-slate-500 dark:text-slate-400 mb-4">
            <MapPin className="h-4 w-4 mr-2 mt-1 flex-shrink-0 text-primary-500" />
            <p className="text-sm font-medium line-clamp-1">{business.address}</p>
          </div>
        )}
        
        <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-2 mb-6 leading-relaxed">
          {business.description}
        </p>
        
        <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-100 dark:border-slate-800">
          {cat ? (
            <span className="px-3 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-xs font-black uppercase tracking-wider">
              {cat.name}
            </span>
          ) : <span></span>}
          <span className="flex items-center text-primary-600 dark:text-primary-400 font-black text-sm group-hover:translate-x-1 transition-transform">
            Ver servicios
            <ArrowRight className="ml-2 h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
};

const ExploreBusinesses = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Obtener valores iniciales de la URL
  const initialSearch = searchParams.get('search') || '';
  const initialLocation = searchParams.get('location') || '';
  const initialCategory = searchParams.get('category') || 'all';

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [locationTerm, setLocationTerm] = useState(initialLocation);
  const [category, setCategory] = useState(initialCategory);
  
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [user, setUser] = useState<any>(null);

  // Actualizar estados locales si cambian los parámetros de la URL (por ejemplo, al volver a hacer clic en "Explorar")
  useEffect(() => {
    setSearchTerm(searchParams.get('search') || '');
    setLocationTerm(searchParams.get('location') || '');
    setCategory(searchParams.get('category') || 'all');
  }, [searchParams]);

  // Actualizar la URL cuando cambian los filtros locales
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (locationTerm) params.set('location', locationTerm);
    if (category !== 'all') params.set('category', category);
    setSearchParams(params, { replace: true });
  }, [searchTerm, locationTerm, category, setSearchParams]);

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, []);

  // Load real categories from Supabase
  useEffect(() => {
    const fetchCategories = async () => {
      const { success, data } = await getBusinessCategories();
      if (success && data) setCategories(data);
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchBusinesses = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getBusinesses(
          searchTerm || undefined, 
          category !== 'all' ? category : undefined,
          locationTerm || undefined
        );
        setBusinesses(data);
      } catch (err) {
        setError('Error al cargar los negocios. Por favor, inténtalo de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchBusinesses();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, locationTerm, category]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white sm:text-5xl tracking-tight mb-4">
            Explora Negocios
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-slate-600 dark:text-slate-400 font-medium">
            Encuentra servicios y reserva citas en los mejores negocios locales
          </p>
        </div>

        {/* Search and Filter Section */}
        <div className="card p-6 mb-12 shadow-xl shadow-slate-200/50 dark:shadow-none">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="¿Qué servicio buscas?"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:border-primary-500 focus:ring-0 transition-all font-medium text-slate-700 dark:text-white"
              />
            </div>
            <div className="flex-1 relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <MapPin className="h-5 w-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
              </div>
              <input
                type="text"
                value={locationTerm}
                onChange={(e) => setLocationTerm(e.target.value)}
                placeholder="Ubicación (Ciudad, barrio...)"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:border-primary-500 focus:ring-0 transition-all font-medium text-slate-700 dark:text-white"
              />
            </div>
            <div className="lg:w-1/4 relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Filter className="h-5 w-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:border-primary-500 focus:ring-0 transition-all font-bold text-slate-700 dark:text-white appearance-none"
              >
                <option value="all">Todas las categorías</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="alert alert-error mb-8 flex items-center gap-3">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-bold">{error}</span>
          </div>
        )}

        {/* Businesses Grid */}
        {loading ? (
          <div className="flex flex-col justify-center items-center py-32">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600 mb-4"></div>
            <p className="text-slate-500 font-bold animate-pulse">Buscando los mejores negocios...</p>
          </div>
        ) : businesses.length === 0 ? (
          <div className="text-center py-32 card bg-slate-50/50 dark:bg-slate-800/20 border-dashed border-2">
            <div className="bg-slate-100 dark:bg-slate-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">No encontramos resultados</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Intenta ajustar tus filtros o buscar con otros términos.
            </p>
            <button 
              onClick={() => { setSearchTerm(''); setLocationTerm(''); setCategory('all'); }}
              className="mt-8 text-primary-600 dark:text-primary-400 font-black hover:underline"
            >
              Limpiar todos los filtros
            </button>
          </div>
        ) : (
          <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {businesses.map((business) => (
              <BusinessCard 
                key={business.id} 
                business={business} 
                categories={categories} 
                currentUser={user} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExploreBusinesses; 
