import { useState, useEffect } from 'react';
import { BusinessConfig, getBusinessConfig, updateBusinessConfig } from '../lib/api';
import { useToast } from './useToast';

export interface UseBusinessConfigResult {
  config: BusinessConfig;
  loading: boolean;
  saving: boolean;
  message: { text: string; type: 'success' | 'error' } | null;
  updateConfig: (field: keyof BusinessConfig, value: any) => void;
  saveConfig: (e: React.FormEvent) => Promise<boolean>;
}

export const defaultConfig: BusinessConfig = {
  permitir_reservas_online: true,
  mostrar_precios: true,
  mostrar_telefono: true,
  mostrar_email: false,
  mostrar_redes_sociales: true,
  mostrar_direccion: true,
  requiere_confirmacion: false,
  tiempo_minimo_cancelacion: 48,
  notificaciones_email: true,
  notificaciones_whatsapp: false
};

export const useBusinessConfig = (businessId: string | undefined): UseBusinessConfigResult => {
  const [config, setConfig] = useState<BusinessConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const toast = useToast();

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
      } catch (err: any) {
        setMessage({ type: 'error', text: err.message || 'Error loading business configuration' });
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, [businessId]);

  const updateConfig = (field: keyof BusinessConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveConfig = async (e: React.FormEvent): Promise<boolean> => {
    e.preventDefault();
    
    if (!businessId) {
      setMessage({ type: 'error', text: 'No business ID available' });
      toast.error('No business ID available');
      return false;
    }

    setSaving(true);
    setMessage(null);

    try {
      const result = await updateBusinessConfig(businessId, config);
      if (result.success) {
        setMessage({ text: 'Configuración guardada correctamente', type: 'success' });
        toast.success('Configuración guardada correctamente');
        return true;
      } else {
        setMessage({ text: result.error || 'Error al guardar la configuración', type: 'error' });
        toast.error(result.error || 'Error al guardar la configuración');
        return false;
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Error al guardar la configuración', type: 'error' });
      toast.error(err.message || 'Error al guardar la configuración');
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