import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useState, useEffect, useMemo } from 'react';
import { getBusinessCategories, BusinessCategory, getTopMilestones } from '../lib/api';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import { Search, MapPin, CheckCircle2, ArrowRight } from 'lucide-react';
import { getCategoryIcon } from '../lib/categoryIcons';
import 'swiper/css';
import 'swiper/css/pagination';
import BlogHomeSection from '../components/BlogHomeSection';
import { supabase } from '../lib/supabase';
import type { Milestone } from '../lib/api';
import SEO from '../components/SEO';
import agendayaImage from '../assets/branding/AgendaYA.jpg';

const Home = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchService, setSearchService] = useState('');
  const [searchLocation, setSearchLocation] = useState('');

  const cta = useMemo(() => {
    if (loading || !user) {
      return { registerText: 'Registrarse GRATIS', registerLink: '/register', secondText: 'Iniciar Sesión', secondLink: '/login' };
    }
    if (user.business_id) {
      return { registerText: 'Mi negocio', registerLink: '/business/dashboard', secondText: 'Mi Perfil', secondLink: '/dashboard' };
    }
    if (user.role === 'visitor') {
      return { registerText: 'Activar cuenta', registerLink: '/dashboard', secondText: 'Mi Perfil', secondLink: '/dashboard' };
    }
    return { registerText: 'Registrar mi negocio', registerLink: '/business/register', secondText: 'Mi Perfil', secondLink: '/dashboard' };
  }, [user, loading]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchService) params.append('search', searchService);
    if (searchLocation) params.append('location', searchLocation);
    navigate(`/explore?${params.toString()}`);
  };

  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Milestones
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loadingMilestones, setLoadingMilestones] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      const { success, data, error } = await getBusinessCategories();
      if (success && data) {
        setCategories(data);
      } else {
        console.error('Error fetching categories', error);
      }
      setLoadingCategories(false);
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchMilestones = async () => {
      const { success, data, error } = await getTopMilestones(3);
      if (success && data) setMilestones(data);
      else console.error('Error fetching milestones', error);
      setLoadingMilestones(false);
    };
    fetchMilestones();
  }, []);

  return (
    <div className="space-y-0">
      <SEO
        title="Reserva servicios cerca de ti"
        description="Encuentra barberías, belleza, salud y más en un solo lugar. Agenda citas online sin llamadas ni filas en segundos."
      />
      {/* Hero section */}
      <section className="relative bg-primary-600 dark:bg-primary-900 overflow-hidden py-16 sm:py-24 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-y-12 md:gap-12">
            <div className="col-span-2 text-center md:text-left">
              <h1 className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl mb-6">
                <span>Reserva servicios cerca de ti </span>
                <span className="text-primary-200">en segundos.</span>
              </h1>
              <p className="text-primary-100 text-lg sm:text-xl md:text-2xl max-w-2xl mx-auto md:mx-0 mb-8 leading-relaxed">
                Encuentra barberías, belleza, salud y más en un solo lugar.
              </p>
              
              {/* Buscador Funcional — diseño responsive único */}
              <form onSubmit={handleSearch} className="max-w-3xl bg-white p-2 rounded-lg shadow-2xl flex flex-col md:grid md:grid-cols-6 md:gap-2 gap-2">
                <div className="md:col-span-3 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Ej: Corte de cabello, uñas, masaje" 
                    value={searchService}
                    onChange={(e) => setSearchService(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 md:py-4 rounded-lg md:rounded-lg bg-slate-50 dark:!bg-slate-50 border-0 text-sm font-medium text-slate-900 dark:!text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
                <div className="relative md:col-span-1">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Ubicación" 
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 md:py-4 rounded-lg md:rounded-lg bg-slate-50 dark:!bg-slate-50 border-0 text-sm font-medium text-slate-900 dark:!text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
                <button type="submit" className="md:col-span-2 bg-primary-600 hover:bg-primary-500 text-white px-8 py-3 md:py-4 rounded-lg font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-500/30">
                  <Search className="w-5 h-5" /> Buscar ahora
                </button>
              </form>
            </div>
            
            <div className="col-span-1 bg-white/10 backdrop-blur-md p-8 rounded-lg border border-white/20 shadow-2xl w-full">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">
                {user ? 'Mi espacio' : 'Reservar ahora'}
              </h2>
              
              {user ? (
                <div className="flex flex-col gap-4">
                  <Link to={cta.registerLink} className="btn-primary w-full text-center">
                    {cta.registerText}
                  </Link>
                  <Link to={cta.secondLink} className="btn-secondary w-full bg-white/20 border-white/30 text-white hover:bg-white/30 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 text-center">
                    {cta.secondText}
                  </Link>
                  <button 
                    onClick={() => supabase.auth.signOut()} 
                    className="text-white/70 hover:text-white text-sm font-medium mt-2 transition-colors"
                  >
                    Cerrar sesión
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-white/90">
                      <CheckCircle2 className="w-5 h-5 text-primary-300" />
                      <span className="font-bold">Sin llamadas</span>
                    </div>
                    <div className="flex items-center gap-3 text-white/90">
                      <CheckCircle2 className="w-5 h-5 text-primary-300" />
                      <span className="font-bold">Sin filas</span>
                    </div>
                    <div className="flex items-center gap-3 text-white/90">
                      <CheckCircle2 className="w-5 h-5 text-primary-300" />
                      <span className="font-bold">En menos de 30 segundos</span>
                    </div>
                  </div>
                  <Link to="/explore" className="btn-primary w-full bg-white text-primary-700 hover:bg-primary-50 flex items-center justify-center gap-2 text-lg">
                    Explorar servicios <ArrowRight className="w-5 h-5" />
                  </Link>
                  <div className="pt-4 border-t border-white/20">
                    <Link to="/register" className="block text-center text-primary-200 hover:text-white text-sm font-bold transition-colors">
                      🌐 ¿Tienes un negocio? Crea tu web gratis →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-primary-500 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-96 h-96 bg-primary-700 rounded-full blur-3xl opacity-20"></div>
      </section>

      {/* Categories section */}
      <section className="py-16 bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Explora servicios cerca de ti</h2>
              <p className="text-slate-600 dark:text-slate-400 mt-2">Encuentra servicios disponibles y reserva ahora</p>
            </div>
          </div>
          
          {!loadingCategories ? (
            <Swiper
              modules={[Pagination, Autoplay]}
              autoplay={{ delay: 4500, pauseOnMouseEnter: true, disableOnInteraction: false }}
              spaceBetween={24}
              slidesPerView={1}
              pagination={{ clickable: true, el: '.swiper-pagination-custom' }}
              breakpoints={{
                640: { slidesPerView: 2 },
                1024: { slidesPerView: 3 },
                1280: { slidesPerView: 4 },
              }}
              className="pb-12"
            >
              {categories.map((cat) => (
                <SwiperSlide key={cat.id}>
                  <Link to={`/explore?category=${cat.id}`} className="group block h-full">
                    <div className="card h-full p-6 flex flex-col hover:border-primary-400 group-hover:shadow-xl transition-all duration-300">
                      <span className="text-4xl block mb-4">
                        {getCategoryIcon(cat.name)}
                      </span>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {cat.name}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-3">
                        {cat.description}
                      </p>
                      <div className="mt-auto pt-4 flex items-center text-primary-600 dark:text-primary-400 font-semibold text-sm">
                        Ver servicios
                        <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                </SwiperSlide>
              ))}
              <div className="swiper-pagination-custom mt-8 flex justify-center"></div>
            </Swiper>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="card h-48 animate-pulse bg-slate-200 dark:bg-slate-800"></div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Blog Section before branding */}
      <BlogHomeSection />

      {/* Brand Image Section (AgendaYa Mascot) */}
      <section className="py-8 sm:py-16 bg-white dark:bg-slate-950 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-lg overflow-hidden bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 min-h-[350px] sm:min-h-[450px] md:min-h-[500px] flex items-center">
            {/* Image as background */}
            <div className="absolute inset-0 z-0">
              <img 
                src={agendayaImage} 
                alt="AgendaYa Mascot" 
                className="w-full h-full object-cover object-center md:object-right transition-transform duration-1000 group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.classList.add('bg-primary-600');
                }}
              />
              {/* Dynamic Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/50 to-slate-900/20 md:bg-gradient-to-r md:from-slate-900/90 md:via-slate-900/40 md:to-transparent"></div>
            </div>
            
            {/* Content - Responsive Padding and Sizing */}
            <div className="relative z-10 p-8 sm:p-12 md:p-20 w-full">
              <div className="max-w-xl">
                <h2 className="text-3xl sm:text-4xl md:text-6xl font-black text-white mb-4 sm:mb-6 tracking-tighter leading-[1.1]">
                  Profesionalismo en <br className="hidden sm:block"/>cada agenda.
                </h2>
                <p className="text-white/90 sm:text-white/80 text-base sm:text-lg md:text-xl mb-8 sm:mb-10 font-medium max-w-md">
                  Nuestra plataforma está diseñada para que tú y tus clientes disfruten de una experiencia rápida, segura y profesional.
                </p>
                <Link 
                  to={cta.registerLink} 
                  className="inline-flex items-center px-8 py-4 bg-primary-500 hover:bg-primary-400 text-white font-black rounded-lg transition-all shadow-xl shadow-primary-500/25 active:scale-95 group/btn"
                >
                  Tu web gratis
                  <svg className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Milestones section */}
      <section className="py-16 bg-white dark:bg-slate-800 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Nuestra Ruta de Crecimiento</h2>
            <p className="text-slate-600 dark:text-slate-400">Trabajamos constantemente para brindarte la mejor plataforma de servicios</p>
          </div>
          
          {loadingMilestones ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-40 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : milestones.length ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {milestones.map((m) => (
                <div key={m.id} className="relative p-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 hover:shadow-lg transition-shadow">
                  <div className="absolute -top-4 left-8 bg-primary-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Hito
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{m.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{m.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-500">Próximamente más novedades.</p>
          )}
          
          {!loading && (
            <div className="mt-16 text-center">
              <div className="inline-block p-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 max-w-2xl">
                <h3 className="text-2xl font-bold text-primary-800 dark:text-primary-300 mb-4">¿Quieres apoyarnos?</h3>
                <p className="text-primary-700 dark:text-primary-400 mb-8">
                  AgendaYa es un proyecto en crecimiento. Tu apoyo nos ayuda a implementar nuevas funcionalidades más rápido.
                </p>
                <Link to="/crowdfunding" className="inline-flex items-center px-8 py-4 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-500 shadow-lg shadow-primary-500/30 transition-all hover:-translate-y-1">
                  Ver campaña de Crowdfunding
                  <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home; 
