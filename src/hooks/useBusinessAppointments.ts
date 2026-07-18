import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getBusinessAppointments } from '../lib/api';
import type { Appointment } from '../lib/api';

export function useBusinessAppointments(businessId: string | null) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const { success, data, error: apiError } = await getBusinessAppointments(businessId);
      if (success && data) {
        setAppointments(data);
        setError(null);
      } else {
        setError(String(apiError || 'Error loading business appointments'));
      }
    } catch (err: any) {
      setError(err.message || 'Error loading business appointments');
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!businessId) return;

    // Single channel for both appointments and reviews changes
    const channel = supabase
      .channel(`business-data-${businessId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'agendaya_appointments', filter: `business_id=eq.${businessId}` }, () => {
        load();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'agendaya_appointments', filter: `business_id=eq.${businessId}` }, () => {
        load();
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'agendaya_appointments', filter: `business_id=eq.${businessId}` }, () => {
        load();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId, load]);

  const refreshAppointments = useCallback(async () => {
    await load();
  }, [load]);

  return { appointments, loading, error, refreshAppointments };
} 