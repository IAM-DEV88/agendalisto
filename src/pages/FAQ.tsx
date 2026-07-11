import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Store, Sparkles, ArrowRight, MessageCircle } from 'lucide-react';
import SEO from '../components/SEO';
import { getBusinessCategories } from '../lib/api';
import type { BusinessCategory } from '../lib/api';
import { buildCategoryQuestions } from '../lib/faqContent';

export default function FAQ() {
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [openQuestion, setOpenQuestion] = useState<number | null>(null);

  useEffect(() => {
    getBusinessCategories().then(res => {
      if (res.success && res.data) {
        setCategories(res.data);
        if (res.data.length > 0) setActiveCategory(res.data[0].name);
      }
    });
  }, []);

  const activeQuestions = activeCategory ? buildCategoryQuestions(activeCategory) : [];
  const activeCatObj = categories.find(c => c.name === activeCategory);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 transition-colors duration-200">
      <SEO
        title="Preguntas Frecuentes — ¿Por qué tu negocio necesita AgendaYa?"
        description="Resuelve tus dudas sobre AgendaYa. Descubre por qué barberías, clínicas, gimnasios y más eligen nuestra plataforma de reservas."
      />

      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/5 via-transparent to-primary-400/5 dark:from-primary-500/10 dark:to-primary-950/20 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 sm:pt-28 sm:pb-20 text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-full text-xs font-bold uppercase tracking-wider mb-6 border border-primary-200 dark:border-primary-800/50">
            <MessageCircle className="w-3.5 h-3.5" />
            Preguntas Frecuentes
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1]">
            ¿Por qué tu negocio necesita{' '}
            <span className="text-primary-600 dark:text-primary-400">AgendaYa</span>?
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Responde las dudas más comunes y descubre cómo profesionales como tú ya están
            ahorrando tiempo, eliminando cancelaciones y ofreciendo reservas 24/7.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/business/register"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary-500/25 active:scale-[0.98]"
            >
              <Store className="w-4 h-4" />
              🌐 Mi web gratis
            </Link>
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
            >
              Ver negocios en AgendaYa
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ CATEGORY GRID ═══ */}
      <section className="max-w-7xl mx-auto my-10 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
          {categories.map(cat => {
            const isActive = activeCategory === cat.name;
            return (
              <button
                key={cat.id}
                onClick={() => { setActiveCategory(cat.name); setOpenQuestion(null); }}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-500/25'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-primary-300 dark:hover:border-primary-700 hover:text-primary-600 dark:hover:text-primary-400'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* ═══ FAQ ACCORDION ═══ */}
        {activeCategory && (
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {activeCategory}
              </h2>
              {activeCatObj && (
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Respuestas para profesionales de {activeCategory.toLowerCase()}
                </p>
              )}
            </div>

            <div className="space-y-3 max-w-7xl mx-auto">
              {activeQuestions.map((item, i) => {
                const isOpen = openQuestion === i;
                return (
                  <div
                    key={i}
                    className={`rounded-2xl border transition-all duration-300 ${
                      isOpen
                        ? 'bg-white dark:bg-slate-900 border-primary-200 dark:border-primary-800 shadow-lg shadow-primary-500/5'
                        : 'bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm'
                    }`}
                  >
                    <button
                      onClick={() => setOpenQuestion(isOpen ? null : i)}
                      className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                    >
                      <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug flex-1">
                        {item.q}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 flex-shrink-0 text-slate-400 transition-transform duration-300 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <div className="px-6 pb-5 pt-0 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 mt-0">
                        <div className="pt-4">{item.a}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="my-10 text-center">
              <Link
                to="/business/register"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary-500/25 active:scale-[0.98]"
              >
                <Sparkles className="w-4 h-4" />
                Quiero AgendaYa para mi negocio
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-white/5 rounded-full blur-3xl" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.15]">
            ¿Listo para llevar tu negocio al siguiente nivel?
          </h2>
          <p className="mt-5 text-lg text-primary-100/80 max-w-xl mx-auto leading-relaxed">
            Únete a los profesionales que ya están ahorrando tiempo, eliminando cancelaciones y ofreciendo una experiencia de reserva moderna a sus clientes.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/business/register"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-primary-700 font-black rounded-xl hover:bg-primary-50 transition-all shadow-xl active:scale-[0.98]"
            >
              <Store className="w-4 h-4" />
              🌐 Mi web gratis
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/plans"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary-500/20 text-white font-bold rounded-xl border border-white/20 hover:bg-primary-500/30 transition-all"
            >
              Ver planes
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
