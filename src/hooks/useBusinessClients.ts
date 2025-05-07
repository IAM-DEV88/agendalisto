import { useState, useEffect } from 'react';
import { UserProfile } from '../lib/supabase';
import { getBusinessClients } from '../lib/api';
import { useToast } from './useToast';

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
  const toast = useToast();

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
    } catch (err: any) {
      setMessage({ 
        text: err.message || 'Error al cargar los clientes del negocio', 
        type: 'error' 
      });
      toast.error(err.message || 'Error al cargar los clientes del negocio');
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