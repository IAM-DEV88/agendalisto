import { useState, useCallback } from 'react';
import {
  CreditCard,
  Building2,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Save,
  CheckCircle2,
  AlertCircle,
  Wallet,
  Copy,
} from 'lucide-react';
import type { PaymentMethodConfig } from '../../lib/api';

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID;

interface PaymentConfigSectionProps {
  paymentMethods: Record<string, PaymentMethodConfig>;
  onChange: (methods: Record<string, PaymentMethodConfig>) => void;
  onSave: () => void;
  saving?: boolean;
  loading?: boolean;
  message?: { text: string; type: 'success' | 'error' } | null;
  isAdmin?: boolean;
}

const CROWDFUNDING_PAYPAL_EMAIL = 'jaguerx88@gmail.com';

const PAYMENT_METHOD_META: Record<string, { label: string; icon: React.ReactNode; description: string; brandColor: string }> = {
  paypal: {
    label: 'PayPal',
    icon: <CreditCard className="w-5 h-5" />,
    description: 'Acepta pagos internacionales con tarjeta de crédito y cuenta PayPal.',
    brandColor: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
  },
};

const DEFAULT_METHODS = ['paypal'];

const PaymentConfigSection: React.FC<PaymentConfigSectionProps> = ({
  paymentMethods,
  onChange,
  onSave,
  saving,
  loading,
  message,
  isAdmin,
}) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [customName, setCustomName] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const safeMethods = paymentMethods && typeof paymentMethods === 'object' ? paymentMethods : {};

  const clearError = (key: string) => {
    if (validationErrors[key]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const toggleMethod = (key: string) => {
    clearError(key);
    const current = safeMethods[key];
    if (current) {
      onChange({
        ...safeMethods,
        [key]: { ...current, enabled: !current.enabled },
      });
    } else {
      onChange({
        ...safeMethods,
        [key]: { enabled: true },
      });
    }
  };

  const updateMethodConfig = (key: string, field: string, value: string | boolean) => {
    clearError(key);
    const sanitized = typeof value === 'string' ? value.slice(0, 500) : value;
    const current = safeMethods[key] || { enabled: true };
    onChange({
      ...safeMethods,
      [key]: { ...current, [field]: sanitized },
    });
  };

  const removeCustomMethod = (key: string) => {
    clearError(key);
    const next = { ...safeMethods };
    delete next[key];
    onChange(next);
  };

  const addCustomMethod = () => {
    const trimmed = customName.trim().slice(0, 50);
    if (!trimmed) return;
    const sanitized = trimmed.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    if (!sanitized) {
      setValidationErrors((prev) => ({ ...prev, custom: 'Nombre inválido' }));
      return;
    }
    if (DEFAULT_METHODS.includes(sanitized) || DEFAULT_METHODS.includes(`custom_${sanitized}`)) {
      setValidationErrors((prev) => ({ ...prev, custom: 'Este nombre está reservado' }));
      return;
    }
    const key = `custom_${sanitized}`;
    if (safeMethods[key]) {
      setValidationErrors((prev) => ({ ...prev, custom: 'Este método ya existe' }));
      return;
    }
    onChange({
      ...safeMethods,
      [key]: { enabled: true, instructions: '' },
    });
    setCustomName('');
    clearError('custom');
  };

  const handleCustomNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomMethod();
    }
  };

  const toggleExpanded = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const applyAdminPreset = useCallback((key: string) => {
    const current = safeMethods[key] || { enabled: true };
    if (key === 'paypal') {
      onChange({
        ...safeMethods,
        paypal: {
          ...current,
          enabled: true,
          email: CROWDFUNDING_PAYPAL_EMAIL,
          client_id: PAYPAL_CLIENT_ID || '',
          sandbox: false,
        },
      });
    }
    setExpanded((prev) => ({ ...prev, [key]: true }));
  }, [safeMethods, onChange]);

  const isUsingAdminDefault = useCallback((key: string): boolean => {
    if (key === 'paypal') {
      return safeMethods.paypal?.email === CROWDFUNDING_PAYPAL_EMAIL;
    }
    return false;
  }, [safeMethods]);

  const allMethods = [...DEFAULT_METHODS, ...Object.keys(safeMethods).filter((k) => !DEFAULT_METHODS.includes(k))];

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-48" />
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-72" />
        <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded-lg" />
        <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded-lg" />
        <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="p-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-lg">
          <Wallet className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
            Métodos de Pago
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Activa los métodos de pago que acepta tu negocio
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {allMethods.map((key) => {
          const method = safeMethods[key] || { enabled: false };
          const meta = PAYMENT_METHOD_META[key];
          const isCustom = !DEFAULT_METHODS.includes(key);
          const isExpanded = expanded[key];

          return (
            <div
              key={key}
              className={`bg-white dark:bg-slate-900 rounded-lg border transition-all ${
                method.enabled
                  ? 'border-slate-200 dark:border-slate-700 shadow-sm'
                  : 'border-slate-100 dark:border-slate-800 opacity-60'
              }`}
            >
              <div className="p-4">
                  <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      meta
                        ? meta.brandColor
                        : 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                    }`}
                  >
                    {meta ? meta.icon : <Building2 className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {meta ? meta.label : key.replace(/^custom_/, '')}
                      </span>
                      {isAdmin && key === 'paypal' && isUsingAdminDefault(key) && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 uppercase tracking-wider">
                          Default
                        </span>
                      )}
                      {isCustom && (
                        <button
                          onClick={() => removeCustomMethod(key)}
                          className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Eliminar método"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    {meta && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {meta.description}
                      </p>
                    )}
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={method.enabled}
                      onChange={() => toggleMethod(key)}
                      className="sr-only peer"
                      aria-label={`${method.enabled ? 'Desactivar' : 'Activar'} ${meta ? meta.label : key.replace(/^custom_/, '')}`}
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600" />
                  </label>
                </div>

                {method.enabled && (
                  <button
                    onClick={() => toggleExpanded(key)}
                    className="mt-3 flex items-center gap-1 text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                  >
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    {isExpanded ? 'Ocultar configuración' : 'Configurar'}
                  </button>
                )}

                {method.enabled && isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                    {key === 'paypal' && (
                      <>
                        {isAdmin && (
                          <div className="space-y-2">
                            <button
                              onClick={() => applyAdminPreset('paypal')}
                              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold text-xs rounded-lg border border-blue-200 dark:border-blue-800 transition-colors"
                            >
                              <Copy className="w-4 h-4" />
                              Usar configuración de crowdfunding ({CROWDFUNDING_PAYPAL_EMAIL})
                            </button>
                          </div>
                        )}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Email de negocio PayPal
                          </label>
                          <input
                            type="email"
                            value={method.email || ''}
                            onChange={(e) => updateMethodConfig(key, 'email', e.target.value)}
                            placeholder="ej: negocio@email.com"
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Client ID
                          </label>
                          <input
                            type="text"
                            value={method.client_id || ''}
                            onChange={(e) => updateMethodConfig(key, 'client_id', e.target.value)}
                            placeholder="Client ID de PayPal"
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-xs"
                          />
                        </div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                          <input
                            type="checkbox"
                            checked={method.sandbox ?? false}
                            onChange={(e) => updateMethodConfig(key, 'sandbox', e.target.checked)}
                            className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                          />
                          Modo sandbox (pruebas)
                        </label>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
                          El crowdfunding usa el email <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">{CROWDFUNDING_PAYPAL_EMAIL}</code> con IPN en agendaya.netlify.com.
                        </p>
                      </>
                    )}

                    {isCustom && (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Instrucciones para el cliente
                        </label>
                        <textarea
                          value={method.instructions || ''}
                          onChange={(e) => updateMethodConfig(key, 'instructions', e.target.value)}
                          placeholder="Ej: Transferencia Bancolombia cuenta ahorros 123456789"
                          rows={3}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg shrink-0">
            <Plus className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 dark:text-white">Agregar método personalizado</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ej: Transferencia bancaria, Daviplata, cripto, etc.
            </p>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <div className="flex-1">
            <input
              type="text"
              value={customName}
              onChange={(e) => { setCustomName(e.target.value); clearError('custom'); }}
              onKeyDown={handleCustomNameKeyDown}
              placeholder="Nombre del método"
              aria-label="Nombre del nuevo método de pago"
              aria-describedby="custom-method-desc"
              className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                validationErrors.custom ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-700'
              }`}
            />
            {validationErrors.custom && (
              <p className="mt-1 text-xs font-bold text-red-500" role="alert">{validationErrors.custom}</p>
            )}
            <p id="custom-method-desc" className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Escribe el nombre del método de pago adicional que deseas ofrecer (ej: Transferencia bancaria).
            </p>
          </div>
          <button
            onClick={addCustomMethod}
            disabled={!customName.trim()}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-bold text-sm rounded-lg transition-colors shrink-0"
          >
            Agregar
          </button>
        </div>
      </div>

      {message && (
        <div role="alert" aria-live="polite" className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
          message.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <p className="text-sm font-bold">{message.text}</p>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg transition-all shadow-lg shadow-primary-500/25 gap-2 disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  );
};

export default PaymentConfigSection;
