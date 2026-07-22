import React, { useState } from 'react';
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { Loader2, CreditCard } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface PaymentMethodSelectorProps {
  amount: number;
  currency: string;
  serviceName: string;
  businessName: string;
  userId: string;
  onPayPalCreateOrder: () => Promise<string>;
  onPayPalApprove: (orderId: string) => Promise<void>;
  disabled?: boolean;
  /** If provided, only show methods included in this list (e.g. ['paypal']). When undefined, shows PayPal if available. */
  enabledMethods?: string[];
}

const PayPalButtonWrapper = React.memo(function PayPalButtonWrapper({
  onCreateOrder,
  onApprove,
  disabled,
  onErrorChange,
}: {
  onCreateOrder: () => Promise<string>;
  onApprove: (orderId: string) => Promise<void>;
  disabled?: boolean;
  onErrorChange?: (msg: string | null) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [{ isPending }] = usePayPalScriptReducer();

  if (isPending || loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-3 text-sm text-slate-500" aria-live="polite">
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
        if (onErrorChange) onErrorChange(null);
        try {
          return await onCreateOrder();
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Error al crear el pago';
          if (onErrorChange) onErrorChange(msg);
          toast.error(msg);
          throw err;
        } finally {
          setLoading(false);
        }
      }}
      onApprove={async (data) => {
        setLoading(true);
        if (onErrorChange) onErrorChange(null);
        try {
          await onApprove(data.orderID);
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Error al procesar el pago';
          if (onErrorChange) onErrorChange(msg);
          toast.error(msg);
          throw err;
        } finally {
          setLoading(false);
        }
      }}
      onError={() => {
        setLoading(false);
        const msg = 'Error al procesar el pago';
        if (onErrorChange) onErrorChange(msg);
        toast.error(msg);
      }}
    />
  );
});

const PaymentMethodSelector = React.memo(function PaymentMethodSelector(props: PaymentMethodSelectorProps) {
  const { amount, currency, onPayPalCreateOrder, onPayPalApprove, disabled, enabledMethods } = props;
  const [paypalError, setPaypalError] = useState<string | null>(null);

  const paypalAvailable = !enabledMethods || enabledMethods.includes('paypal');

  if (!paypalAvailable) {
    if (enabledMethods && enabledMethods.length === 0) {
      return (
        <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-center" role="status">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
            Este negocio no tiene métodos de pago online configurados.
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            Consulta con el negocio para coordinar el pago.
          </p>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="space-y-3" role="radiogroup" aria-label="Seleccionar método de pago">
      <p className="text-sm font-bold text-slate-700 dark:text-slate-300 text-center">
        Pagar <span className="text-primary-600">${amount.toLocaleString()}</span> {currency}
      </p>

      <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <CreditCard className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">PayPal</span>
        </div>
        <PayPalButtonWrapper
          onCreateOrder={onPayPalCreateOrder}
          onApprove={onPayPalApprove}
          disabled={disabled}
          onErrorChange={setPaypalError}
        />
        {paypalError && (
          <div className="mt-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-xs font-bold text-red-600 dark:text-red-400">{paypalError}</p>
          </div>
        )}
      </div>
    </div>
  );
});

export default PaymentMethodSelector;
