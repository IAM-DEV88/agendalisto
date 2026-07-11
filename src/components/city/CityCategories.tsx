import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { BusinessCategory } from '../../lib/api';
import type { CityConfig } from '../../lib/cities';
import { getCategoryIcon } from '../../lib/categoryIcons';

function buildCategoryUrl(cat: BusinessCategory, city: CityConfig): string {
  const params = new URLSearchParams();
  params.set('location', city.name);
  params.set('category', cat.id);
  return `/explore?${params.toString()}`;
}

export default function CityCategories({ categories, city }: CityCategoriesProps) {
  if (categories.length === 0) return null;

  const priorityNames = city.priorityCategories.map((n) => n.toLowerCase());
  const priorityCats = categories.filter((c) => priorityNames.includes(c.name.toLowerCase()));
  const otherCats = categories.filter((c) => !priorityNames.includes(c.name.toLowerCase()));

  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
          ¿Qué buscas en {city.name}?
        </h2>
        <p className="text-base text-slate-500 dark:text-slate-400 font-medium max-w-xl mx-auto">
          Explora por categoría o encuentra justo lo que necesitas
        </p>
      </div>

      {priorityCats.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
          {priorityCats.map((cat) => (
            <Link
              key={cat.id}
              to={buildCategoryUrl(cat, city)}
              className="group relative bg-white dark:bg-slate-900 rounded-2xl border-2 border-primary-100 dark:border-primary-900/50 p-5 sm:p-6 text-center hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <span className="text-3xl sm:text-4xl block mb-2">{getCategoryIcon(cat.name)}</span>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors">
                {cat.name}
              </h3>
              {cat.description && (
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{cat.description}</p>
              )}
            </Link>
          ))}
        </div>
      )}

      {otherCats.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {otherCats.map((cat) => (
            <Link
              key={cat.id}
              to={buildCategoryUrl(cat, city)}
              className="group relative bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-100 dark:border-slate-800 p-5 sm:p-6 text-center hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
            >
              <span className="text-3xl sm:text-4xl block mb-2">{getCategoryIcon(cat.name)}</span>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors">
                {cat.name}
              </h3>
              {cat.description && (
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{cat.description}</p>
              )}
            </Link>
          ))}
        </div>
      )}

      <div className="text-center mt-10">
        <Link
          to={`/explore?location=${encodeURIComponent(city.name)}`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary-500/25 hover:-translate-y-0.5 active:translate-y-0"
        >
          Ver todos los negocios en {city.name}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
