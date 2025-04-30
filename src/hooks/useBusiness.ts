import { useState, useEffect } from 'react';
import { getUserBusiness } from '../lib/api';

export function useBusiness(userId: string | null) {
  const [hasBusiness, setHasBusiness] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBusiness = async () => {
      if (!userId) {
        setHasBusiness(false);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);

      // Crear un timeout para evitar bloqueos
      const timeoutId = setTimeout(() => {
        if (loading) {
          setLoading(false);
          setError('La operación ha tardado demasiado tiempo. Por favor, reintenta más tarde.');
        }
      }, 10000); // 10 segundos

      try {
        const { success, business, error: apiError } = await getUserBusiness(userId);
        if (success) {
          setHasBusiness(business !== null);
        } else {
          setError(typeof apiError === 'string' ? apiError : 'Error al verificar información del negocio');
        }
      } catch (err: any) {
        console.error('Error checking business status:', err);
        setError(err.message || 'Error al verificar información del negocio');
        setHasBusiness(false);
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };

    loadBusiness();
    
    // Limpieza al desmontar
    return () => {
      setLoading(false);
    };
  }, [userId]);

  return { hasBusiness, loading, error };
} 