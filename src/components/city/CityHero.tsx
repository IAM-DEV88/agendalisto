import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Store, ArrowDown } from 'lucide-react';
import type { CityConfig } from '../../lib/cities';

interface CityHeroProps {
  city: CityConfig;
  onRegisterClick: () => void;
}

export default function CityHero({ city, onRegisterClick }: CityHeroProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set('location', city.name);
    if (search.trim()) params.set('search', search.trim());
    navigate(`/explore?${params.toString()}`);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE4YzEuNjU3IDAgMy0xLjM0MyAzLTNzLTEuMzQzLTMtMy0zLTMgMS4zNDMtMyAzIDEuMzQzIDMgMyAzem0wIDM2YzEuNjU3IDAgMy0xLjM0MyAzLTNzLTEuMzQzLTMtMy0zLTMgMS4zNDMtMyAzIDEuMzQzIDMgMyAzeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-white/80 text-xs font-bold uppercase tracking-wider mb-6">
            <Store className="w-3.5 h-3.5" />
            {city.department}, {city.country}
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight mb-4">
            {city.heroTagline}
          </h1>

          <p className="text-lg sm:text-xl text-primary-100 font-medium max-w-2xl mb-8 leading-relaxed">
            {city.heroSubtitle}
          </p>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="¿Qué producto o servicio buscas?"
                className="w-full pl-12 pr-4 py-4 rounded-xl border-0 text-sm font-medium text-slate-900 dark:!text-slate-900 placeholder-slate-400 bg-white dark:!bg-white shadow-xl shadow-black/10 focus:ring-2 focus:ring-primary-300 focus:outline-none transition-shadow"
              />
            </div>
            <button
              type="submit"
              className="px-8 py-4 bg-primary-600 hover:bg-primary-500 text-white font-black rounded-xl transition-all shadow-xl shadow-black/10 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
            >
              <Search className="w-5 h-5" />
              Buscar
            </button>
          </form>

          <div className="mt-8 flex flex-wrap items-center gap-4 text-sm">
            <span className="text-primary-200 font-medium">¿Tienes un negocio aquí?</span>
            <button
              onClick={onRegisterClick}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-bold rounded-xl transition-all hover:-translate-y-0.5 active:translate-y-0 border border-white/10"
            >
              <Store className="w-4 h-4" />
              Registra tu negocio gratis
            </button>
          </div>
        </div>

        <button
          onClick={() => window.scrollTo({ top: window.innerHeight * 0.7, behavior: 'smooth' })}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/40 hover:text-white/70 transition-colors hidden sm:block"
          aria-label="Scroll down"
        >
          <ArrowDown className="w-6 h-6 animate-bounce" />
        </button>
      </div>
    </section>
  );
}
