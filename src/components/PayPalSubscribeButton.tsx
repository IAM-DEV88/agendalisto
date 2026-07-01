import { useState } from 'react';
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { setUserProfile } from '../store/userSlice';
import type { RootState } from '../store';
import { notifySuccess, notifyError } from '../lib/toast';
import { Loader2 } from 'lucide-react';

interface PayPalSubscribeButtonProps {
  plan: 'pro' | 'premium';
  userId: string;
  disabled?: boolean;
}

const PLAN_LABEL: Record<string, string> = {
  pro: 'Pro',
  premium: 'Premium',
};

export default function PayPalSubscribeButton({ plan, userId, disabled }: PayPalSubscribeButtonProps) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const userProfile = useSelector((state: RootState) => state.user.userProfile);
  const [{ isPending }] = usePayPalScriptReducer();

  return (
    <div className="w-full">
      {(loading || isPending) && (
        <div className="flex items-center justify-center gap-2 py-3 text-sm text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Procesando...
        </div>
      )}
      <PayPalButtons
        style={{ layout: 'vertical', shape: 'rect', color: 'gold', label: 'paypal', height: 45 }}
        disabled={disabled || loading}
        createOrder={async () => {
          setLoading(true);
          try {
            const res = await fetch('/.netlify/functions/create-paypal-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ plan }),
            });
            const text = await res.text();
            let data;
            try { data = JSON.parse(text); } catch { data = null; }
            if (!res.ok) throw new Error(data?.error || `Error del servidor (${res.status}): ${text || 'sin respuesta'}`);
            return data.id;
          } catch (err: unknown) {
            notifyError(err instanceof Error ? err.message : 'Error');
            throw err;
          } finally {
            setLoading(false);
          }
        }}
        onApprove={async (data) => {
          setLoading(true);
          try {
            const res = await fetch('/.netlify/functions/capture-paypal-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId: data.orderID, userId, plan }),
            });
            const result = await res.json();
            if (!res.ok || !result.success) throw new Error(result.error || 'Error al capturar pago');
            if (userProfile) {
              dispatch(setUserProfile({ ...userProfile, plan }));
            }
            notifySuccess(`¡Plan ${PLAN_LABEL[plan]} activado!`);
            navigate('/business/dashboard');
          } catch (err: unknown) {
            notifyError(err instanceof Error ? err.message : 'Error');
          } finally {
            setLoading(false);
          }
        }}
        onError={(_err) => {
          notifyError('Error al procesar el pago');
        }}
      />
    </div>
  );
}
