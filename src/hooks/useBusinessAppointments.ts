import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getBusinessAppointments } from '../lib/api';
import type { Appointment } from '../lib/api';

export function useBusinessAppointments(businessId: string | null) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[useBusinessAppointments] mount, businessId=', businessId);
    let isMounted = true;

    async function load() {
      if (!businessId || !isMounted) return;
      setLoading(true);
      try {
        const { success, data, error: apiError } = await getBusinessAppointments(businessId);
        if (!isMounted) return;
        if (success && data) {
          console.log('[useBusinessAppointments] loaded', data.length, 'appointments');
          setAppointments(data);
          setError(null);
        } else {
          setError(String(apiError || 'Error loading business appointments'));
        }
      } catch (err: any) {
        if (!isMounted) return;
        setError(err.message || 'Error loading business appointments');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();
    if (businessId) {
      const channel = supabase
        .channel(`business-appointments-${businessId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments', filter: `business_id=eq.${businessId}` }, async payload => {
          console.log('[useBusinessAppointments] realtime payload', payload);
          await load();
        })
        .subscribe();

      return () => {
        isMounted = false;
        console.log('[useBusinessAppointments] cleanup channel', channel);
        supabase.removeChannel(channel);
      };
    }

    return () => {
      isMounted = false;
    };
  }, [businessId]);

  return { appointments, loading, error };
} 