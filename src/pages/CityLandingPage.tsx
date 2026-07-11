import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Store, ArrowRight, Search, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import SEO from '../components/SEO';
import { CityHero, CityCategories, AgricultureSection, BusinessLeadForm } from '../components/city';
import { getBusinesses, getBusinessCategories, insertLandingLead } from '../lib/api';
import { AGENDAYA_WHATSAPP } from '../lib/config';
import { getCityConfig } from '../lib/cities';
import type { Business, BusinessCategory } from '../lib/api';

const FALLBACK_LOGO = 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png';

export default function CityLandingPage() {
  const { city: citySlug } = useParams<{ city: string }>();
  const cityConfig = citySlug ? getCityConfig(citySlug) : null;

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerDemand, setCustomerDemand] = useState('');
  const [demandSubmitting, setDemandSubmitting] = useState(false);

  const leadFormRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cityConfig) {
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const [results, catsRes] = await Promise.all([
          getBusinesses(undefined, undefined, cityConfig.name, 12),
          getBusinessCategories(),
        ]);
        setBusinesses(results ?? []);
        if (catsRes.success && catsRes.data) setCategories(catsRes.data);
      } catch {
        // Silently handle errors — page still renders in cold-start mode
      }
      setLoading(false);
    };
    load();
  }, [citySlug]);

  const scrollToLeadForm = () => {
    leadFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleDemandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerDemand.trim()) return;
    setDemandSubmitting(true);
    const result = await insertLandingLead({
      type: 'customer',
      city_slug: cityConfig?.slug ?? citySlug ?? '',
      name: 'Anónimo',
      message: customerDemand.trim(),
    });
    setDemandSubmitting(false);
    if (result.success) {
      toast.success('¡Gracias! Te avisaremos cuando esté disponible.');
      setCustomerDemand('');
    } else {
      toast.error('No pudimos guardar tu solicitud. Intenta de nuevo.');
    }
  };

  // --------------------- 404: city not found ---------------------
  if (!cityConfig) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 flex items-center justify-center px-4">
        <SEO title="Ciudad no encontrada" description="La ciudad que buscas no está disponible." />
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-6 text-slate-400">
            <MapPin className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
            Ciudad no encontrada
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-8">
            {citySlug
              ? `No tenemos información para "${citySlug.replace(/-/g, ' ')}".`
              : 'No especificaste una ciudad.'}
          </p>
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary-500/25"
          >
            Explorar todos los negocios
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const pageTitle = `${cityConfig.name}: ${cityConfig.heroTagline}`;

  const coldStart = businesses.length === 0;

  // --------------------- Loading state ---------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
        <SEO title={pageTitle} description={cityConfig.description} />
        <div className="h-[60vh] bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --------------------- Schema for the city ---------------------
  const citySchema = {
    '@context': 'https://schema.org',
    '@type': 'City',
    name: cityConfig.name,
    containedInPlace: {
      '@type': 'State',
      name: cityConfig.department,
    },
    description: cityConfig.description,
  };

  // --------------------- Render ---------------------
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 transition-colors duration-200">
      <SEO
        title={pageTitle}
        description={cityConfig.description}
        canonical={`${window.location.origin}/ciudades/${cityConfig.slug}`}
        schemaData={citySchema}
      />

      <CityHero city={cityConfig} onRegisterClick={scrollToLeadForm} />

      {/* --- HOT STATE: businesses found --- */}
      {!coldStart ? (
        <>
          <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Negocios en {cityConfig.name}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {businesses.length} {businesses.length === 1 ? 'negocio encontrado' : 'negocios encontrados'}
                </p>
              </div>
              <Link
                to={`/explore?location=${encodeURIComponent(cityConfig.name)}`}
                className="hidden sm:inline-flex items-center gap-2 text-sm font-bold text-primary-600 hover:text-primary-500 transition-colors"
              >
                Ver todos
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {businesses.map((business) => (
                <Link
                  key={business.id}
                  to={`/${business.slug}`}
                  className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="h-48 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <img
                      src={business.logo_url || FALLBACK_LOGO}
                      alt={business.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_LOGO; }}
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="font-black text-lg text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors line-clamp-1">
                      {business.name}
                    </h3>
                    {business.address && (
                      <p className="flex items-center gap-1.5 text-xs text-slate-400 mt-1.5">
                        <MapPin className="w-3 h-3" />
                        {business.address}
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
          </section>

          <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900/50 border-y border-slate-100 dark:border-slate-800">
            <div className="max-w-2xl mx-auto text-center">
              <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center mx-auto mb-4">
                <Store className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
                ¿Tienes un negocio en {cityConfig.name}?
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-6 max-w-sm mx-auto">
                Aparece junto a los mejores de tu ciudad. 🌐 Página web gratis, sin instalaciones complicadas.
              </p>
              <button
                onClick={scrollToLeadForm}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary-500/25 hover:-translate-y-0.5 active:translate-y-0"
              >
                Registrar mi negocio
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </section>

          <CityCategories categories={categories} city={cityConfig} />

          <div ref={leadFormRef}>
            <BusinessLeadForm city={cityConfig} categories={categories} />
          </div>
        </>
      ) : (
        /* --- COLD START: no businesses yet --- */
        <>
          <CityCategories categories={categories} city={cityConfig} />

          {cityConfig.hasAgriculture && (
            <AgricultureSection city={cityConfig} onLeadClick={scrollToLeadForm} />
          )}

          {/* Demand capture */}
          <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="max-w-lg mx-auto text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                <Search className="w-7 h-7 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                ¿No encuentras lo que buscas?
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-6">
                Cuéntanos qué negocio te gustaría encontrar en {cityConfig.name} y te avisamos cuando esté disponible.
              </p>
              <form onSubmit={handleDemandSubmit} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={customerDemand}
                  onChange={(e) => setCustomerDemand(e.target.value)}
                  placeholder="Ej: Café de especialidad, Bodega de aguacate..."
                  className="flex-1 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:outline-none transition-shadow"
                />
                <button
                  type="submit"
                  disabled={demandSubmitting || !customerDemand.trim()}
                  className="px-6 py-3 bg-primary-600 hover:bg-primary-500 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary-500/25 hover:-translate-y-0.5 active:translate-y-0 disabled:transform-none flex items-center justify-center gap-2 shrink-0"
                >
                  {demandSubmitting ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Avisarme'
                  )}
                </button>
              </form>
            </div>
          </section>

          {/* WhatsApp direct */}
          <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-primary-600/5 dark:bg-primary-500/5 border-y border-primary-100 dark:border-primary-900/30">
            <div className="max-w-lg mx-auto text-center">
              <div className="w-14 h-14 rounded-2xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-7 h-7 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                ¿Prefieres escribirnos?
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-6">
                Cuéntanos de tu negocio directamente por WhatsApp y te ayudamos en minutos.
              </p>
              <a
                href={`https://wa.me/${AGENDAYA_WHATSAPP}?text=${encodeURIComponent(`Hola, quiero registrar mi negocio en AgendaYa ${cityConfig.name}.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-green-500/25 hover:-translate-y-0.5 active:translate-y-0"
              >
                <MessageCircle className="w-4 h-4" />
                Escribir por WhatsApp
              </a>
            </div>
          </section>

          <div ref={leadFormRef}>
            <BusinessLeadForm city={cityConfig} categories={categories} />
          </div>
        </>
      )}
    </div>
  );
}
