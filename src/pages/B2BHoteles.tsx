import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { Hotel, Users, Star, TrendingUp, ArrowRight } from 'lucide-react';

export default function B2BHoteles() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 py-12 px-4">
      <SEO title="Alianzas con Hoteles — AgendaYa" description="Integra AgendaYa en tu hotel y ofrece a tus huéspedes reserva de servicios locales." />
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
            <Hotel className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
            Programa de Alianzas para Hoteles
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            Convierte la experiencia de tus huéspedes en algo memorable. Ofréceles reserva de restaurantes, spas, tours y más.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: Users, title: 'Para tus huéspedes', desc: 'Acceso a servicios locales desde su habitación. Sin llamadas, sin filas.', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
            { icon: Star, title: 'Mejor experiencia', desc: 'Los huéspedes que reservan servicios locales califican mejor su estadía.', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-500/10' },
            { icon: TrendingUp, title: 'Comisión por referral', desc: 'Ganas comisión por cada reserva que un huésped haga desde tu hotel.', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-500/10' },
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
              { step: 1, title: 'Registra tu hotel', desc: 'Crea tu perfil de hotel en AgendaYa. Gratis.' },
              { step: 2, title: 'Comparte tu código', desc: 'Recibes un código único para tus huéspedes.' },
              { step: 3, title: 'Ganas comisión', desc: 'Cada vez que un huésped reserve con tu código, ganas.' },
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

        <div className="text-center">
          <a href="https://wa.me/573001234567?text=Hola%2C%20quiero%20integrar%20AgendaYa%20en%20mi%20hotel"
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-amber-500/25"
          >
            Solicitar información
          </a>
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
