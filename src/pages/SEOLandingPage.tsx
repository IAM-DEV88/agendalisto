import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getBusinesses, getBusinessCategories } from '../lib/api';
import type { Business, BusinessCategory } from '../lib/api';
import SEO from '../components/SEO';
import EmptyState from '../components/ui/EmptyState';
import { Store, MapPin, ArrowRight } from 'lucide-react';

const FALLBACK_LOGO = 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png';

export default function SEOLandingPage() {
  const { city, category } = useParams<{ city?: string; category?: string }>();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const cityName = city ? city.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '';
  const categorySlug = category || '';
  const matchedCategory = categories.find(c =>
    c.name.toLowerCase() === categorySlug.replace(/-/g, ' ')
  );
  const categoryName = matchedCategory?.name || (categorySlug ? categorySlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: cats } = await getBusinessCategories();
      if (cats) setCategories(cats);

      let results: Business[] = [];
      try {
        results = await getBusinesses();
      } catch {} // Fallback a vacío

      if (categorySlug) {
        const cat = cats?.find(c =>
          c.name.toLowerCase() === categorySlug.replace(/-/g, ' ')
        );
        if (cat) results = results.filter(b => b.category_id === cat.id);
      }

      if (cityName) {
        results = results.filter(b =>
          b.address.toLowerCase().includes(cityName.toLowerCase())
        );
      }

      setBusinesses(results);
      setLoading(false);
    };
    load();
  }, [city, category]);

  const pageTitle = categoryName
    ? cityName
      ? `Los mejores ${categoryName.toLowerCase()} en ${cityName}`
      : `Los mejores ${categoryName.toLowerCase()} en Colombia`
    : cityName
      ? `Negocios en ${cityName}`
      : 'Negocios cerca de ti';

  const pageDesc = `Encuentra y reserva ${categoryName ? 'los mejores ' + categoryName.toLowerCase() + ' ' : 'servicios profesionales '}${cityName ? 'en ' + cityName : 'cerca de ti'}. Agenda tu cita online gratis.`;

  const makeSlug = (name: string) => name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]/g, '');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-96 mb-10 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-48 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 transition-colors duration-200 py-12 px-4 sm:px-6 lg:px-8">
      <SEO title={pageTitle} description={pageDesc} />

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-7 h-7 text-primary-600 dark:text-primary-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-3">{pageTitle}</h1>
          <p className="text-base text-slate-500 dark:text-slate-400 font-medium max-w-xl mx-auto">{pageDesc}</p>
          {businesses.length > 0 && (
            <p className="text-sm text-slate-400 mt-3">{businesses.length} {businesses.length === 1 ? 'negocio encontrado' : 'negocios encontrados'}</p>
          )}
        </div>

        {businesses.length === 0 ? (
          <>
            <EmptyState icon={<Store className="w-8 h-8" />} title="No encontramos resultados" description="Intenta buscar en otra ciudad o categoría." action={{ label: 'Explorar todos', to: '/explore' }} />
            <div className="mt-6 text-center">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-5 py-3 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-bold text-sm rounded-xl border border-primary-200 dark:border-primary-800 hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-all"
              >
                🌐 ¿Tienes un negocio? Crea tu web gratis y aparece aquí →
              </Link>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {businesses.map(business => (
              <Link key={business.id} to={`/${business.slug}`}
                className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="h-48 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <img src={business.logo_url || FALLBACK_LOGO} alt={business.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={e => { (e.target as HTMLImageElement).src = FALLBACK_LOGO; }} />
                </div>
                <div className="p-5">
                  <h3 className="font-black text-lg text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors line-clamp-1">{business.name}</h3>
                  {business.address && (
                    <p className="flex items-center gap-1.5 text-xs text-slate-400 mt-1.5">
                      <MapPin className="w-3 h-3" />{business.address}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-primary-600 dark:text-primary-400 font-black text-xs uppercase tracking-widest flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Ver perfil <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {categories.length > 0 && !matchedCategory && (
          <div className="mt-16">
            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6 text-center">
              Explora por categoría {cityName && `en ${cityName}`}
            </h2>
            <div className="flex flex-wrap justify-center gap-3">
              {categories.map(cat => (
                <Link key={cat.id}
                  to={cityName ? `/categorias/${makeSlug(cat.name)}-${makeSlug(cityName)}` : `/categorias/${makeSlug(cat.name)}`}
                  className="px-5 py-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-700 dark:text-slate-300 hover:border-primary-300 dark:hover:border-primary-700 hover:text-primary-600 transition-all"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
