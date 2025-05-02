import { useState, useEffect } from 'react';
import { getUserAppointments } from '../lib/api';
import type { Appointment } from '../lib/api';

export function useAppointments(userId: string | null) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pastAppointments, setPastAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Variable para controlar si el componente está montado
    let isMounted = true;
    
    // Función para cargar citas
    async function loadAppointments() {
      if (!userId) {
        return;
      }
      
      // Solo actualizar estado si el componente sigue montado
      if (isMounted) setLoading(true);
      
      try {
        const { success, data, error: apiError } = await getUserAppointments(userId);
        
        // No realizar cambios si el componente se desmontó
        if (!isMounted) return;
        
        if (success && data) {
          const now = new Date();
          const upcoming: Appointment[] = [];
          const past: Appointment[] = [];
          
          data.forEach((appointment) => {
            const date = new Date(appointment.start_time);
            if (date > now) upcoming.push(appointment);
            else past.push(appointment);
          });
          
          setAppointments(upcoming);
          setPastAppointments(past);
          setError(null);
        } else {
          const msg = apiError instanceof Error ? apiError.message : String(apiError);
          setError(msg);
        }
      } catch (err) {
        // No realizar cambios si el componente se desmontó
        if (!isMounted) return;
        setError('Error al cargar las citas');
      } finally {
        // No realizar cambios si el componente se desmontó
        if (isMounted) setLoading(false);
      }
    }

    loadAppointments();
    
    // Limpiar y marcar como desmontado
    return () => {
      isMounted = false;
    };
  }, [userId]);

  return { appointments, pastAppointments, loading, error };
} 
