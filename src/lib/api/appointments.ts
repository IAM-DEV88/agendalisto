import { supabase } from '../supabase';
import { getErrorMessage } from '../api-helpers';
import type { Appointment, AppointmentStatus } from '../api';

// ─── Appointments ───

export async function getUserAppointments(userId: string) {
  try {
    const { data, error } = await supabase
      .from('agendaya_appointments')
      .select(`
        *,
        businesses:agendaya_businesses (
          name,
          address,
          slug,
          logo_url
        ),
        services:agendaya_services (
          name,
          duration,
          price,
          min_cancellation_hours,
          min_reschedule_hours,
          cancellation_policy_text,
          reschedule_policy_text
        ),
        staff_member:agendaya_staff (
          full_name
        ),
        review:agendaya_reviews!appointment_id (
          id,
          rating,
          comment,
          created_at,
          user_id,
          business_id,
          status
        )
      `)
      .eq('user_id', userId)
      .order('start_time', { ascending: true });
    if (error) throw error;

    let enriched = (data || []) as Appointment[];
    try {
      const profileIds = [...new Set(enriched.map(a => a.user_id).filter(Boolean))];
      const staffIds = [...new Set(enriched.map(a => a.staff_id).filter(Boolean))];
      const [profilesRes, staffRes] = await Promise.all([
        profileIds.length > 0
          ? supabase.from('agendaya_profiles').select('id, full_name, phone').in('id', profileIds)
          : { data: [] },
        staffIds.length > 0
          ? supabase.from('agendaya_staff').select('id, full_name').in('id', staffIds)
          : { data: [] },
      ]);
      const profileMap = new Map((profilesRes.data || []).map((p: any) => [p.id, p]));
      const staffMap = new Map((staffRes.data || []).map((s: any) => [s.id, { full_name: s.full_name }]));
      enriched = enriched.map(a => ({
        ...a,
        profiles: profileMap.get(a.user_id) || null,
        staff_member: a.staff_id ? (staffMap.get(a.staff_id) || null) : undefined,
      })) as Appointment[];
    } catch { /* enrichment non-critical */ }

    return { success: true, data: enriched, error: null };
  } catch (err: unknown) {
    return { success: false, data: null, error: getErrorMessage(err) || 'Error al cargar citas' };
  }
}

export async function getBusinessAppointments(businessId: string) {
  try {
    const { data, error } = await supabase
      .from('agendaya_appointments')
      .select('*')
      .eq('business_id', businessId)
      .neq('status', 'cancelled')
      .order('start_time', { ascending: true });
    if (error) throw error;
    const appointments = (data || []) as Appointment[];

    if (appointments.length === 0) {
      return { success: true, data: appointments, error: null };
    }

    const userIds = [...new Set(appointments.map(a => a.user_id).filter(Boolean))];
    const serviceIds = [...new Set(appointments.map(a => a.service_id).filter(Boolean))];
    const staffIds = [...new Set(appointments.map(a => a.staff_id).filter(Boolean))];

    let enriched = appointments as Appointment[];
    try {
      const [profilesRes, servicesRes, staffRes] = await Promise.all([
        userIds.length > 0
          ? supabase.from('agendaya_profiles').select('id, full_name, phone').in('id', userIds)
          : { data: [] },
        serviceIds.length > 0
          ? supabase.from('agendaya_services').select('id, name, duration, price, min_cancellation_hours, min_reschedule_hours, cancellation_policy_text, reschedule_policy_text').in('id', serviceIds)
          : { data: [] },
        staffIds.length > 0
          ? supabase.from('agendaya_staff').select('id, full_name').in('id', staffIds)
          : { data: [] },
      ]);

      const profileMap = new Map((profilesRes.data || []).map((p: any) => [p.id, p]));
      const serviceMap = new Map((servicesRes.data || []).map((s: any) => [s.id, s]));
      const staffMap = new Map((staffRes.data || []).map((s: any) => [s.id, { full_name: s.full_name }]));

      enriched = appointments.map(a => ({
        ...a,
        profiles: profileMap.get(a.user_id) || null,
        services: serviceMap.get(a.service_id) || null,
        staff_member: a.staff_id ? (staffMap.get(a.staff_id) || null) : undefined,
      })) as Appointment[];
    } catch {
      console.warn('[getBusinessAppointments] Enrichment failed, returning raw data');
    }

    return { success: true, data: enriched, error: null };
  } catch (err: unknown) {
    console.error('[getBusinessAppointments] Error:', err);
    return { success: false, data: null, error: getErrorMessage(err) || 'Error al cargar citas del negocio' };
  }
}

export const createAppointment = async (appointment: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase.rpc('create_appointment_safe', {
    p_business_id: appointment.business_id,
    p_service_id: appointment.service_id,
    p_user_id: appointment.user_id || '',
    p_start_time: appointment.start_time,
    p_end_time: appointment.end_time,
    p_notes: appointment.notes || null,
    p_guest_info: appointment.guest_info || null,
    p_is_guest: appointment.is_guest || false,
    p_payment_provider: appointment.payment_provider || null,
    p_payment_id: appointment.payment_id || null,
    p_payment_amount: appointment.payment_amount || null,
    p_staff_id: appointment.staff_id || null,
  });

  if (error) throw error;
  if (!data?.success) throw new Error(data?.error || 'Error al crear la cita');
  return data.data;
};

export const updateAppointmentStatus = async (id: string, status: AppointmentStatus) => {
  try {
    const { data, error } = await supabase
      .from('agendaya_appointments')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error) };
  }
};

export const cancelAppointment = async (id: string, reason?: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data, error } = await supabase.rpc('cancel_appointment_safe', {
      p_appointment_id: id,
      p_reason: reason || null,
    });
    if (error) throw error;
    if (!data?.success) return { success: false, error: data?.error || 'Error al cancelar' };
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) };
  }
};

export const rescheduleAppointment = async (id: string, startTime: string, endTime: string, staffId?: string | null): Promise<{ success: boolean; error?: string; new_status?: string }> => {
  try {
    const { data, error } = await supabase.rpc('reschedule_appointment_safe', {
      p_appointment_id: id,
      p_new_start: startTime,
      p_new_end: endTime,
      p_new_staff_id: staffId || null,
    });
    if (error) throw error;
    if (!data?.success) return { success: false, error: data?.error || 'Error al reprogramar' };
    return { success: true, new_status: data.new_status };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) };
  }
};
