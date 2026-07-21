import { useState, useEffect } from 'react';
import { UserProfile } from '../lib/supabase';
import { getBusinessClients } from '../lib/api';
import { notifyError } from '../lib/toast';

export interface UseBusinessClientsResult {
  clients: UserProfile[];
  loading: boolean;
  message: { text: string; type: 'success' | 'error' } | null;
  refreshClients: () => Promise<void>;
}

export const useBusinessClients = (businessId: string | undefined): UseBusinessClientsResult => {
  const [clients, setClients] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const loadClients = async () => {
    if (!businessId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { success, data, error } = await getBusinessClients(businessId);
      if (success && data) {
        setClients(data);
      } else {
        setMessage({ 
          text: error || 'No se pudieron cargar los clientes del negocio', 
          type: 'error' 
        });
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al cargar los clientes del negocio';
      setMessage({ 
        text: errorMsg, 
        type: 'error' 
      });
      notifyError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, [businessId]); // React Hook dependencies are fixed

  const refreshClients = async (): Promise<void> => {
    await loadClients();
  };

  return {
    clients,
    loading,
    message,
    refreshClients
  };
}; 