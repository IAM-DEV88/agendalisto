import { useState, useEffect } from 'react';
import { PayPalScriptProvider, PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { detectCountry, DetectedCountry } from '../utils/countryDetection';
import { Loader2, ExternalLink, CreditCard } from 'lucide-react';

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID;

interface PaymentMethodSelectorProps {
  amount: number;
  currency: string;
  serviceName: string;
  businessName: string;
  userId: string;
  onPayPalCreateOrder: () => Promise<string>;
  onPayPalApprove: (orderId: string) => Promise<void>;
  onWompiPay: () => Promise<void>;
  disabled?: boolean;
}

function PayPalButtonWrapper({
  onCreateOrder,
  onApprove,
  disabled,
}: {
  onCreateOrder: () => Promise<string>;
  onApprove: (orderId: string) => Promise<void>;
  disabled?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [{ isPending }] = usePayPalScriptReducer();

  if (isPending || loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-3 text-sm text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        Procesando...
      </div>
    );
  }

  return (
    <PayPalButtons
      style={{ layout: 'vertical', shape: 'rect', color: 'gold', label: 'paypal', height: 40 }}
      disabled={disabled}
      createOrder={async () => {
        setLoading(true);
        try {
          return await onCreateOrder();
        } finally {
          setLoading(false);
        }
      }}
      onApprove={async (data) => {
        setLoading(true);
        try {
          await onApprove(data.orderID);
        } finally {
          setLoading(false);
        }
      }}
      onError={() => setLoading(false)}
    />
  );
}

export default function PaymentMethodSelector(props: PaymentMethodSelectorProps) {
  const { amount, currency, onPayPalCreateOrder, onPayPalApprove, onWompiPay, disabled } = props;
  const [country, setCountry] = useState<DetectedCountry>('other');
  const [wompiLoading, setWompiLoading] = useState(false);

  useEffect(() => {
    setCountry(detectCountry());
  }, []);

  const paypalAvailable = (country === 'other' || country === 'us') && !!PAYPAL_CLIENT_ID;

  if (!paypalAvailable && country !== 'co') return null;

  return (
    <div className="space-y-3">
      <p className="text-sm font-bold text-slate-700 dark:text-slate-300 text-center">
        Pagar <span className="text-primary-600">${amount.toLocaleString()}</span> {currency}
      </p>

      {paypalAvailable && (
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">PayPal</span>
          </div>
          <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, vault: false, intent: 'capture' }}>
            <PayPalButtonWrapper
              onCreateOrder={onPayPalCreateOrder}
              onApprove={onPayPalApprove}
              disabled={disabled || wompiLoading}
            />
          </PayPalScriptProvider>
        </div>
      )}

      {country === 'co' && (
        <button
          type="button"
          onClick={async () => {
            setWompiLoading(true);
            try {
              await onWompiPay();
            } finally {
              setWompiLoading(false);
            }
          }}
          disabled={disabled || wompiLoading}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/25"
        >
          {wompiLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Conectando con Wompi...
            </>
          ) : (
            <>
              <ExternalLink className="w-4 h-4" />
              Pagar con Wompi — ${amount.toLocaleString()} {currency}
            </>
          )}
        </button>
      )}
    </div>
  );
}
