import { useState, useEffect } from 'react';
import { getUserBusiness } from '../lib/api';

export function useBusiness(userId: string | null) {
  const [hasBusiness, setHasBusiness] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Variable local para controlar si el componente está montado
    let isMounted = true;
    
    const loadBusiness = async () => {
      if (!userId) {
        if (isMounted) {
          setHasBusiness(false);
          setLoading(false);
        }
        return;
      }
      
      if (isMounted) {
        setLoading(true);
        setError(null);
      }

      try {
        const { success, business, error: apiError } = await getUserBusiness(userId);
        
        // No actualizar si componente se desmontó
        if (!isMounted) return;
        
        if (success) {
          setHasBusiness(business !== null);
        } else {
          setError(typeof apiError === 'string' ? apiError : 'Error al verificar información del negocio');
        }
      } catch (err: any) {
        // No actualizar si componente se desmontó
        if (!isMounted) return;
        
        setError(err.message || 'Error al verificar información del negocio');
        setHasBusiness(false);
      } finally {
        // No actualizar si componente se desmontó
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadBusiness();
    
    // Marcar como desmontado al limpiar
    return () => {
      isMounted = false;
    };
  }, [userId]);

  return { hasBusiness, loading, error };
} 
