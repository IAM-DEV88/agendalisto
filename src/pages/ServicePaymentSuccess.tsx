import { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Loader2, AlertTriangle, Gift } from 'lucide-react';
import { checkPendingPayment } from '../lib/api';
import SEO from '../components/SEO';

export default function ServicePaymentSuccess() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [giftCode, setGiftCode] = useState('');
  const reference = searchParams.get('reference') || '';
  const attemptsRef = useRef(0);
  const MAX_ATTEMPTS = 10;

  useEffect(() => {
    if (!reference) {
      setStatus('error');
      return;
    }

    const check = async () => {
      const res = await checkPendingPayment(reference);

      if (res.success && res.status === 'completed') {
        setStatus('success');
        const pendingData = res.data as any;
        if (pendingData?.payload?.giftCode) {
          setGiftCode(pendingData.payload.giftCode);
        }
        return;
      }

      if (attemptsRef.current < MAX_ATTEMPTS) {
        attemptsRef.current++;
        setTimeout(check, 2000);
      } else {
        setStatus('error');
      }
    };

    const timer = setTimeout(check, 1500);
    return () => clearTimeout(timer);
  }, [reference]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 flex items-center justify-center px-4">
      <SEO title="Pago procesado" description="Resultado del pago de tu servicio en AgendaYa." />

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
            {giftCode ? (
              <div className="mb-8">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Gift className="w-5 h-5 text-rose-500" />
                  <p className="text-slate-600 font-medium">Código de regalo:</p>
                </div>
                <p className="text-2xl font-black text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-6 py-3 rounded-lg inline-block border border-primary-200 dark:border-primary-800">
                  {giftCode}
                </p>
                <p className="text-sm text-slate-400 mt-3">Comparte este código con el destinatario para que pueda canjearlo al reservar.</p>
              </div>
            ) : (
              <p className="text-slate-500 mb-8">Tu transacción se ha procesado correctamente.</p>
            )}
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg shadow-lg shadow-primary-500/25 transition-all"
            >
              Volver al inicio
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-20 h-20 mx-auto mb-6 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-amber-500" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-3">Pago pendiente</h1>
            <p className="text-slate-500 mb-2">Tu pago aún está siendo procesado.</p>
            <p className="text-sm text-slate-400 mb-8">Recibirás una confirmación cuando el pago se complete. Si el problema persiste, contacta a soporte.</p>
            <Link to="/" className="text-primary-600 font-bold hover:underline">Volver al inicio</Link>
          </>
        )}
      </div>
    </div>
  );
}
