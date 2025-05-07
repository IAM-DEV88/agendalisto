import { useState, useEffect } from 'react';
import { getUserAppointments } from '../lib/api';
import type { Appointment } from '../lib/api';
import { supabase } from '../lib/supabase';

export function useAppointments(userId: string | null) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Variable para controlar si el componente sigue montado
    let isMounted = true;

    // Función para cargar citas (separate para reuso)
    async function loadAppointments() {
      if (!userId || !isMounted) return;
      setLoading(true);
      try {
        const { success, data, error: apiError } = await getUserAppointments(userId);
        if (!isMounted) return;
        if (success && data) {
          setAppointments(data);
          setError(null);
        } else {
          setError(String(apiError || 'Error al cargar citas'));
        }
      } catch (err) {
        if (!isMounted) return;
        setError('Error al cargar las citas');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    // Inicial fetch y setup realtime subscription
    loadAppointments();
    if (userId) {
      const channel = supabase
        .channel(`user-appointments-${userId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments', filter: `user_id=eq.${userId}` }, async () => {
          console.log('[useAppointments] detected change in appointments');
          await loadAppointments();
        })
        .subscribe();
      return () => {
        isMounted = false;
        supabase.removeChannel(channel);
      };
    }
    return () => { isMounted = false; };
  }, [userId]);

  return { appointments, loading, error };
} 
