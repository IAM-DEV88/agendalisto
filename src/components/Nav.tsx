import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { signOut, supabase } from '../lib/supabase';
import { UserProfile } from '../lib/supabase';
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
  const hasBusiness = !!user?.business_id;
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileButtonRef = useRef<HTMLButtonElement>(null);

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

      if (isMenuOpen && mobileMenuRef.current && mobileButtonRef.current &&
        !mobileMenuRef.current.contains(event.target as Node) &&
        !mobileButtonRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    if (isUserDropdownOpen || isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserDropdownOpen, isMenuOpen]);

  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm fixed w-full z-50 transition-colors duration-200 border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-2xl font-black text-primary-600 dark:text-primary-400 tracking-tighter">
                AgendaYa
              </Link>
            </div>
          </div>

          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
            <Link to="/" className="px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              Inicio
            </Link>

            <Link to="/explore" className="px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              Explorar
            </Link>

            <Link to="/plans" className="px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              Planes
            </Link>
            <Link to="/blog" className="px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              Blog
            </Link>

            {!isLoggedIn && (
              <div className="flex items-center space-x-2 ml-4">
                <Link to="/login" className="px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-primary-600 transition-colors">
                  Entrar
                </Link>
                <Link to="/register" className="px-5 py-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-500 rounded-xl shadow-md shadow-primary-500/20 transition-all hover:-translate-y-0.5">
                  Unirme
                </Link>
              </div>
            )}
            
            {isLoggedIn && (
              <div className="relative ml-4">
                <button
                  ref={buttonRef}
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="flex items-center px-3 py-2 text-sm font-bold text-slate-700 dark:text-white hover:text-primary-600 group transition-colors"
                >
                  {user?.avatar_url ? (
                    <img
                      src={
                        user.avatar_url.startsWith('http')
                          ? user.avatar_url
                          : supabase.storage.from('avatars').getPublicUrl(user.avatar_url).data.publicUrl
                      }
                      alt={userName}
                      className="h-8 w-8 rounded-full object-cover border-2 border-transparent group-hover:border-primary-500 transition-all"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center border-2 border-transparent group-hover:border-primary-500 transition-all">
                      <span className="text-xs font-bold text-primary-700 dark:text-primary-300">{userName.charAt(0)}</span>
                    </div>
                  )}
                  <span className="ml-2 hidden lg:block">{userName}</span>
                  <svg className={`ml-1 h-4 w-4 text-slate-400 group-hover:text-primary-500 transition-transform ${isUserDropdownOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isUserDropdownOpen && (
                  <div ref={dropdownRef} className="origin-top-right absolute right-0 mt-2 w-56 rounded-2xl shadow-xl bg-white dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700 z-20 py-2 overflow-hidden animate-in fade-in zoom-in duration-200">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cuenta</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{userName}</p>
                    </div>
                    <div className="py-1">
                      <Link to="/dashboard" onClick={() => setIsUserDropdownOpen(false)} className="flex items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-slate-700 hover:text-primary-700 dark:hover:text-primary-400 transition-colors">
                        <svg className="mr-3 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        Mi Perfil
                      </Link>
                      {hasBusiness && (
                        <Link to="/business/dashboard" onClick={() => setIsUserDropdownOpen(false)} className="flex items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-slate-700 hover:text-primary-700 dark:hover:text-primary-400 transition-colors">
                          <svg className="mr-3 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                          Mi Negocio
                        </Link>
                      )}
                      <button onClick={() => { setIsUserDropdownOpen(false); handleLogout(); }} className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <svg className="mr-3 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        Cerrar Sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <button 
              onClick={toggleTheme} 
              className="ml-2 p-2 rounded-xl text-slate-500 hover:text-primary-600 hover:bg-primary-50 dark:text-slate-400 dark:hover:text-primary-400 dark:hover:bg-slate-800 transition-all" 
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>

          <div className="flex items-center sm:hidden">
            <button 
              onClick={toggleTheme} 
              className="p-2 mr-2 rounded-xl text-slate-500 dark:text-slate-400"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button
              ref={mobileButtonRef}
              onClick={() => setIsMenuOpen(prev => !prev)}
              className="inline-flex items-center justify-center p-2 rounded-xl text-slate-500 hover:text-primary-600 hover:bg-primary-50 dark:text-slate-400 dark:hover:text-primary-400 dark:hover:bg-slate-800 transition-all"
              aria-expanded={isMenuOpen}
            >
              <span className="sr-only">Abrir menú</span>
              {isMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div ref={mobileMenuRef} className="sm:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 animate-in slide-in-from-top duration-300">
          <div className="pt-2 pb-6 px-4 space-y-2">
            <Link to="/" onClick={() => setIsMenuOpen(false)} className="block px-4 py-3 text-base font-bold text-slate-700 dark:text-slate-300 rounded-xl hover:bg-primary-50 dark:hover:bg-slate-800 hover:text-primary-600 transition-all">
              Inicio
            </Link>
            <Link to="/explore" onClick={() => setIsMenuOpen(false)} className="block px-4 py-3 text-base font-bold text-slate-700 dark:text-slate-300 rounded-xl hover:bg-primary-50 dark:hover:bg-slate-800 hover:text-primary-600 transition-all">
              Explorar
            </Link>
            <Link to="/plans" onClick={() => setIsMenuOpen(false)} className="block px-4 py-3 text-base font-bold text-slate-700 dark:text-slate-300 rounded-xl hover:bg-primary-50 dark:hover:bg-slate-800 hover:text-primary-600 transition-all">
              Planes
            </Link>
            <Link to="/blog" onClick={() => setIsMenuOpen(false)} className="block px-4 py-3 text-base font-bold text-slate-700 dark:text-slate-300 rounded-xl hover:bg-primary-50 dark:hover:bg-slate-800 hover:text-primary-600 transition-all">
              Blog
            </Link>
            
            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
              {!isLoggedIn ? (
                <div className="grid grid-cols-2 gap-4">
                  <Link to="/login" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-center px-4 py-3 text-base font-bold text-slate-700 dark:text-slate-300 rounded-xl bg-slate-100 dark:bg-slate-800">
                    Entrar
                  </Link>
                  <Link to="/register" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-center px-4 py-3 text-base font-bold text-white rounded-xl bg-primary-600">
                    Unirme
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link to="/dashboard" onClick={() => setIsMenuOpen(false)} className="block px-4 py-3 text-base font-bold text-slate-700 dark:text-slate-300 rounded-xl hover:bg-primary-50 dark:hover:bg-slate-800">
                    Mi Perfil
                  </Link>
                  {hasBusiness && (
                    <Link to="/business/dashboard" onClick={() => setIsMenuOpen(false)} className="block px-4 py-3 text-base font-bold text-slate-700 dark:text-slate-300 rounded-xl hover:bg-primary-50 dark:hover:bg-slate-800">
                      Mi Negocio
                    </Link>
                  )}
                  <button onClick={() => { setIsMenuOpen(false); handleLogout(); }} className="block w-full text-left px-4 py-3 text-base font-bold text-red-600 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Nav; 
