import { useState, useEffect } from 'react';
import { BusinessConfig, getBusinessConfig, updateBusinessConfig } from '../lib/api';
import { DEFAULT_BUSINESS_CONFIG } from '../lib/defaults';
import { notifySuccess, notifyError } from '../lib/toast';

export interface UseBusinessConfigResult {
  config: BusinessConfig;
  loading: boolean;
  saving: boolean;
  message: { text: string; type: 'success' | 'error' } | null;
  updateConfig: (field: keyof BusinessConfig, value: string | boolean | number | Record<string, unknown>) => void;
  saveConfig: (e: React.FormEvent) => Promise<boolean>;
}

export const useBusinessConfig = (businessId: string | undefined): UseBusinessConfigResult => {
  const [config, setConfig] = useState<BusinessConfig>(DEFAULT_BUSINESS_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  useEffect(() => {
    const loadConfig = async () => {
      if (!businessId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { success, config: loadedConfig, error } = await getBusinessConfig(businessId);
        if (success && loadedConfig) {
          setConfig(loadedConfig);
        } else {
          setMessage({ type: 'error', text: error || 'Error loading business configuration' });
        }
      } catch (err: unknown) {
        setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Error loading business configuration' });
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, [businessId]);

  const updateConfig = (field: keyof BusinessConfig, value: string | boolean | number | Record<string, unknown>) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveConfig = async (e: React.FormEvent): Promise<boolean> => {
    e.preventDefault();
    
    if (!businessId) {
      setMessage({ type: 'error', text: 'No business ID available' });
      notifyError('No business ID available');
      return false;
    }

    setSaving(true);
    setMessage(null);

    try {
      const result = await updateBusinessConfig(businessId, config);
      if (result.success) {
        setMessage({ text: 'Configuración guardada correctamente', type: 'success' });
        notifySuccess('Configuración guardada correctamente');
        return true;
      } else {
        setMessage({ text: result.error || 'Error al guardar la configuración', type: 'error' });
        notifyError(result.error || 'Error al guardar la configuración');
        return false;
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al guardar la configuración';
      setMessage({ text: errorMsg, type: 'error' });
      notifyError(errorMsg);
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    config,
    loading,
    saving,
    message,
    updateConfig,
    saveConfig
  };
}; 