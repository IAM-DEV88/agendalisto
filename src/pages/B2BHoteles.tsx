import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import SEO from '../components/SEO';
import { Hotel, Users, Gift, ArrowRight, CheckCircle } from 'lucide-react';
import { AGENDAYA_WHATSAPP } from '../lib/config';
import { getBusinessReferralLink, insertLandingLead } from '../lib/api';
import type { RootState } from '../store';

export default function B2BHoteles() {
  const userProfile = useSelector((state: RootState) => state.user.userProfile);
  const businesses = useSelector((state: RootState) => state.user.businesses);
  const [referralLink, setReferralLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (businesses.length > 0) {
      const first = businesses[0];
      setReferralLink(getBusinessReferralLink(first.id, first.referral_code));
    }
  }, [businesses]);

  const handleCopy = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  const handleLead = async () => {
    await insertLandingLead({
      type: 'business',
      city_slug: '',
      name: userProfile?.full_name || 'Hotel (anónimo)',
      message: 'Quiero registrar mi hotel en AgendaYa',
    });
  };

  const isLoggedIn = !!userProfile;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 py-12 px-4">
      <SEO title="Programa de Referidos para Hoteles — AgendaYa" description="Invita a otros negocios a unirse a AgendaYa y obtén beneficios exclusivos. Sin comisiones, sin riesgo." />
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
            <Hotel className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
            Programa de Referidos para Hoteles
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            Conoces los mejores negocios locales. Refiérelos a AgendaYa y ambos ganan visibilidad.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: Users, title: 'Para los negocios de tu zona', desc: 'Restaurantes, spas, tours, gimnasios... todos los que recomiendas a tus huéspedes pueden tener su página web profesional gratis.', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
            { icon: Gift, title: 'Beneficios para ti', desc: 'Por cada negocio que se registre con tu enlace, acumulas referidos. Al llegar a metas, desbloqueas upgrades de plan gratis.', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-500/10' },
            { icon: CheckCircle, title: 'Sin riesgo, sin comisiones', desc: 'No hay sistema de comisiones, ni pagos a terceros. Solo compartes tu enlace de referido y ganas beneficios según los registros.', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-500/10' },
          ].map((item, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 text-center">
              <div className={`w-12 h-12 mx-auto mb-4 rounded-xl ${item.bg} flex items-center justify-center`}>
                <item.icon className={`w-6 h-6 ${item.color}`} />
              </div>
              <h3 className="font-black text-slate-900 dark:text-white mb-2">{item.title}</h3>
              <p className="text-sm text-slate-500">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 mb-8">
          <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6">¿Cómo funciona?</h2>
          <div className="space-y-4">
            {[
              { step: 1, title: 'Registra tu hotel', desc: 'Crea tu perfil de hotel en AgendaYa. Es gratis y tienes tu propia página web profesional.' },
              { step: 2, title: 'Comparte tu enlace de referido', desc: 'Cada negocio tiene un enlace único. Compártelo con otros negocios locales que quieras recomendar.' },
              { step: 3, title: 'Gana beneficios por cada registro', desc: 'Cuando un negocio se registra con tu enlace, acumulas un referido. Al llegar a 10, 25 o 50, desbloqueas meses de plan Pro o Premium gratis.' },
            ].map(item => (
              <div key={item.step} className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0 font-black text-sm text-primary-600 dark:text-primary-400">
                  {item.step}
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{item.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {isLoggedIn && referralLink && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 mb-8">
            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-4 text-center">
              Tu enlace de referido
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6 max-w-lg mx-auto">
              Comparte este enlace con otros negocios para que se registren en AgendaYa. Tú acumulas el referido.
            </p>
            <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="flex-1 text-sm font-mono text-slate-600 dark:text-slate-300 truncate">{referralLink}</span>
              <button
                onClick={handleCopy}
                className={`flex-shrink-0 px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                  copied ? 'bg-emerald-500 text-white' : 'bg-primary-600 hover:bg-primary-700 text-white'
                }`}
              >
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          </div>
        )}

        <div className="text-center">
          {!isLoggedIn ? (
            <Link
              to="/register"
              onClick={handleLead}
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-amber-500/25"
            >
              Registrar mi hotel gratis
            </Link>
          ) : (
            <a
              href={`https://wa.me/${AGENDAYA_WHATSAPP}?text=${encodeURIComponent('Hola, quiero participar en el programa de referidos para hoteles de AgendaYa.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-amber-500/25"
            >
              Solicitar información
            </a>
          )}
          <div className="mt-4">
            <Link to="/" className="text-sm font-bold text-primary-600 hover:text-primary-500 transition-all">
              <ArrowRight className="w-3 h-3 inline" /> Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
