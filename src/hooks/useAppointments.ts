import { useState, useEffect } from 'react';
import { getUserAppointments } from '../lib/api';
import type { Appointment } from '../lib/api';

export function useAppointments(userId: string | null) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pastAppointments, setPastAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAppointments() {
      if (!userId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      const { success, data, error: apiError } = await getUserAppointments(userId);
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
      } else {
        const msg = apiError instanceof Error ? apiError.message : String(apiError);
        setError(msg);
      }
      setLoading(false);
    }

    loadAppointments();
  }, [userId]);

  return { appointments, pastAppointments, loading, error };
} 