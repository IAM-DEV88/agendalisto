import { Sprout, TrendingUp, MessageCircle, Globe, ChevronRight } from 'lucide-react';
import type { CityConfig } from '../../lib/cities';

interface AgricultureSectionProps {
  city: CityConfig;
  onLeadClick: () => void;
}

export default function AgricultureSection({ city, onLeadClick }: AgricultureSectionProps) {
  if (!city.hasAgriculture) return null;

  const props = city.agricultureValueProps ?? [];
  const iconMap = [Globe, MessageCircle, TrendingUp, Sprout] as const;

  return (
    <section className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-slate-900 border-y border-emerald-100 dark:border-emerald-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider rounded-full mb-5">
              <Sprout className="w-3.5 h-3.5" />
              Sector agroindustrial
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-4 leading-[1.15]">
              {city.agricultureTitle}
            </h2>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 font-medium leading-relaxed mb-8">
              {city.agricultureDescription}
            </p>

            <div className="space-y-4 mb-8">
              {props.map((prop, i) => {
                const Icon = iconMap[i] ?? ChevronRight;
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-300">
                      {prop}
                    </span>
                  </div>
                );
              })}
            </div>

            <button
              onClick={onLeadClick}
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/25 hover:-translate-y-0.5 active:translate-y-0"
            >
              Quiero registrar mi bodega o finca
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="relative hidden lg:block">
            <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-emerald-200 to-green-100 dark:from-emerald-900/30 dark:to-slate-800 overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-8xl block mb-4">🌱</span>
                  <p className="text-emerald-700 dark:text-emerald-300 font-bold text-lg">
                    {city.name}, {city.department}
                  </p>
                  <p className="text-emerald-600/60 dark:text-emerald-400/40 font-medium text-sm mt-1">
                    Productores y exportadores
                  </p>
                </div>
              </div>
              <div className="absolute bottom-4 left-4 right-4 grid grid-cols-3 gap-2">
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl p-3 text-center">
                  <span className="text-2xl">☕</span>
                  <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 mt-1">Café</p>
                </div>
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl p-3 text-center">
                  <span className="text-2xl">🥑</span>
                  <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 mt-1">Aguacate</p>
                </div>
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl p-3 text-center">
                  <span className="text-2xl">🐉</span>
                  <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 mt-1">Pitaya</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
