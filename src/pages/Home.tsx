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
  let registerText = 'Registrarse';
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
      registerText = 'Registrar mi negocio';
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
      <div className="relative bg-indigo-600 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-indigo-600 sm:pb-16 md:pb-20 lg:pb-28 xl:pb-32">
            <div className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl">
                  <span className="block">Gestiona tus citas</span>
                  <span className="block text-indigo-200">de forma sencilla</span>
                </h1>
                <p className="mt-3 text-base text-indigo-200 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Plataforma para la gestión de reservas y citas para negocios y servicios.
                  Organiza tu agenda y permite a tus clientes reservar con facilidad.
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <Link to={registerLink} className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 md:py-4 md:text-lg md:px-10">
                      {registerText}
                    </Link>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <Link to={secondLink} className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-800 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10">
                      {secondText}
                    </Link>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <Link to={exploreLink} className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 md:py-4 md:text-lg md:px-10">
                      {exploreText}
                    </Link>
                  </div>
                  {/* boton cerrar sesion */}
                  {user && (
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <button onClick={() => supabase.auth.signOut()} className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-800 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10">
                      Cerrar sesión
                    </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {!loadingCategories ? (
        <div className="max-w-7xl mx-auto">
          <Swiper
            modules={[Pagination, Autoplay]}
            autoplay={{ delay: 4500, pauseOnMouseEnter: true, disableOnInteraction: false }}
            spaceBetween={20}
            slidesPerView={1}
            pagination={{ clickable: true }}
            breakpoints={{
              640: { slidesPerView: 1 },
              768: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
          >
            {categories.map((cat) => (
              <SwiperSlide key={cat.id}>
                <div className="dark:bg-gray-800 rounded-lg p-6 h-full">
                  <h3 className="text-lg font-bold">
                    <Link to={`/explore?category=${cat.id}`} className="text-gray-800 dark:text-white hover:underline">
                      {cat.name}
                    </Link>
                  </h3>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{cat.description}</p>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      ) : (
        <p className="text-center my-8">Cargando categorías...</p>
      )}

      {/* Milestones section */}
      <div className="max-w-7xl mx-4 mx-auto py-8">
        <h2 className="text-2xl font-bold mb-4">Hitos Destacados</h2>
        {loadingMilestones ? (
          <p className="text-center">Cargando hitos...</p>
        ) : milestones.length ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {milestones.map((m) => (
              <div key={m.id} className="p-4 border rounded-lg">
                <h3 className="text-lg font-semibold">{m.title}</h3>
                <p className="text-sm mb-2">{m.description}</p>
                <p className="text-sm">Recaudado: {m.current_amount} / {m.goal_amount}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center">No hay hitos disponibles.</p>
        )}
        { !loading && (
          <div className="text-center mt-6">
            <Link to="/crowdfunding" className="px-6 py-3 bg-indigo-600 text-white rounded hover:bg-indigo-500">
              Apoya nuestros hitos
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home; 
