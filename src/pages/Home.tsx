import { Link } from 'react-router-dom';
import { useAuthSession } from '../hooks/useAuthSession';

const Home = () => {
  const { user, loading } = useAuthSession();
  let registerText = 'Registrarse';
  let registerLink = '/register';
  let secondText = 'Iniciar Sesión';
  let secondLink = '/login';
  if (!loading && user) {
    secondText = 'Explorar';
    secondLink = '/explore';
    if (user.business_id) {
      registerText = 'Mi negocio';
      registerLink = '/business/dashboard';
    } else {
      registerText = 'Registrar mi negocio';
      registerLink = '/business/register';
    }
  }

  return (
    <div className="bg-white">
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
                    <Link to={registerLink} className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-800 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10">
                      {registerText}
                    </Link>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <Link to={secondLink} className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 md:py-4 md:text-lg md:px-10">
                      {secondText}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 
