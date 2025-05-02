import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { signOut, supabase } from '../lib/supabase';
import { UserProfile } from '../lib/supabase';
import { getUserBusiness } from '../lib/api';
import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

type NavProps = {
  user: UserProfile | null;
};

const Nav = ({ user }: NavProps) => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [hasBusiness, setHasBusiness] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
    }
  };

  // Para prevenir errores cuando user es null
  const isLoggedIn = !!user;
  const userName = user?.full_name || 'Usuario';

  // Verificar si el usuario tiene un negocio
  useEffect(() => {
    const checkUserBusiness = async () => {
      if (user?.id) {
        try {
          const { success, business } = await getUserBusiness(user.id);
          setHasBusiness(success && business !== null);
        } catch (err) {
          setHasBusiness(false);
        }
      } else {
        setHasBusiness(false);
      }
    };

    checkUserBusiness();
  }, [user]);

  // Close both menus when route changes
  useEffect(() => {
    setIsMenuOpen(false);
    setIsUserDropdownOpen(false);
  }, [location.pathname]);

  // Efecto para manejar clics fuera del menú desplegable de usuario
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (isUserDropdownOpen && dropdownRef.current && buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    }
    if (isUserDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserDropdownOpen]);

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-2xl font-bold text-indigo-600 dark:text-white">
                AgendaListo
              </Link>
            </div>
          </div>

          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-8">
            <Link to="/" className="px-2 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600">
              Inicio
            </Link>

            <Link to="/explore" className="px-2 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600">
              Explorar Negocios
            </Link>

            {!isLoggedIn && (
              <>
                <Link to="/login" className="px-2 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600">
                  Iniciar Sesión
                </Link>
                <Link to="/register" className="px-3 py-1 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md">
                  Registrarse
                </Link>
              </>
            )}
            {isLoggedIn && (
              <div className="relative">
                <button
                  ref={buttonRef}
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600"
                >
                  {user?.avatar_url ? (
                    <img
                      src={
                        user.avatar_url.startsWith('http')
                          ? user.avatar_url
                          : supabase.storage.from('avatars').getPublicUrl(user.avatar_url).data.publicUrl
                      }
                      alt={userName}
                      className="inline-flex h-6 w-6 rounded-full object-cover mr-2"
                    />
                  ) : (
                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-indigo-100 mr-2">
                      <span className="text-xs font-medium leading-none text-indigo-700">{userName.charAt(0)}</span>
                    </span>
                  )}
                  <span className="dark:text-white">{userName}</span>
                  <svg className="ml-1 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isUserDropdownOpen && (
                  <div ref={dropdownRef} className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-600 ring-1 ring-black ring-opacity-5 z-20">
                    <div className="py-1">
                      <Link to="/dashboard" onClick={() => setIsUserDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 dark:text-white dark:hover:text-black hover:bg-gray-100">Mi Perfil</Link>
                      {hasBusiness && <Link to="/business/dashboard" onClick={() => setIsUserDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 dark:text-white dark:hover:text-black hover:bg-gray-100">Mi Negocio</Link>}
                      <button onClick={() => { setIsUserDropdownOpen(false); handleLogout(); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-white dark:hover:text-black hover:bg-gray-100">Cerrar Sesión</button>
                    </div>
                  </div>
                )}
              </div>
            )}
            <button onClick={toggleTheme} className="ml-2 p-2 rounded-md text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" aria-label="Toggle theme">
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>

          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setIsMenuOpen(prev => !prev)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              aria-expanded={isMenuOpen}
            >
              <span className="sr-only">Abrir menú</span>
              {/* Menu icon */}
              <svg
                className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              {/* X icon */}
              <svg
                className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <Link to="/" onClick={() => setIsMenuOpen(false)} className="block px-2 py-1 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600 hover:bg-gray-50 dark:hover:bg-gray-700">
              Inicio
            </Link>
            <Link to="/explore" onClick={() => setIsMenuOpen(false)} className="block px-2 py-1 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600 hover:bg-gray-50 dark:hover:bg-gray-700">
              Explorar Negocios
            </Link>
            {!isLoggedIn ? (
              <> 
                <Link to="/login" onClick={() => setIsMenuOpen(false)} className="block px-2 py-1 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600 hover:bg-gray-50 dark:hover:bg-gray-700">
                  Iniciar Sesión
                </Link>
                <Link to="/register" onClick={() => setIsMenuOpen(false)} className="block px-2 py-1 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600 hover:bg-gray-50 dark:hover:bg-gray-700">
                  Registrarse
                </Link>
              </>
            ) : (
              <> 
                <Link to="/dashboard" onClick={() => setIsMenuOpen(false)} className="block px-2 py-1 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600 hover:bg-gray-50 dark:hover:bg-gray-700">
                  Mi Perfil
                </Link>
                {hasBusiness && (
                  <Link to="/business/dashboard" onClick={() => setIsMenuOpen(false)} className="block px-2 py-1 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600 hover:bg-gray-50 dark:hover:bg-gray-700">
                    Mi Negocio
                  </Link>
                )}
                <button onClick={() => { setIsMenuOpen(false); handleLogout(); }} className="block w-full text-left px-2 py-1 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600 hover:bg-gray-50 dark:hover:bg-gray-700">
                  Cerrar Sesión
                </button>
              </>
            )}
            {/* Theme toggle */}
            <button onClick={() => { setIsMenuOpen(false); toggleTheme(); }} className="block w-full text-left px-2 py-1 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600 hover:bg-gray-50 dark:hover:bg-gray-700" aria-label="Toggle theme">
              {theme === 'dark' ? <Sun className="inline h-5 w-5 mr-1" /> : <Moon className="inline h-5 w-5 mr-1" />}
              {theme === 'dark' ? 'Claro' : 'Oscuro'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Nav; 
