import { useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { Gift, Users, DollarSign, TrendingUp, CheckCircle, ArrowRight, User, Mail, Phone, MapPin } from 'lucide-react';

export default function Embajadores() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', city: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone) return;
    const msg = `📢 Nueva solicitud de embajador:
Nombre: ${form.name}
Email: ${form.email}
Teléfono: ${form.phone}
Ciudad: ${form.city}`;
    window.open(`https://wa.me/573001234567?text=${encodeURIComponent(msg)}`, '_blank');
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 py-12 px-4">
      <SEO title="Embajadores AgendaYa" description="Sé embajador de AgendaYa en tu ciudad y gana comisiones por cada negocio que registres." />
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="w-14 h-14 mx-auto mb-4 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
            <Users className="w-7 h-7 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-3">Embajadores AgendaYa</h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto">Ayuda a los negocios de tu ciudad a digitalizarse y gana comisiones por cada uno que registres.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: DollarSign, title: 'Gana comisiones', desc: 'Recibe $X por cada negocio que se registre con tu código', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
            { icon: TrendingUp, title: 'Sin límites', desc: 'Registra todos los negocios que quieras, comisiones sin tope', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-500/10' },
            { icon: Gift, title: 'Bonos exclusivos', desc: 'Los mejores embajadores reciben bonos mensuales y reconocimiento', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-500/10' },
          ].map((item, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6 text-center">
              <div className={`w-12 h-12 mx-auto mb-4 rounded-lg ${item.bg} flex items-center justify-center`}>
                <item.icon className={`w-6 h-6 ${item.color}`} />
              </div>
              <h3 className="font-black text-slate-900 dark:text-white mb-2">{item.title}</h3>
              <p className="text-sm text-slate-500">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xl p-8">
          {sent ? (
            <div className="text-center py-8">
              <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">¡Solicitud enviada!</h2>
              <p className="text-slate-500">Te contactaremos por WhatsApp en las próximas 24 horas.</p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6">Solicita ser embajador</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre completo</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Tu nombre" className="w-full pl-10" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="tu@email.com" className="w-full pl-10" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Teléfono</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+57 300..." className="w-full pl-10" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Ciudad</label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input type="text" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Tu ciudad" className="w-full pl-10" />
                    </div>
                  </div>
                </div>
                <button type="submit" className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg transition-all shadow-lg shadow-amber-500/25">
                  Enviar solicitud por WhatsApp
                </button>
              </form>
            </>
          )}
        </div>

        <div className="mt-8 text-center">
          <Link to="/" className="text-sm font-bold text-primary-600 hover:text-primary-500 transition-all">
            <ArrowRight className="w-4 h-4 inline" /> Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
