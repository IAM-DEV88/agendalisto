import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import { PLANS, PLAN_LABELS, PLAN_DESCRIPTIONS, PLAN_PRICES, PLAN_FEATURES, PLAN_BADGE, Plan } from '../lib/roles';
import type { RootState } from '../store';
import SEO from '../components/SEO';
import PayPalSubscribeButton from '../components/PayPalSubscribeButton';
import { Check, X, Sparkles, Crown, Store, TrendingUp, MessageCircle, BarChart3, ShieldCheck } from 'lucide-react';

const PLAN_ICONS: Record<Plan, React.ReactNode> = {
  starter: <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500" />,
  pro: <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400"><Sparkles className="w-5 h-5" /></div>,
  premium: <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400"><Crown className="w-5 h-5" /></div>,
};

const PLAN_CARDS: Record<Plan, { border: string; bg: string; accent: string; button: string; popular?: boolean }> = {
  starter: {
    border: 'border-slate-200 dark:border-slate-700',
    bg: 'bg-white dark:bg-slate-900',
    accent: 'bg-slate-50 dark:bg-slate-800',
    button: 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200',
  },
  pro: {
    border: 'border-blue-200 dark:border-blue-800',
    bg: 'bg-white dark:bg-slate-900',
    accent: 'bg-blue-50 dark:bg-blue-950/30',
    button: 'bg-blue-600 hover:bg-blue-700 text-white',
    popular: true,
  },
  premium: {
    border: 'border-amber-200 dark:border-amber-800',
    bg: 'bg-white dark:bg-slate-900',
    accent: 'bg-amber-50 dark:bg-amber-950/30',
    button: 'bg-amber-600 hover:bg-amber-700 text-white',
  },
};

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID;

function PlansContent() {
  const userProfile = useSelector((state: RootState) => state.user.userProfile);
  const user = useSelector((state: RootState) => state.user.user);
  const hasBusiness = !!userProfile?.business_id;
  const currentPlan = userProfile?.plan;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <SEO
        title="Planes y Precios"
        description="Elige el plan perfecto para tu negocio en AgendaYa. Desde Starter gratis hasta Premium con máxima visibilidad."
      />

      <div className="max-w-6xl mx-auto px-4 py-16 sm:py-24">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
            Planes para tu negocio
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            Empieza gratis y escala a medida que creces. Todos los planes incluyen tu propia página web profesional con gestión de citas.
          </p>
        </div>

        {/* ═══ FEATURE UNLOCK COMPARISON BANNER ═══ */}
        <div className="mb-12 bg-gradient-to-r from-blue-50 via-white to-amber-50 dark:from-blue-950/20 dark:via-slate-900 dark:to-amber-950/20 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8">
          <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight mb-6 text-center">
            ¿Qué desbloqueas al mejorar tu plan?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Mejor posición</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Aparece primero en búsquedas con score +2/+3</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 shrink-0">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">WhatsApp + Email</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Notificaciones y contacto con clientes</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 shrink-0">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Analytics</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Ingresos, tendencias, retención y LTV</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Badge + Prioridad</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Distintivo Pro/Premium en tu perfil</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {PLANS.map((planId) => {
            const plan = planId as Plan;
            const features = PLAN_FEATURES[plan];
            const card = PLAN_CARDS[plan];
            const price = PLAN_PRICES[plan];
            const badge = PLAN_BADGE[plan];

            return (
              <div
                key={plan}
                className={`relative flex flex-col rounded-lg border-2 ${card.border} ${card.bg} shadow-lg ${
                  card.popular ? 'scale-[1.02] shadow-xl shadow-blue-200/30 dark:shadow-blue-900/20 z-10' : ''
                } transition-all hover:-translate-y-1`}
              >
                {/* Popular Badge */}
                {card.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
                    Más popular
                  </div>
                )}

                {/* Card Header */}
                <div className={`p-6 sm:p-8 rounded-t-3xl ${card.accent}`}>
                  <div className="flex items-center justify-between mb-4">
                    {PLAN_ICONS[plan]}
                    {badge && (
                      <span className={`px-3 py-1 text-xs font-bold rounded-full ${badge.className}`}>
                        {badge.text}
                      </span>
                    )}
                  </div>

                  <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">
                    {PLAN_LABELS[plan]}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    {PLAN_DESCRIPTIONS[plan]}
                  </p>

                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-slate-900 dark:text-white">
                      {price.amount === 0
                        ? 'Gratis'
                        : `$${price.amount.toLocaleString('es-CO')}`}
                    </span>
                    {price.amount > 0 && (
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">/mes</span>
                    )}
                  </div>
                </div>

                {/* Features */}
                <div className="flex-1 p-6 sm:p-8 space-y-3">
                  {features.map((feature) => (
                    <div key={feature.label} className="flex items-start gap-3">
                      {feature.included ? (
                        <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-slate-300 dark:text-slate-600 mt-0.5 flex-shrink-0" />
                      )}
                      <span className={`text-sm ${feature.included ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}`}>
                        {feature.label}
                      </span>
                    </div>
                  ))}
                </div>

                  {/* CTA */}
                  <div className="p-6 sm:p-8 pt-0">
                    {price.amount === 0 ? (
                      <Link
                        to={hasBusiness ? '/business/dashboard' : '/business/register'}
                        className={`inline-flex items-center justify-center gap-2 w-full py-3 font-bold rounded-lg transition-all ${card.button}`}
                      >
                        {hasBusiness ? <><Store className="w-4 h-4" /> Ir a mi negocio</> : 'Empezar gratis'}
                      </Link>
                    ) : plan === currentPlan ? (
                      <div className="w-full text-center py-3 font-bold rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 cursor-default flex items-center justify-center gap-2">
                        <Check className="w-4 h-4" /> Plan actual — disfrutando de {PLAN_LABELS[plan]}
                      </div>
                    ) : !user || !PAYPAL_CLIENT_ID ? (
                      <Link
                        to={user ? '/plans' : '/login'}
                        className={`block w-full text-center py-3 font-bold rounded-lg transition-all ${card.button}`}
                      >
                        {user ? `Cambiar a ${PLAN_LABELS[plan]}` : 'Inicia sesión para mejorar'}
                      </Link>
                    ) : (
                      <div className="space-y-2">
                        <PayPalSubscribeButton plan={plan as 'pro' | 'premium'} userId={user.id} />
                        <p className="text-xs text-center text-slate-400 dark:text-slate-500">
                          {plan === 'pro'
                            ? 'Badge Pro, analytics y WhatsApp'
                            : 'Todo Pro + branding + badge Premium'}
                        </p>
                      </div>
                    )}
                  </div>
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-12">
          Todos los planes incluyen soporte por email. ¿Tienes dudas?{' '}
          <a href="/faq" className="font-bold text-primary-600 dark:text-primary-400 hover:underline">
            Preguntas frecuentes
          </a>.
        </p>
      </div>
    </div>
  );
}

const Plans = () => {
  if (PAYPAL_CLIENT_ID) {
    return (
      <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, vault: false, intent: 'capture' }}>
        <PlansContent />
      </PayPalScriptProvider>
    );
  }
  return <PlansContent />;
};

export default Plans;
