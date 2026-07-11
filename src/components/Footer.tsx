import { Link } from 'react-router-dom';
import { Store, Heart, ArrowUp, BookOpen, Sparkles } from 'lucide-react';

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 transition-colors duration-200">
      {/* Top accent bar */}
      <div className="h-1 bg-gradient-to-r from-primary-500 via-primary-400 to-primary-600" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-4">
            <Link to="/" className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              AgendaYa
            </Link>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs">
              La plataforma para conectar profesionales con clientes. Reserva servicios cerca de ti en segundos.
            </p>
            <div className="flex items-center gap-3 mt-5">
              <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400 dark:text-slate-500">
                <Sparkles className="w-3.5 h-3.5 text-primary-500 dark:text-primary-400" />
                Hecho con dedicación
              </span>
            </div>
          </div>

          {/* Platform */}
          <div className="lg:col-span-2">
            <h3 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-4">Plataforma</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Inicio</Link>
              </li>
              <li>
                <Link to="/explore" className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Explorar</Link>
              </li>
              <li>
                <Link to="/blog" className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">FAQ</Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-4">Para tu negocio</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/business/register" className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5" />
                  Registrar negocio
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Iniciar sesión</Link>
              </li>
              <li>
                <Link to="/register" className="text-sm font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors flex items-center gap-1.5">
                  🌐 Obtén tu web gratis
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-4">Comunidad</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/crowdfunding" className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  Apóyanos
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Crear cuenta</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            &copy; {new Date().getFullYear()} AgendaYa. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/explore" className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">Explorar</Link>
            <Link to="/blog" className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">Blog</Link>
            <Link to="/business/register" className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">Registrar negocio</Link>
            <button
              onClick={scrollToTop}
              className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-primary-600 dark:hover:bg-primary-600 text-slate-500 dark:text-slate-400 hover:text-white rounded-xl transition-all hover:-translate-y-1"
              aria-label="Volver arriba"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
