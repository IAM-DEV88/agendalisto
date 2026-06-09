import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { Building2, Users, CheckCircle, ArrowRight } from 'lucide-react';

export default function CajasCompensacion() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 py-12 px-4">
      <SEO title="Cajas de Compensación — AgendaYa" description="Integración con cajas de compensación para ofrecer reserva de servicios a sus afiliados." />
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center">
            <Building2 className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
            AgendaYa para Cajas de Compensación
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            Ofrece a tus afiliados una plataforma moderna para reservar servicios de salud, belleza, bienestar y más.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {[
            { title: 'Para afiliados', desc: 'Acceso a cientos de servicios profesionales cerca de su hogar con descuentos exclusivos.', icon: Users },
            { title: 'Para la caja', desc: 'Sin inversión en tecnología. Aumenta el uso de tus subsidios con una plataforma lista.', icon: Building2 },
            { title: 'Para negocios', desc: 'Los afiliados de la caja descubren y reservan en tus servicios. Nuevos clientes garantizados.', icon: CheckCircle },
            { title: 'Para la región', desc: 'Fortalecemos el comercio local y formalizamos la economía de servicios.', icon: ArrowRight },
          ].map((item, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
              <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center mb-3">
                <item.icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="font-black text-slate-900 dark:text-white mb-2">{item.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-3xl p-8 sm:p-10 text-center shadow-xl">
          <h2 className="text-2xl font-black text-white mb-3">¿Eres una caja de compensación?</h2>
          <p className="text-white/70 text-sm max-w-md mx-auto mb-6">
            Contáctanos para activar la integración en minutos. Sin costo para tu caja.
          </p>
          <a href="https://wa.me/573001234567?text=Hola%2C%20quiero%20integrar%20AgendaYa%20en%20mi%20caja%20de%20compensaci%C3%B3n"
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary-700 font-bold rounded-xl hover:bg-primary-50 transition-all shadow-lg"
          >
            Contactar por WhatsApp
          </a>
        </div>

        <div className="mt-8 text-center">
          <Link to="/" className="text-sm font-bold text-primary-600 hover:text-primary-500 transition-all">
            <ArrowRight className="w-3 h-3 inline" /> Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
