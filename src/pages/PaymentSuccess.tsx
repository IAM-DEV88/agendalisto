import { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import SEO from '../components/SEO';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const plan = searchParams.get('plan') || '';
  const reference = searchParams.get('reference') || '';
  const attemptsRef = useRef(0);
  const MAX_ATTEMPTS = 6;

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setStatus('error');
        return;
      }

      if (reference) {
        const expectedPrefix = `AGD-${user.id}-`;
        if (!reference.startsWith(expectedPrefix)) {
          setStatus('error');
          return;
        }

        const { data: sub } = await supabase
          .from('agendaya_subscriptions')
          .select('plan, status')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();

        const planMatch = sub?.plan === plan || sub?.plan === 'pro' || sub?.plan === 'premium';
        if (sub && planMatch && sub.status === 'active') {
          setStatus('success');
          return;
        }
      }

      const { data: profile } = await supabase
        .from('agendaya_profiles')
        .select('plan')
        .eq('id', user.id)
        .single();

      const profilePlanMatch = profile?.plan === plan || profile?.plan === 'pro' || profile?.plan === 'premium';
      if (profilePlanMatch) {
        setStatus('success');
        return;
      }

      if (attemptsRef.current < MAX_ATTEMPTS) {
        attemptsRef.current++;
        setTimeout(check, 3000);
      } else {
        setStatus('loading');
      }
    };
    check();
  }, [plan, reference]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 flex items-center justify-center px-4">
      <SEO title="Pago procesado" description="Resultado del pago de tu plan AgendaYa." />

      <div className="text-center max-w-md animate-in fade-in zoom-in-95 duration-500">
        {status === 'loading' && (
          <>
            <div className="w-20 h-20 mx-auto mb-6 rounded-lg bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-3">Verificando pago...</h1>
            <p className="text-slate-500">Estamos confirmando tu transacción. Esto puede tomar unos segundos.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-20 h-20 mx-auto mb-6 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-3">¡Pago confirmado!</h1>
            <p className="text-slate-500 mb-2">Tu plan {plan === 'premium' ? 'Premium' : 'Pro'} está activo.</p>
            <p className="text-sm text-slate-400 mb-8">Ya puedes disfrutar de todos los beneficios.</p>
            <Link
              to="/business/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg shadow-lg shadow-primary-500/25 transition-all"
            >
              Ir al panel
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-20 h-20 mx-auto mb-6 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-amber-500" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-3">Referencia inválida</h1>
            <p className="text-slate-500 mb-2">No pudimos verificar tu transacción.</p>
            <p className="text-sm text-slate-400 mb-8">Si crees que es un error, contacta a soporte.</p>
            <Link to="/plans" className="text-primary-600 font-bold hover:underline">Volver a planes</Link>
          </>
        )}
      </div>
    </div>
  );
}
