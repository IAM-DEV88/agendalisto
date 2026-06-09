import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import SEO from '../components/SEO';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const plan = searchParams.get('plan') || '';

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setStatus('error');
        return;
      }

      const { data: profile } = await supabase
        .from('agendaya_profiles')
        .select('plan')
        .eq('id', user.id)
        .single();

      if (profile?.plan === plan || profile?.plan === 'premium' || profile?.plan === 'pro') {
        setStatus('success');
      } else {
        // Esperar un momento para que el webhook procese
        setTimeout(async () => {
          const { data: retry } = await supabase
            .from('agendaya_profiles')
            .select('plan')
            .eq('id', user.id)
            .single();
          setStatus(retry?.plan === plan || retry?.plan === 'pro' || retry?.plan === 'premium' ? 'success' : 'loading');
        }, 3000);
      }
    };
    check();
  }, [plan]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 flex items-center justify-center px-4">
      <SEO title="Pago procesado" description="Resultado del pago de tu plan AgendaYa." />

      <div className="text-center max-w-md animate-in fade-in zoom-in-95 duration-500">
        {status === 'loading' && (
          <>
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-3">Verificando pago...</h1>
            <p className="text-slate-500">Estamos confirmando tu transacción. Esto puede tomar unos segundos.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-3">¡Pago confirmado!</h1>
            <p className="text-slate-500 mb-2">Tu plan {plan === 'premium' ? 'Premium' : 'Pro'} está activo.</p>
            <p className="text-sm text-slate-400 mb-8">Ya puedes disfrutar de todos los beneficios.</p>
            <Link
              to="/business/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-500/25 transition-all"
            >
              Ir al panel
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
              <span className="text-4xl">⏳</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-3">Pago en proceso</h1>
            <p className="text-slate-500 mb-2">Tu pago está siendo procesado por Wompi.</p>
            <p className="text-sm text-slate-400 mb-8">Te notificaremos cuando se confirme. Si pasan más de 10 minutos, contacta a soporte.</p>
            <Link to="/plans" className="text-primary-600 font-bold hover:underline">Volver a planes</Link>
          </>
        )}
      </div>
    </div>
  );
}
