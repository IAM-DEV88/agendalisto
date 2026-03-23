
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-2">
            <span className="text-2xl font-black text-primary-600 dark:text-primary-400 tracking-tighter">
              AgendaYa
            </span>
            <p className="mt-4 text-slate-600 dark:text-slate-400 max-w-xs">
              La plataforma líder para conectar profesionales con clientes de forma rápida y segura.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Plataforma</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Inicio</Link></li>
              <li><Link to="/explore" className="text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Explorar</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Negocio</h3>
            <ul className="space-y-2">
              <li><Link to="/business/register" className="text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Registrar negocio</Link></li>
              <li><Link to="/crowdfunding" className="text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Apóyanos</Link></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500 dark:text-slate-500">
            &copy; {new Date().getFullYear()} AgendaYa. Todos los derechos reservados.
          </p>
          <div className="flex space-x-6">
            {/* Social links placeholder */}
            <span className="text-slate-400 dark:text-slate-600 text-sm">Hecho con ❤️ para profesionales</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 
