import { Link } from 'react-router-dom';
import { useAuthSession } from '../hooks/useAuthSession';
import { useState, useEffect } from 'react';
import { getBusinessCategories, BusinessCategory, getTopMilestones } from '../lib/api';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { supabase } from '../lib/supabase';
import type { Milestone } from '../lib/api';

const Home = () => {
  const { user, loading } = useAuthSession();
  let registerText = 'Registrarse GRATIS';
  let registerLink = '/register';
  let secondText = 'Iniciar Sesión';
  let secondLink = '/login';
  const exploreText = 'Explorar';
  const exploreLink = '/explore';
  if (!loading && user) {
    secondText = 'Mi Perfil';
    secondLink = '/dashboard';
    if (user.business_id) {
      registerText = 'Mi negocio';
      registerLink = '/business/dashboard';
    } else {
      registerText = 'Registrar mi negocio GRATIS';
      registerLink = '/business/register';
    }
  }

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
    <div>
      {/* Hero section */}
      <section className="relative bg-primary-600 dark:bg-primary-900 overflow-hidden py-16 sm:py-24 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl mb-6">
                <span className="block">Haz lo que amas.</span>
                <span className="block text-primary-200">Gana como mereces.</span>
              </h1>
              <p className="text-primary-100 text-lg sm:text-xl md:text-2xl max-w-2xl mx-auto md:mx-0 mb-8 leading-relaxed">
                Publica tus servicios, recibe valoraciones y empieza a destacar.
                Conecta con quienes buscan tu talento.
              </p>
              <div className="hidden md:flex gap-4">
                <Link to={exploreLink} className="px-8 py-3 bg-white text-primary-700 font-bold rounded-lg hover:bg-primary-50 transition-colors shadow-lg">
                  {exploreText}
                </Link>
              </div>
            </div>
            
            <div className="w-full max-w-md bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">Empieza hoy</h2>
              <div className="flex flex-col gap-4">
                <Link to={registerLink} className="btn-primary w-full">
                  {registerText}
                </Link>
                <Link to={secondLink} className="btn-secondary w-full bg-white/20 border-white/30 text-white hover:bg-white/30 dark:bg-white/10 dark:text-white dark:hover:bg-white/20">
                  {secondText}
                </Link>
                <div className="md:hidden">
                  <Link to={exploreLink} className="btn-secondary w-full border-white/30 text-white hover:bg-white/30 dark:bg-white/10 dark:text-white dark:hover:bg-white/20">
                    {exploreText}
                  </Link>
                </div>
                {user && (
                  <button 
                    onClick={() => supabase.auth.signOut()} 
                    className="text-white/70 hover:text-white text-sm font-medium mt-2 transition-colors"
                  >
                    Cerrar sesión
                  </button>
                )}
              </div>
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
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Explora por Categoría</h2>
              <p className="text-slate-600 dark:text-slate-400 mt-2">Encuentra al profesional ideal para lo que necesites</p>
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
                      <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <span className="text-primary-600 dark:text-primary-400 text-xl font-bold">
                          {cat.name.charAt(0)}
                        </span>
                      </div>
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
                <div key={i} className="h-40 bg-slate-100 dark:bg-slate-700 rounded-xl animate-pulse"></div>
              ))}
            </div>
          ) : milestones.length ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {milestones.map((m) => (
                <div key={m.id} className="relative p-8 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 hover:shadow-lg transition-shadow">
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
              <div className="inline-block p-8 rounded-3xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 max-w-2xl">
                <h3 className="text-2xl font-bold text-primary-800 dark:text-primary-300 mb-4">¿Quieres apoyarnos?</h3>
                <p className="text-primary-700 dark:text-primary-400 mb-8">
                  AgendaYa es un proyecto en crecimiento. Tu apoyo nos ayuda a implementar nuevas funcionalidades más rápido.
                </p>
                <Link to="/crowdfunding" className="inline-flex items-center px-8 py-4 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-500 shadow-lg shadow-primary-500/30 transition-all hover:-translate-y-1">
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
