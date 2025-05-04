import { useState, useEffect } from 'react';
import { getUserAppointments } from '../lib/api';
import type { Appointment } from '../lib/api';
import { supabase } from '../lib/supabase';

export function useAppointments(userId: string | null) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pastAppointments, setPastAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[useAppointments] mount, userId=', userId);
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
          const now = new Date();
          const upcoming: Appointment[] = [];
          const past: Appointment[] = [];
          data.forEach((appointment) => {
            const dt = new Date(appointment.start_time);
            if (dt > now) upcoming.push(appointment);
            else past.push(appointment);
          });
          console.log('[useAppointments] loadAppointments:', upcoming.length, 'upcoming,', past.length, 'past');
          setAppointments(upcoming);
          setPastAppointments(past);
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
        .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments', filter: `user_id=eq.${userId}` }, async (payload) => {
          console.log('[useAppointments] realtime payload', payload);
          await loadAppointments();
        })
        .subscribe();
      return () => {
        isMounted = false;
        console.log('[useAppointments] cleanup channel', channel);
        supabase.removeChannel(channel);
      };
    }
    return () => { isMounted = false; };
  }, [userId]);

  return { appointments, pastAppointments, loading, error };
} 
