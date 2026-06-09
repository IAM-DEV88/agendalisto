import { useState } from 'react';
import { Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface WompiCheckoutButtonProps {
  plan: 'pro' | 'premium';
  userId: string;
  userEmail: string;
  userName: string;
  userPhone?: string;
  disabled?: boolean;
}

export default function WompiCheckoutButton({
  plan,
  userId,
  userEmail,
  userName,
  userPhone,
  disabled,
}: WompiCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch('/.netlify/functions/create-wompi-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, userId, userEmail, userName, userPhone }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al iniciar pago');
      }

      // Redirigir al checkout de Wompi
      window.location.href = data.checkoutUrl;
    } catch (err: any) {
      toast.error(err.message || 'Error al procesar el pago');
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || loading}
      className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-500/25 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Conectando con Wompi...
        </>
      ) : (
        <>
          <ExternalLink className="w-4 h-4" />
          Pagar con Wompi — ${plan === 'premium' ? '99.900' : '49.900'}
        </>
      )}
    </button>
  );
}
