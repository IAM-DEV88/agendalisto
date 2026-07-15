import { useState, useEffect } from 'react';
import { Gift, Heart, Rocket, Target, CreditCard, ExternalLink, Loader2 } from 'lucide-react';
import type { Milestone } from '../lib/api';
import { getTopMilestones } from '../lib/api';

const Crowdfunding = () => {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  
  // PayPal business email from env (add to .env.local)
  const paypalBusinessEmail = 'jaguerx88@gmail.com';
  // IPN listener URL (use your Netlify site domain)
  const ipnUrl = 'https://agendaya.netlify.com/.netlify/functions/ipn-listener';

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { success, data } = await getTopMilestones(10);
        if (success && data) setMilestones(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center justify-center p-3 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg mb-6">
            <Rocket className="w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-6">
            Crowdfunding: Nuestra Ruta de Crecimiento
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
            AgendaYa es un proyecto impulsado por la comunidad. Tu apoyo nos permite implementar nuevas funcionalidades, 
            mejorar nuestra infraestructura y escalar el servicio para miles de profesionales.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
            <p className="text-slate-500 font-medium">Cargando hitos...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {milestones.map((m) => {
              const progress = Math.min(100, Math.round((m.current_amount / m.goal_amount) * 100));
              
              return (
                <div key={m.id} className="card group flex flex-col h-full hover:border-primary-500/30 transition-all duration-300">
                  <div className="p-6 flex-grow">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-lg">
                        <Gift className="w-6 h-6" />
                      </div>
                      <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                        {m.title}
                      </h2>
                    </div>
                    
                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 line-clamp-3">
                      {m.description}
                    </p>

                    <div className="space-y-4 mb-6">
                      <div className="flex justify-between items-end">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recaudado</span>
                          <span className="text-lg font-black text-slate-900 dark:text-white">
                            ${m.current_amount.toLocaleString()} <span className="text-xs font-normal text-slate-500 uppercase">COP</span>
                          </span>
                        </div>
                        <span className="text-sm font-black text-primary-600 dark:text-primary-400">
                          {progress}%
                        </span>
                      </div>
                      
                      <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary-600 dark:bg-primary-500 transition-all duration-1000 ease-out rounded-full shadow-[0_0_12px_rgba(79,70,229,0.4)]"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                        <Target className="w-3 h-3" />
                        <span>META: ${m.goal_amount.toLocaleString()} COP</span>
                      </div>
                    </div>

                    <div className="p-4 bg-primary-50/50 dark:bg-primary-900/10 rounded-lg border border-primary-100 dark:border-primary-900/30 mb-6">
                      <p className="text-sm font-bold text-primary-700 dark:text-primary-300 flex items-center gap-2">
                        <Heart className="w-4 h-4 fill-primary-500" />
                        {m.cta}
                      </p>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3">
                    <form
                      action="https://www.paypal.com/cgi-bin/webscr"
                      method="post"
                      target="_blank"
                      className="w-full"
                    >
                      <input type="hidden" name="cmd" value="_donations" />
                      <input type="hidden" name="business" value={paypalBusinessEmail} />
                      <input type="hidden" name="item_name" value={m.title} />
                      <input type="hidden" name="custom" value={m.id} />
                      <input type="hidden" name="notify_url" value={ipnUrl} />
                      <button
                        type="submit"
                        className="w-full inline-flex items-center justify-center px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-lg gap-2"
                      >
                        <CreditCard className="w-5 h-5" />
                        PayPal
                      </button>
                    </form>
                    
                    <a
                      href="https://checkout.wompi.co/l/VPOS_kRgRp8"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg transition-all shadow-lg shadow-emerald-500/25 gap-2"
                    >
                      <ExternalLink className="w-5 h-5" />
                      Wompi (Local)
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-20 text-center bg-white dark:bg-slate-900 p-8 md:p-12 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xl">
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
            ¿Tienes alguna pregunta?
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-xl mx-auto">
            Si deseas realizar una donación corporativa o tienes dudas sobre cómo se utilizan los fondos, no dudes en contactarnos.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Crowdfunding; 