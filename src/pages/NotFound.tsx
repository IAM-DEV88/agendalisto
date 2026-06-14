import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <SEO title="Página no encontrada" description="La página que buscas no existe o ha sido movida." />
      <div className="text-center max-w-md">
        <h1 className="text-8xl font-black text-primary-600 dark:text-primary-400 mb-4">404</h1>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Página no encontrada</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
          La página que buscas no existe o ha sido movida a otra dirección.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary-500/25 active:scale-[0.98]"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
