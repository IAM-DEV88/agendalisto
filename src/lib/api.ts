import { supabase, UserProfile } from './supabase';
import type { Appointment, AppointmentStatus, Review, GuestInfo } from '../types/appointment';
import { DEFAULT_BUSINESS_CONFIG } from './defaults';
import { getErrorMessage } from './api-helpers';
import { WHATSAPP_API_URL } from './config';

// Re-export types from appointment.ts
export type { Appointment, AppointmentStatus, Review, GuestInfo };

// Type definitions for data models
export type Business = {
  id: string;
  slug: string;
  owner_id: string;
  category_id: string | null;  // ID of the assigned category
  name: string;
  description: string;
  address: string;
  logo_url: string | null;
  phone: string;
  email: string;
  whatsapp: string | null;
  instagram: string | null;
  facebook: string | null;
  website: string | null;
  lat: number | null;
  lng: number | null;
  plan: string;
  plan_score: number;
  likes_count: number;
  showcase_only?: boolean;
  referral_code?: string | null;
  created_at: string;
  updated_at: string;
  /** Business configuration settings */
  config?: BusinessConfig;
};

export interface Service {
  id: string;
  business_id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  likes_count: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  provider?: string;
  image_urls?: string[];
  can_be_gifted?: boolean;
  requires_payment?: boolean;
  payment_percentage?: number;
  min_cancellation_hours?: number;
  cancellation_policy_text?: string;
  min_reschedule_hours?: number;
  reschedule_policy_text?: string;
  mostrar_precios?: boolean;
  permitir_reservas_online?: boolean;
  requiere_confirmacion?: boolean;
}

export type BusinessHours = {
  id: string;
  business_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_closed: boolean;
};

// Definir el tipo BusinessConfig para la configuración de negocios
export interface BusinessConfig {
  permitir_reservas_online: boolean;
  mostrar_precios: boolean;
  mostrar_telefono: boolean;
  mostrar_email: boolean;
  mostrar_redes_sociales: boolean;
  mostrar_direccion: boolean;
  requiere_confirmacion: boolean;
  notificaciones_email: boolean;
  notificaciones_whatsapp: boolean;
  slot_interval_minutes?: number;
  buffer_minutes?: number;
  max_advance_booking_days?: number;
  password_protection_enabled?: boolean;
  password_protect_staff?: boolean;
  password_protect_hours?: boolean;
  password_protect_services?: boolean;
  password_protect_appointments?: boolean;
  password_protect_profile?: boolean;
}

export interface Staff {
  id: string;
  business_id: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Helper to create URL-friendly slug from business name
export const slugify = (str: string) => str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');

// API functions for businesses
export const getBusinesses = async (search?: string, category?: string, location?: string, limit?: number, offset?: number) => {
  const { data, error } = await supabase.rpc('search_agendaya_businesses', {
    p_search: search ?? null,
    p_category_id: category ?? null,
    p_location: location ?? null,
    p_limit: limit ?? null,
    p_offset: offset ?? 0,
  });

  if (error) throw error;
  return (data as Business[]);
};

export const getBusinessesMapData = async () => {
  const { data, error } = await supabase
    .from('agendaya_businesses')
    .select('id, name, slug, lat, lng')
    .not('lat', 'is', null)
    .not('lng', 'is', null);
  if (error) throw error;
  return data as Pick<Business, 'id' | 'name' | 'slug' | 'lat' | 'lng'>[];
};

export interface BusinessStats {
  total_visits: number;
  visits_today: number;
  visits_week: number;
  visits_month: number;
  unique_visitors: number;
  total_business_likes: number;
  total_service_likes: number;
  total_services: number;
}

export const recordBusinessVisit = async (businessId: string, userId?: string) => {
  let anonymousId: string | null = null;
  if (!userId) {
    anonymousId = localStorage.getItem('visitor_session') || crypto.randomUUID();
    localStorage.setItem('visitor_session', anonymousId);
  }
  try {
    await supabase.rpc('record_business_visit', {
      p_business_id: businessId,
      p_user_id: userId ?? null,
      p_anonymous_id: anonymousId,
    });
  } catch (err) {
    console.error('[recordBusinessVisit] Error:', err);
  }
};

export const getBusinessStats = async (businessId: string) => {
  const { data, error } = await supabase.rpc('get_business_stats', {
    p_business_id: businessId,
  });
  if (error) throw error;
  const stats = Array.isArray(data) ? data[0] : data;
  return stats as BusinessStats;
};

// API functions for business services
export const getBusinessServices = async (businessId: string) => {
  try {
    const { data, error } = await supabase
      .from('agendaya_services')
      .select('id, name, description, duration, price, likes_count, is_active, provider, image_urls, can_be_gifted, requires_payment, payment_percentage, min_cancellation_hours, cancellation_policy_text, min_reschedule_hours, reschedule_policy_text, mostrar_precios, permitir_reservas_online, requiere_confirmacion, created_at, business_id')
      .eq('business_id', businessId)
      .order('name');

    if (error) throw error;
    return { success: true, data: data as Service[] };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) };
  }
};

// ─── Functions migrated from apiClient.ts ───

export async function getBusinessById(id: string): Promise<{ success: boolean; data?: Business; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('agendaya_businesses')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return { success: true, data: data as Business };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) || 'Error fetching business' };
  }
}

export async function setActiveBusiness(userId: string, businessId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.rpc('set_active_business', {
      p_user_id: userId,
      p_business_id: businessId,
    });
    if (error) throw error;
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) || 'Error switching business' };
  }
}

export async function saveItemsPerPage(userId: string, itemsPerPage: number): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('agendaya_profiles')
      .update({ items_per_page: itemsPerPage })
      .eq('id', userId);
    if (error) throw error;
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) || 'Error saving items per page' };
  }
}

// API functions for business hours
export const getBusinessHours = async (businessId: string) => {
  try {
    const { data, error } = await supabase
      .from('agendaya_business_hours')
      .select('id, business_id, day_of_week, start_time, end_time, is_closed')
      .eq('business_id', businessId);
    if (error) throw error;
    return data as BusinessHours[];
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error) || 'Error al cargar horarios del negocio');
  }
};

// API functions for appointments
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

// --- Gift Codes ---

export interface GiftCode {
  id: string;
  code: string;
  service_id: string;
  business_id: string;
  sender_user_id: string | null;
  recipient_name: string;
  recipient_email: string;
  recipient_phone: string | null;
  message: string | null;
  status: 'active' | 'redeemed' | 'expired';
  redeemed_at: string | null;
  created_at: string;
  expires_at: string;
  /** Payment fields */
  payment_provider?: string | null;
  payment_status?: string;
  payment_id?: string | null;
  payment_amount?: number | null;
  payment_currency?: string | null;
}

export const checkPendingPayment = async (reference: string): Promise<{
  success: boolean;
  status?: string;
  error?: string;
  data?: any;
}> => {
  try {
    const { data, error } = await supabase
      .from('agendaya_pending_payments')
      .select('*')
      .eq('reference', reference)
      .maybeSingle();
    if (error) throw error;
    if (!data) return { success: false, error: 'Referencia no encontrada' };
    return { success: true, status: data.status, data };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) };
  }
};

export const createGiftCode = async (gift: {
  code: string;
  service_id: string;
  business_id: string;
  sender_user_id: string;
  recipient_name: string;
  recipient_email: string;
  recipient_phone?: string;
  message?: string;
  expires_at: string;
  payment_provider: string;
  payment_id: string;
  payment_amount: number;
  payment_currency: string;
}): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('agendaya_gift_codes')
      .insert([{
        code: gift.code,
        service_id: gift.service_id,
        business_id: gift.business_id,
        sender_user_id: gift.sender_user_id,
        recipient_name: gift.recipient_name,
        recipient_email: gift.recipient_email,
        recipient_phone: gift.recipient_phone || null,
        message: gift.message || null,
        expires_at: gift.expires_at,
        status: 'active',
        payment_provider: gift.payment_provider,
        payment_status: 'completed',
        payment_id: gift.payment_id,
        payment_amount: gift.payment_amount,
        payment_currency: gift.payment_currency,
      }]);
    if (error) throw error;
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) };
  }
};

export const validateGiftCode = async (code: string, serviceId: string, businessId: string): Promise<{ success: boolean; gift?: GiftCode; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('agendaya_gift_codes')
      .select('*')
      .eq('code', code)
      .eq('service_id', serviceId)
      .eq('business_id', businessId)
      .eq('status', 'active')
      .single();

    if (error) {
      if (error.code === 'PGRST116') return { success: false, error: 'Código inválido o ya fue canjeado' };
      throw error;
    }

    const gift = data as GiftCode;
    if (new Date(gift.expires_at) < new Date()) {
      return { success: false, error: 'Este código de regalo ha expirado' };
    }

    return { success: true, gift };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) };
  }
};

export const deleteAccount = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.rpc('delete_agendaya_account');
    if (error) throw error;
    await supabase.auth.signOut();
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) };
  }
};

export const redeemGiftCode = async (code: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('agendaya_gift_codes')
      .update({ status: 'redeemed', redeemed_at: new Date().toISOString() })
      .eq('code', code);
    if (error) throw error;
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) };
  }
};

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

// Function to get unique clients of a business based on appointments
export async function getBusinessClients(businessId: string): Promise<{ success: boolean; data: UserProfile[] | null; error: string | null }> {
  try {
    // Fetch all appointments for the business to get user IDs
    const { data: appts, error: apptError } = await supabase
      .from('agendaya_appointments')
      .select('user_id')
      .eq('business_id', businessId);
    if (apptError) throw apptError;
    // Extract unique user IDs
    const userIds = Array.from(new Set((appts as { user_id: string }[]).map(a => a.user_id)));
    if (userIds.length === 0) {
      return { success: true, data: [], error: null };
    }
    // Fetch profiles for these user IDs
    const { data: profiles, error: profilesError } = await supabase
      .from('agendaya_profiles')
      .select('*')
      .in('id', userIds);
    if (profilesError) throw profilesError;
    return { success: true, data: profiles as UserProfile[], error: null };
  } catch (err: unknown) {
    return { success: false, data: null, error: getErrorMessage(err) || 'Error al obtener clientes del negocio' };
  }
}

// --- Appointment Slot Availability (server-validated) ---

export interface AvailableSlot {
  start: string;
  end: string;
  available: boolean;
}

export async function getAvailableSlots(businessId: string, serviceId: string, date: string, staffId?: string | null): Promise<{ success: boolean; slots?: AvailableSlot[]; closed?: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('get_available_slots', {
      p_business_id: businessId,
      p_service_id: serviceId,
      p_date: date,
      p_staff_id: staffId || null,
    });
    if (error) throw error;
    return { success: true, slots: data?.slots || [], closed: data?.closed || false };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) || 'Error al cargar disponibilidad' };
  }
}

// --- Auto-complete appointments (call periodically) ---

export async function triggerAutoComplete(): Promise<{ success: boolean; completed?: number; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('trigger_auto_complete');
    if (error) throw error;
    return { success: true, completed: data || 0 };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) };
  }
}

// --- Waitlist ---

export async function joinWaitlist(params: {
  business_id: string;
  service_id: string;
  user_id?: string;
  guest_name?: string;
  guest_email?: string;
  preferred_date?: string;
  preferred_time_start?: string;
  preferred_time_end?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('join_waitlist', {
      p_business_id: params.business_id,
      p_service_id: params.service_id,
      p_user_id: params.user_id || null,
      p_guest_name: params.guest_name || null,
      p_guest_email: params.guest_email || null,
      p_preferred_date: params.preferred_date || null,
      p_preferred_time_start: params.preferred_time_start || null,
      p_preferred_time_end: params.preferred_time_end || null,
    });
    if (error) throw error;
    if (!data?.success) return { success: false, error: data?.error || 'Error al unirse a la lista de espera' };
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) };
  }
}

export async function getWaitlist(businessId: string): Promise<{ success: boolean; data?: Record<string, unknown>[]; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('get_waitlist', { p_business_id: businessId });
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) };
  }
}

// API functions for business management
export const createBusiness = async (business: Omit<Business, 'id' | 'plan' | 'plan_score' | 'likes_count' | 'created_at' | 'updated_at'>) => {
  try {
    // Obtener el plan real del dueño
    const { data: profile } = await supabase
      .from('agendaya_profiles')
      .select('plan')
      .eq('id', business.owner_id)
      .single();

    const ownerPlan = (profile?.plan as string) || 'starter';
    const planScore = ownerPlan === 'premium' ? 3 : ownerPlan === 'pro' ? 2 : 0;

    const { data, error } = await supabase
      .from('agendaya_businesses')
      .insert([{
        ...business,
        plan: ownerPlan,
        plan_score: planScore,
        likes_count: 0,
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('[createBusiness] Supabase error:', error);
      throw error;
    }

    const newBusiness = data as Business;

    // Generar código de referido vinculado al negocio
    const bizCode = 'AGB' + btoa(newBusiness.id).replace(/=/g, '').replace(/\//g, '_');
    await supabase
      .from('agendaya_businesses')
      .update({ referral_code: bizCode })
      .eq('id', newBusiness.id);

    // Crear fila de configuración por defecto
    await supabase
      .from('agendaya_business_config')
      .insert({ business_id: newBusiness.id, requiere_confirmacion: true })
      .then(({ error: cfgError }) => {
        if (cfgError) console.error('[createBusiness] Error creating config:', cfgError);
      });

    return { success: true, business: { ...newBusiness, referral_code: bizCode } };
  } catch (error) {
    console.error('[createBusiness] Caught:', error);
    return { success: false, error };
  }
};

export const updateBusiness = async (id: string, updates: Partial<Business>) => {
  const { data, error } = await supabase
    .from('agendaya_businesses')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as Business;
};

export const deleteBusiness = async (id: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('agendaya_businesses')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (error: unknown) {
    console.error('Error al eliminar negocio:', error);
    return { success: false, error: getErrorMessage(error) || 'Error al eliminar negocio' };
  }
};

// --- Likes Functions ---
export const checkLikedBusinesses = async (userId: string, businessIds: string[]): Promise<Set<string>> => {
  if (!userId || businessIds.length === 0) return new Set();
  try {
    const { data, error } = await supabase.rpc('check_user_likes_batch', {
      p_user_id: userId,
      p_business_ids: businessIds,
    });
    if (error) throw error;
    return new Set((data as { business_id: string }[]).map(r => r.business_id));
  } catch {
    return new Set();
  }
};

export const checkIfLiked = async (userId: string, targetId: string, type: 'business' | 'service') => {
  try {
    const query = supabase
      .from('agendaya_user_likes')
      .select('id')
      .eq('user_id', userId);
    
    if (type === 'business') {
      query.eq('business_id', targetId);
    } else {
      query.eq('service_id', targetId);
    }

    const { data, error } = await query.limit(1);
    if (error) throw error;
    return data && data.length > 0;
  } catch (error) {
    console.error('Error checking like status:', error);
    return false;
  }
};

export const toggleLike = async (userId: string, targetId: string, type: 'business' | 'service') => {
  try {
    const column = type === 'business' ? 'business_id' : 'service_id';

    const { data: existing } = await supabase
      .from('agendaya_user_likes')
      .select('id')
      .eq('user_id', userId)
      .eq(column, targetId)
      .maybeSingle();

    if (existing) {
      const { error: delError } = await supabase
        .from('agendaya_user_likes')
        .delete()
        .eq('user_id', userId)
        .eq(column, targetId);
      if (delError) throw delError;
      return { success: true, action: 'removed' };
    }

    const { error: insertError } = await supabase
      .from('agendaya_user_likes')
      .insert([{ user_id: userId, [column]: targetId }]);

    if (insertError) throw insertError;
    return { success: true, action: 'added' };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) };
  }
};
export interface FavoriteItem {
  id: string;
  like_id: string;
  business_id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  logo_url: string | null;
  phone: string | null;
  likes_count: number;
  category_id: string | null;
}

export const getUserFavorites = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('agendaya_user_likes')
      .select(`
        id,
        business_id,
        businesses:agendaya_businesses (
          id,
          name,
          slug,
          description,
          address,
          logo_url,
          phone,
          likes_count,
          category_id
        )
      `)
      .eq('user_id', userId)
      .not('business_id', 'is', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    const favorites: FavoriteItem[] = data
      .filter((item: any) => item.businesses)
      .map((item: any) => ({
        id: item.businesses.id,
        like_id: item.id,
        business_id: item.business_id,
        name: item.businesses.name,
        slug: item.businesses.slug,
        description: item.businesses.description,
        address: item.businesses.address,
        logo_url: item.businesses.logo_url,
        phone: item.businesses.phone,
        likes_count: item.businesses.likes_count,
        category_id: item.businesses.category_id,
      }));
    return { success: true, data: favorites };
  } catch (error: unknown) {
    console.error('[getUserFavorites] Error:', error);
    return { success: false, error: getErrorMessage(error) };
  }
};
// --- End Likes Functions ---

export interface ServiceFavoriteItem {
  like_id: string;
  service_id: string;
  business_id: string;
  business_name: string;
  business_slug: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  image_urls: string[];
  likes_count: number;
}

export interface BlogPostFavoriteItem {
  like_id: string;
  post_id: string;
  title: string;
  excerpt: string | null;
  image_url: string | null;
  likes_count: number;
  created_at: string;
}

export const getUserFavoriteServices = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('agendaya_user_likes')
      .select(`
        id,
        service_id,
        services:agendaya_services (
          id,
          name,
          description,
          price,
          duration,
          image_urls,
          likes_count,
          business_id,
          businesses:agendaya_businesses (
            name,
            slug
          )
        )
      `)
      .eq('user_id', userId)
      .not('service_id', 'is', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    const favorites: ServiceFavoriteItem[] = data
      .filter((item: any) => item.services)
      .map((item: any) => ({
        like_id: item.id,
        service_id: item.service_id,
        business_id: item.services.business_id,
        business_name: item.services.businesses?.name || '',
        business_slug: item.services.businesses?.slug || '',
        name: item.services.name,
        description: item.services.description,
        price: item.services.price,
        duration: item.services.duration,
        image_urls: item.services.image_urls || [],
        likes_count: item.services.likes_count,
      }));
    return { success: true, data: favorites };
  } catch (error: unknown) {
    console.error('[getUserFavoriteServices] Error:', error);
    return { success: false, error: getErrorMessage(error) };
  }
};

export const getUserFavoriteBlogPosts = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('agendaya_blog_likes')
      .select(`
        id,
        post_id,
        posts:agendaya_blog_posts (
          id,
          title,
          excerpt,
          image_url,
          likes_count,
          created_at
        )
      `)
      .eq('user_id', userId)
      .not('post_id', 'is', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    const favorites: BlogPostFavoriteItem[] = data
      .filter((item: any) => item.posts)
      .map((item: any) => ({
        like_id: item.id,
        post_id: item.post_id,
        title: item.posts.title,
        excerpt: item.posts.excerpt || item.posts.content?.substring(0, 150) || null,
        image_url: item.posts.image_url,
        likes_count: item.posts.likes_count,
        created_at: item.posts.created_at,
      }));
    return { success: true, data: favorites };
  } catch (error: unknown) {
    console.error('[getUserFavoriteBlogPosts] Error:', error);
    return { success: false, error: getErrorMessage(error) };
  }
};

// API functions for business hours
export const setBusinessHours = async (hours: Omit<BusinessHours, 'id'>[]): Promise<BusinessHours[]> => {
  const businessId = hours[0]?.business_id;
  if (!businessId) throw new Error('Business ID is required');

  const { error: delError } = await supabase
    .from('agendaya_business_hours')
    .delete()
    .eq('business_id', businessId);

  if (delError) throw delError;

  if (hours.length === 0) return [];

  const { data, error } = await supabase
    .from('agendaya_business_hours')
    .insert(hours)
    .select();

  if (error) throw error;
  return data as BusinessHours[];
};

export const obtenerPerfilUsuario = async (userId: string): Promise<{ success: boolean; perfil: UserProfile | null; error: string | null; }> => {
  if (!userId) {
    return { success: false, perfil: null, error: 'ID de usuario no proporcionado' };
  }

  const { data, error } = await supabase
    .from('agendaya_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  const perfilNoEncontrado = error?.code === 'PGRST116';

  if (error && !perfilNoEncontrado) {
    return { success: false, perfil: null, error: getErrorMessage(error) };
  }

  if (data && !perfilNoEncontrado) {
    if (!data.business_id) {
      const { data: biz } = await supabase
        .from('agendaya_businesses')
        .select('id')
        .eq('owner_id', userId)
        .maybeSingle();
      if (biz?.id) {
        data.business_id = biz.id;
        await supabase.from('agendaya_profiles').update({ business_id: biz.id }).eq('id', userId);
      }
    }
    return { success: true, perfil: data as UserProfile, error: null };
  }

  try {
    await supabase.rpc('ensure_user_app', {
      p_user_id: userId,
      p_app_slug: 'agendaya',
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    const { data: retryData } = await supabase
      .from('agendaya_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (retryData) {
      return { success: true, perfil: retryData as UserProfile, error: null };
    }
  } catch {
    // Fallback silencioso
  }

  return { success: false, perfil: null, error: 'Perfil no encontrado' };
};

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>): Promise<{ success: boolean; data?: UserProfile; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('agendaya_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return { success: true, data: data as UserProfile };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) };
  }
};

export async function getUserBusinesses(userId: string) {
  try {
    const { data, error } = await supabase
      .from('agendaya_businesses')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return { success: true, businesses: (data || []) as Business[] };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) || 'Error desconocido' };
  }
}

export async function getUserBusiness(userId: string) {
  try {
    const { data, error } = await supabase
      .from('agendaya_businesses')
      .select('*')
      .eq('owner_id', userId)
      .maybeSingle();
    if (error) {
      throw error;
    }
    if (!data) {
      return { success: true, business: null };
    }
    return { success: true, business: data as Business };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) || 'Error desconocido' };
  }
}

// API functions for business config
export async function getBusinessConfig(businessId: string): Promise<{ success: boolean, config?: BusinessConfig, error?: string }> {
  try {
    const { data, error } = await supabase
      .from('agendaya_business_config')
      .select('*')
      .eq('business_id', businessId)
      .single();
    if (error) {
      // No config row: return default
      if (error.code === 'PGRST116') {
        return { success: true, config: DEFAULT_BUSINESS_CONFIG };
      }
      // Other errors
      return { success: false, error: getErrorMessage(error) };
    }
    // Single row returned — merge with defaults in case DB row is missing newer columns
    return { success: true, config: { ...DEFAULT_BUSINESS_CONFIG, ...data } as BusinessConfig };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) };
  }
}

// API functions for business config
export async function updateBusinessConfig(businessId: string, config: BusinessConfig): Promise<{ success: boolean, error?: string }> {
  try {
    const { error } = await supabase
      .from('agendaya_business_config')
      .upsert({
        business_id: businessId,
        ...config,
        updated_at: new Date().toISOString()
      });

    if (error) {
      return { success: false, error: getErrorMessage(error) };
    }

    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error) };
  }
}

// Functions for managing business services
export const createBusinessService = async (service: Omit<Service, 'id' | 'likes_count' | 'created_at' | 'updated_at'>) => {
  try {
    const { data, error } = await supabase
      .from('agendaya_services')
      .insert({
        ...service, 
        image_urls: service.image_urls || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, service: data as Service };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) || 'Error al crear el servicio' };
  }
};

export const updateBusinessService = async (id: string, updates: Partial<Service>) => {
  try {
    const { data, error } = await supabase
      .from('agendaya_services')
      .update({ 
        ...updates, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, service: data as Service };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) || 'Error al actualizar el servicio' };
  }
};

export const deleteBusinessService = async (id: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('agendaya_services')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (error: unknown) {
    console.error('Error al eliminar servicio:', error);
    return { success: false, error: getErrorMessage(error) || 'Error al eliminar servicio' };
  }
};

export async function getBusinessBySlug(slug: string) {
  try {
    const { data, error } = await supabase
      .from('agendaya_businesses')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    
    if (error) throw error;
    
    if (!data) {
      return { success: false, error: 'Business not found' };
    }
    
    const business = data as Business;
    const { success: configSuccess, config } = await getBusinessConfig(business.id);
    
    if (configSuccess && config) {
      business.config = config;
    }
    
    return { success: true, business };
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function getService(serviceId: string): Promise<{ success: boolean; data?: Service; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('agendaya_services')
      .select('*')
      .eq('id', serviceId)
      .single();

    if (error) throw error;
    return { success: true, data: data as Service };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) || 'Error al obtener el servicio' };
  }
}

// ─── Staff (Encargados) ───

export async function getBusinessStaff(businessId: string): Promise<{ success: boolean; data?: Staff[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('agendaya_staff')
      .select('id, business_id, full_name, email, phone, is_active, created_at')
      .eq('business_id', businessId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return { success: true, data: data as Staff[] };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) || 'Error al obtener el personal' };
  }
}

export async function createStaff(businessId: string, params: { full_name: string; email?: string; phone?: string }): Promise<{ success: boolean; data?: Staff; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('agendaya_staff')
      .insert({ business_id: businessId, ...params })
      .select()
      .single();
    if (error) throw error;
    return { success: true, data: data as Staff };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) || 'Error al crear el encargado' };
  }
}

export async function updateStaff(staffId: string, params: { full_name?: string; email?: string; phone?: string; is_active?: boolean }): Promise<{ success: boolean; data?: Staff; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('agendaya_staff')
      .update(params)
      .eq('id', staffId)
      .select()
      .single();
    if (error) throw error;
    return { success: true, data: data as Staff };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) || 'Error al actualizar el encargado' };
  }
}

export async function deleteStaff(staffId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('agendaya_staff')
      .delete()
      .eq('id', staffId);
    if (error) throw error;
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) || 'Error al eliminar el encargado' };
  }
}

// ─── Password verification ───
// Uses signInWithPassword + restores the original session so the user
// stays logged in with their current tokens regardless of the result.

export async function verifyPassword(password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return { success: false, error: 'No se pudo obtener el usuario' };

    const { data: { session } } = await supabase.auth.getSession();

    const { error } = await supabase.auth.signInWithPassword({ email: user.email, password });

    // Restore original session no matter what (keeps user logged in)
    if (session) {
      await supabase.auth.setSession(session);
    }

    if (error) return { success: false, error: 'Contraseña incorrecta' };
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) || 'Contraseña incorrecta' };
  }
}

// ─── Reviews ───
export async function getBusinessReviews(businessId: string): Promise<{ success: boolean; data: Review[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('agendaya_reviews')
      .select('id, rating, comment, created_at, appointment_id, business_id, user_id, status')
      .eq('business_id', businessId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return { success: true, data: data as Review[] };
  } catch (err: unknown) {
    return { success: false, data: [], error: getErrorMessage(err) };
  }
}

export async function createBusinessReview(
  appointmentId: string,
  businessId: string,
  userId: string,
  rating: number,
  comment: string,
  beforeImage?: string,
  afterImage?: string
): Promise<{ success: boolean; data?: Review; error?: string }> {
  try {
    const { data: existingReview, error: checkError } = await supabase
      .from('agendaya_reviews')
      .select('id')
      .eq('appointment_id', appointmentId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') throw checkError;
    if (existingReview) {
      return { success: false, error: 'Esta cita ya tiene una reseña' };
    }

    const { data, error } = await supabase
      .from('agendaya_reviews')
      .insert([{
        appointment_id: appointmentId,
        business_id: businessId,
        user_id: userId,
        rating,
        comment,
        before_image_url: beforeImage || null,
        after_image_url: afterImage || null,
        status: 'pending',
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    if (error) throw error;
    return { success: true, data: data as Review };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) };
  }
}

// ─── Moderation functions (admin/moderator) ───

export async function getPendingReviews(): Promise<{ success: boolean; data: (Review & { profiles?: { full_name: string }; businesses?: { name: string } })[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('agendaya_reviews')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) throw error;
    const reviews = (data || []) as Review[];

    if (reviews.length === 0) return { success: true, data: [] };

    const userIds = [...new Set(reviews.map(r => r.user_id).filter(Boolean))];
    const businessIds = [...new Set(reviews.map(r => r.business_id).filter(Boolean))];

    const [profilesRes, businessesRes] = await Promise.all([
      userIds.length > 0
        ? supabase.from('agendaya_profiles').select('id, full_name').in('id', userIds)
        : { data: [] },
      businessIds.length > 0
        ? supabase.from('agendaya_businesses').select('id, name').in('id', businessIds)
        : { data: [] },
    ]);

    const profileMap = new Map((profilesRes.data || []).map(p => [p.id, p]));
    const businessMap = new Map((businessesRes.data || []).map(b => [b.id, b]));

    const enriched = reviews.map(r => {
      const profile = profileMap.get(r.user_id);
      const business = businessMap.get(r.business_id);
      return {
        ...r,
        profiles: profile ? { full_name: profile.full_name } : undefined,
        businesses: business ? { name: business.name } : undefined,
      };
    });

    return { success: true, data: enriched as (Review & { profiles?: { full_name: string }; businesses?: { name: string } })[] };
  } catch (err: unknown) {
    console.error('[getPendingReviews] Error:', err);
    return { success: false, data: [], error: getErrorMessage(err) };
  }
}

export async function approveReview(reviewId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('agendaya_reviews')
      .update({ status: 'approved' })
      .eq('id', reviewId);
    if (error) throw error;
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) };
  }
}

export async function rejectReview(reviewId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('agendaya_reviews')
      .update({ status: 'rejected' })
      .eq('id', reviewId);
    if (error) throw error;
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) };
  }
}

export async function getReviewStats(): Promise<{ success: boolean; data?: { pending: number; approved: number; rejected: number; total: number }; error?: string }> {
  try {
    const [pendingRes, approvedRes, rejectedRes, totalRes] = await Promise.all([
      supabase.from('agendaya_reviews').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('agendaya_reviews').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('agendaya_reviews').select('id', { count: 'exact', head: true }).eq('status', 'rejected'),
      supabase.from('agendaya_reviews').select('id', { count: 'exact', head: true }),
    ]);
    return {
      success: true,
      data: {
        pending: pendingRes.count ?? 0,
        approved: approvedRes.count ?? 0,
        rejected: rejectedRes.count ?? 0,
        total: totalRes.count ?? 0,
      },
    };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) };
  }
}

// ─── Admin dashboard stats ───

export async function getAdminStats(): Promise<{
  success: boolean;
  data?: {
    totalUsers: number;
    totalBusinesses: number;
    totalBlogPosts: number;
    totalComments: number;
  };
  error?: string;
}> {
  try {
    const [usersRes, businessesRes, postsRes, commentsRes] = await Promise.all([
      supabase.from('agendaya_profiles').select('id', { count: 'exact', head: true }),
      supabase.from('agendaya_businesses').select('id', { count: 'exact', head: true }),
      supabase.from('agendaya_blog_posts').select('id', { count: 'exact', head: true }),
      supabase.from('agendaya_blog_comments').select('id', { count: 'exact', head: true }),
    ]);
    return {
      success: true,
      data: {
        totalUsers: usersRes.count ?? 0,
        totalBusinesses: businessesRes.count ?? 0,
        totalBlogPosts: postsRes.count ?? 0,
        totalComments: commentsRes.count ?? 0,
      },
    };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) };
  }
}

export async function getModeratorStats(): Promise<{
  success: boolean;
  data?: {
    pendingReviews: number;
    totalBlogPosts: number;
    totalComments: number;
  };
  error?: string;
}> {
  try {
    const [pendingRes, postsRes, commentsRes] = await Promise.all([
      supabase.from('agendaya_reviews').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('agendaya_blog_posts').select('id', { count: 'exact', head: true }),
      supabase.from('agendaya_blog_comments').select('id', { count: 'exact', head: true }),
    ]);
    return {
      success: true,
      data: {
        pendingReviews: pendingRes.count ?? 0,
        totalBlogPosts: postsRes.count ?? 0,
        totalComments: commentsRes.count ?? 0,
      },
    };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) };
  }
}

// Type for business categories
export type BusinessCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
};

// Fetch all business categories
export async function getBusinessCategories(): Promise<{ success: boolean; data: BusinessCategory[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('agendaya_business_categories')
      .select('id, name, slug, description, icon');
    if (error) throw error;
    return { success: true, data: data as BusinessCategory[], error: null };
  } catch (err: unknown) {
    return { success: false, data: null, error: getErrorMessage(err) || 'Error fetching categories' };
  }
}

export type Milestone = {
  id: string;
  title: string;
  cta: string;
  description: string;
  goal_amount: number;
  current_amount: number;
  deadline: string | null;
  created_at: string;
  updated_at: string;
};

export const getMilestones = async (): Promise<{ success: boolean; data?: Milestone[]; error?: string }> => {
  try {
    const { data, error } = await supabase.from('agendaya_milestones').select('*');
    if (error) throw error;
    return { success: true, data: (data as Milestone[]) || [] };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) };
  }
};

// --- Blog & Chat Functions ---

export type BlogPost = {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  author_name: string;
  image_url: string | null;
  likes_count: number;
  created_at: string;
  updated_at: string;
  comment_count?: number;
};

export type BlogComment = {
  id: string;
  post_id: string;
  user_id: string | null;
  author_name: string;
  content: string;
  likes_count: number;
  is_agent_reply: boolean;
  created_at: string;
};

export const getLatestBlogPost = async (): Promise<{ success: boolean; data?: BlogPost; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('agendaya_blog_posts')
      .select('*, blog_comments:agendaya_blog_comments(count)')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) throw error;
    
    const post = {
      ...data,
      comment_count: data.blog_comments?.[0]?.count || 0
    };
    
    return { success: true, data: post as BlogPost };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) };
  }
};

export const getPopularPosts = async (limit = 4): Promise<{ success: boolean; data?: BlogPost[]; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('agendaya_blog_posts')
      .select('*, blog_comments:agendaya_blog_comments(count)')
      .order('likes_count', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    
    const posts = (data || []).map(p => ({
      ...p,
      comment_count: p.blog_comments?.[0]?.count || 0
    }));
    
    return { success: true, data: posts as BlogPost[] };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) };
  }
};

export const getBlogPosts = async (page = 0, limit = 6, search?: string): Promise<{ success: boolean; data?: BlogPost[]; error?: string; hasMore?: boolean }> => {
  try {
    const from = page * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('agendaya_blog_posts')
      .select('*, blog_comments:agendaya_blog_comments(count)', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%,excerpt.ilike.%${search}%`);
    }

    const { data, error, count } = await query.range(from, to);
    
    if (error) throw error;
    
    const posts = (data || []).map(p => ({
      ...p,
      comment_count: p.blog_comments?.[0]?.count || 0
    }));
    
    return { 
      success: true, 
      data: posts as BlogPost[],
      hasMore: count ? (from + posts.length) < count : false
    };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) };
  }
};

export const getBlogPost = async (id: string): Promise<{ success: boolean; data?: BlogPost; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('agendaya_blog_posts')
      .select('*, blog_comments:agendaya_blog_comments(count)')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    const post = {
      ...data,
      comment_count: data.blog_comments?.[0]?.count || 0
    };
    
    return { success: true, data: post as BlogPost };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) };
  }
};

// --- Blog Admin CRUD ---

export const adminGetAllPosts = async (): Promise<{ success: boolean; data?: BlogPost[]; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('agendaya_blog_posts')
      .select('*, blog_comments:agendaya_blog_comments(count)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    const posts = (data || []).map(p => ({
      ...p,
      comment_count: p.blog_comments?.[0]?.count || 0
    }));
    return { success: true, data: posts as BlogPost[] };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) };
  }
};

export const createBlogPost = async (post: Omit<BlogPost, 'id' | 'likes_count' | 'comment_count' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; data?: BlogPost; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('agendaya_blog_posts')
      .insert([post])
      .select()
      .single();
    if (error) throw error;
    return { success: true, data: data as BlogPost };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) };
  }
};

export const updateBlogPost = async (id: string, updates: Partial<Pick<BlogPost, 'title' | 'content' | 'excerpt' | 'image_url' | 'author_name'>>): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('agendaya_blog_posts')
      .update(updates)
      .eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) };
  }
};

export const deleteBlogPost = async (id: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('agendaya_blog_posts')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) };
  }
};

// --- Blog Comments ---

export const getBlogComments = async (postId: string): Promise<{ success: boolean; data?: BlogComment[]; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('agendaya_blog_comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return { success: true, data: data as BlogComment[] };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) };
  }
};

export const createBlogComment = async (comment: Omit<BlogComment, 'id' | 'likes_count' | 'created_at'>): Promise<{ success: boolean; data?: BlogComment; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('agendaya_blog_comments')
      .insert([comment])
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, data: data as BlogComment };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) };
  }
};

export const toggleBlogLike = async (userId: string, targetId: string, type: 'post' | 'comment'): Promise<{ success: boolean; action?: 'added' | 'removed'; error?: string }> => {
  try {
    const column = type === 'post' ? 'post_id' : 'comment_id';

    const { data: existingLike } = await supabase
      .from('agendaya_blog_likes')
      .select('id')
      .eq('user_id', userId)
      .eq(column, targetId)
      .maybeSingle();

    if (existingLike) {
      const { error } = await supabase
        .from('agendaya_blog_likes')
        .delete()
        .eq('id', existingLike.id);

      if (error) throw error;
      return { success: true, action: 'removed' };
    }

    const { error } = await supabase
      .from('agendaya_blog_likes')
      .insert([{ user_id: userId, [column]: targetId }]);

    if (error) {
      if (error.code === '23505') {
        return { success: true, action: 'added' };
      }
      throw error;
    }
    return { success: true, action: 'added' };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) };
  }
};

// --- Chat History Functions ---

export type ChatMessage = {
  id: string;
  user_id?: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
};

export const saveChatMessage = async (message: Omit<ChatMessage, 'id' | 'created_at'>): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('agendaya_chat_messages')
      .insert([message]);
    
    if (error) throw error;
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) };
  }
};

export const getChatHistory = async (sessionId: string, userId?: string): Promise<{ success: boolean; data?: ChatMessage[]; error?: string }> => {
  try {
    const query = supabase
      .from('agendaya_chat_messages')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (userId) {
      query.or(`user_id.eq.${userId},session_id.eq.${sessionId}`);
    } else {
      query.eq('session_id', sessionId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { success: true, data: data as ChatMessage[] };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) };
  }
};

export const getTopMilestones = async (limit = 3): Promise<{ success: boolean; data?: Milestone[]; error?: string }> => {
  try {
    const { data, error } = await supabase.from('agendaya_milestones').select('*').order('current_amount', { ascending: false }).limit(limit);
    if (error) throw error;
    return { success: true, data: (data as Milestone[]) || [] };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) };
  }
};

// ─── Roles & Plans API ───

export const updateProfileRole = async (
  userId: string,
  newRole: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.rpc('update_agendaya_profile_role', {
      p_user_id: userId,
      p_new_role: newRole,
    });
    if (error) throw error;
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) };
  }
};

export const updateBusinessPlan = async (
  userId: string,
  newPlan: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.rpc('update_agendaya_business_plan', {
      p_user_id: userId,
      p_new_plan: newPlan,
    });
    if (error) throw error;
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) };
  }
};

// ─── Admin: user management ───

export async function getUsersList(params: {
  search?: string;
  role?: string;
  plan?: string;
  page?: number;
  perPage?: number;
}): Promise<{ success: boolean; data: UserProfile[]; total: number; error?: string }> {
  try {
    const { search, role, plan, page = 1, perPage = 20 } = params;
    let query = supabase
      .from('agendaya_profiles')
      .select('*', { count: 'exact' });

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }
    if (role) {
      query = query.eq('role', role);
    }
    if (plan) {
      query = query.eq('plan', plan);
    }

    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return { success: true, data: data as UserProfile[], total: count ?? 0 };
  } catch (err: unknown) {
    return { success: false, data: [], total: 0, error: getErrorMessage(err) };
  }
}

export async function adminUpdateUser(
  targetUserId: string,
  updates: { role?: string; plan?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.rpc('admin_update_user', {
      p_target_user_id: targetUserId,
      p_new_role: updates.role ?? null,
      p_new_plan: updates.plan ?? null,
    });
    if (error) throw error;
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) };
  }
}

export type AdminBusiness = Business & {
  owner_name: string | null;
  owner_email: string | null;
};

export type DashboardMetrics = {
  totals: { users: number; businesses: number; posts: number; comments: number };
  visits: { total: number; today: number; week: number };
  appointments: { total: number; pending: number; confirmed: number; completed: number; cancelled: number };
  reviews: { total: number; pending: number; approved: number; rejected: number; avg_rating: number };
  likes: { total: number; businesses: number; services: number };
  subscriptions: { active: number };
  roles: { visitor: number; client: number; business_owner: number; moderator: number; admin: number };
  plans: { starter: number; pro: number; premium: number };
  top_businesses: { id: string; name: string; logo_url: string | null; visits: number; likes_count: number; appointments: number }[];
  active_users: { id: string; full_name: string; email: string; avatar_url: string | null; appointments_count: number; reviews_count: number }[];
  top_services: { id: string; name: string; business_name: string; likes_count: number }[];
  activity: { type: string; description: string; created_at: string }[];
};

export async function getAdminDashboardMetrics(): Promise<{ success: boolean; data?: DashboardMetrics; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('get_admin_dashboard_metrics');
    if (error) throw error;
    return { success: true, data: data as DashboardMetrics };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) };
  }
}

export async function getBusinessesList(params: {
  search?: string;
  plan?: string;
  category_id?: string;
  page?: number;
  perPage?: number;
}): Promise<{ success: boolean; data: AdminBusiness[]; total: number; error?: string }> {
  try {
    const { search, plan, category_id, page = 1, perPage = 15 } = params;

    let query = supabase
      .from('agendaya_businesses')
      .select('*', { count: 'exact' });

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }
    if (plan) {
      query = query.eq('plan', plan);
    }
    if (category_id) {
      query = query.eq('category_id', category_id);
    }

    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const businesses = (data || []) as Business[];

    const ownerIds = businesses.map(b => b.owner_id).filter(Boolean);
    const { data: profiles } = await supabase
      .from('agendaya_profiles')
      .select('id, full_name, email')
      .in('id', ownerIds);

    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

    const mapped: AdminBusiness[] = businesses.map(b => ({
      ...b,
      owner_name: profileMap.get(b.owner_id)?.full_name || null,
      owner_email: profileMap.get(b.owner_id)?.email || null,
    }));

    return { success: true, data: mapped, total: count ?? 0 };
  } catch (err: unknown) {
    return { success: false, data: [], total: 0, error: getErrorMessage(err) };
  }
}

export async function adminUpdateBusiness(
  businessId: string,
  updates: {
    name?: string;
    description?: string;
    address?: string;
    phone?: string;
    email?: string;
    whatsapp?: string;
    instagram?: string;
    facebook?: string;
    website?: string;
    plan?: string;
    category_id?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.rpc('admin_update_business', {
      p_business_id: businessId,
      p_name: updates.name ?? null,
      p_description: updates.description ?? null,
      p_address: updates.address ?? null,
      p_phone: updates.phone ?? null,
      p_email: updates.email ?? null,
      p_whatsapp: updates.whatsapp ?? null,
      p_instagram: updates.instagram ?? null,
      p_facebook: updates.facebook ?? null,
      p_website: updates.website ?? null,
      p_plan: updates.plan ?? null,
      p_category_id: updates.category_id ?? null,
    });
    if (error) throw error;
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) };
  }
}

export const contributeToMilestone = async (id: string, amount: number): Promise<{ success: boolean; data?: Milestone; error?: string }> => {
  try {
    const { error } = await supabase
      .rpc('contribute_to_milestone', { p_milestone_id: id, p_amount: amount });

    if (error) {
      // Fallback: read-then-write (RPC aún no desplegado)
      const { data: existing, error: fetchError } = await supabase
        .from('agendaya_milestones').select('current_amount').eq('id', id).single();
      if (fetchError || !existing) throw fetchError || new Error('Milestone not found');
      const newAmount = Number(existing.current_amount) + amount;
      const { data, error: updateError } = await supabase
        .from('agendaya_milestones').update({ current_amount: newAmount }).eq('id', id).select().single();
      if (updateError) throw updateError;
      return { success: true, data: data as Milestone };
    }

    const { data: milestone, error: fetchMilestoneError } = await supabase
      .from('agendaya_milestones').select('*').eq('id', id).single();
    if (fetchMilestoneError) throw fetchMilestoneError;
    return { success: true, data: milestone as Milestone };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) };
  }
};

// --- Newsletter ---

export const subscribeToNewsletter = async (email: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('agendaya_newsletter_subscriptions')
      .insert([{ email, subscribed_at: new Date().toISOString() }]);
    if (error && error.code === '23505') {
      return { success: false, error: 'Este correo ya está suscrito' };
    }
    if (error) throw error;
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) };
  }
};

// --- Referral System ---

const REFERRAL_PREFIX = 'AG';
const BUSINESS_REFERRAL_PREFIX = 'AGB';

export const generateReferralCode = (userId: string): string => {
  return REFERRAL_PREFIX + btoa(userId).replace(/=/g, '');
};

export const decodeReferralCode = (code: string): string | null => {
  if (!code.startsWith(REFERRAL_PREFIX)) return null;
  try {
    const encoded = code.slice(REFERRAL_PREFIX.length);
    return atob(encoded);
  } catch {
    return null;
  }
};

export const generateBusinessReferralCode = (businessId: string): string => {
  return BUSINESS_REFERRAL_PREFIX + btoa(businessId).replace(/=/g, '').replace(/\//g, '_');
};

export const decodeBusinessReferralCode = (code: string): string | null => {
  if (!code.startsWith(BUSINESS_REFERRAL_PREFIX)) return null;
  try {
    const encoded = code.slice(BUSINESS_REFERRAL_PREFIX.length);
    return atob(encoded);
  } catch {
    return null;
  }
};

export const getBusinessReferralLink = (businessId: string, businessReferralCode?: string | null): string => {
  const code = businessReferralCode || generateBusinessReferralCode(businessId);
  return `${window.location.origin}/register?ref=${code}`;
};

export const getReferralLink = (userId: string): string => {
  const code = generateReferralCode(userId);
  return `${window.location.origin}/register?ref=${code}`;
};

export const applyReferralCode = async (newUserId: string, referralCode: string): Promise<{ success: boolean; error?: string }> => {
  try {
    let referrerId: string | null = null;

    // Intentar decodificar como código de negocio (AGB...)
    const businessId = decodeBusinessReferralCode(referralCode);
    if (businessId) {
      const { data: biz } = await supabase
        .from('agendaya_businesses')
        .select('owner_id')
        .eq('id', businessId)
        .maybeSingle();
      if (biz) referrerId = biz.owner_id;
    } else {
      // Decodificar como código de usuario (AG...)
      referrerId = decodeReferralCode(referralCode);
    }

    if (!referrerId) return { success: false, error: 'Código de referido inválido' };
    const { error } = await supabase
      .from('agendaya_profiles')
      .update({ referred_by: referrerId })
      .eq('id', newUserId);
    if (error) throw error;
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) };
  }
};

export const getReferralCount = async (userId: string): Promise<{ success: boolean; count?: number; error?: string }> => {
  try {
    const { count, error } = await supabase
      .from('agendaya_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('referred_by', userId);
    if (error) throw error;
    return { success: true, count: count || 0 };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) };
  }
};

/**
 * Obtiene el conteo de referidos para una lista de dueños de negocio.
 * Usa RPC SECURITY DEFINER para evitar bloqueo de RLS.
 */
export const getReferralCounts = async (ownerIds: string[]): Promise<Record<string, number>> => {
  const ids = [...new Set(ownerIds.filter(Boolean))];
  if (ids.length === 0) return {};
  try {
    const { data, error } = await supabase.rpc('get_referral_badges', { p_owner_ids: ids });
    if (error) throw error;
    const map: Record<string, number> = {};
    for (const id of ids) map[id] = 0;
    for (const row of data as { owner_id: string; count: number }[]) {
      map[row.owner_id] = Number(row.count);
    }
    return map;
  } catch {
    return {};
  }
};

// --- Admin: Marketing Tools ---

export const getNewsletterSubscribers = async (): Promise<{ success: boolean; data?: { email: string; subscribed_at: string }[]; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('agendaya_newsletter_subscriptions')
      .select('email, subscribed_at')
      .order('subscribed_at', { ascending: false });
    if (error) throw error;
    return { success: true, data: data as { email: string; subscribed_at: string }[] };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) };
  }
};

export type GiftCodeWithRelations = Record<string, unknown> & {
  id: string;
  code: string;
  service_id: string;
  business_id: string;
  status: string;
  created_at: string;
  agendaya_services?: { name: string } | null;
  agendaya_businesses?: { name: string } | null;
};

export const getGiftCodes = async (): Promise<{ success: boolean; data?: GiftCodeWithRelations[]; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('agendaya_gift_codes')
      .select('*, agendaya_services(name), agendaya_businesses(name)')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    return { success: true, data: data as GiftCodeWithRelations[] };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) };
  }
};

export const getAdminLoyaltyStats = async (): Promise<{ success: boolean; data?: { total_entries: number; vip_count: number; frecuente_count: number; regular_count: number }; error?: string }> => {
  try {
    const { data, error } = await supabase.rpc('get_admin_loyalty_stats');
    if (error) throw error;
    const arr = data as Array<{ total_entries: number; vip_count: number; frecuente_count: number; regular_count: number }>;
    const stats = arr?.[0];
    return { success: true, data: stats || { total_entries: 0, vip_count: 0, frecuente_count: 0, regular_count: 0 } };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) };
  }
};

export type ReferredUser = {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
  role: string;
  plan: string;
};

export const getReferredUsers = async (userId: string): Promise<{ success: boolean; data?: ReferredUser[]; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('agendaya_profiles')
      .select('id, full_name, email, created_at, role, plan')
      .eq('referred_by', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return { success: true, data: data as ReferredUser[] };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) };
  }
};

export type ReferralStat = {
  referrer_id: string;
  referrer_name: string | null;
  referrer_email: string | null;
  count: number;
};

export const getTopReferrers = async (limit = 10): Promise<{ success: boolean; data?: ReferralStat[]; error?: string }> => {
  try {
    const { data, error } = await supabase
      .rpc('get_top_referrers', { p_limit: limit });

    if (error) throw error;
    return { success: true, data: data as ReferralStat[] };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) };
  }
};

export type LandingLeadType = 'business' | 'customer';

export type LandingLead = {
  type: LandingLeadType;
  city_slug: string;
  name: string;
  business_name?: string;
  whatsapp?: string;
  category?: string;
  message?: string;
};

export async function insertLandingLead(lead: LandingLead): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('agendaya_landing_leads').insert([lead]);
    if (error) throw error;

    // Fire-and-forget: notify via WhatsApp (Netlify Function)
    if (lead.type === 'business') {
      const cityName = lead.city_slug.charAt(0).toUpperCase() + lead.city_slug.slice(1);
      notifyLeadWhatsApp({
        name: lead.name,
        businessName: lead.business_name || '',
        whatsapp: lead.whatsapp,
        category: lead.category,
        cityName,
      });
    }

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) || 'Error al guardar contacto' };
  }
}

async function notifyLeadWhatsApp(payload: {
  name: string;
  businessName: string;
  whatsapp?: string;
  category?: string;
  cityName: string;
}): Promise<void> {
  try {
    await fetch(WHATSAPP_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    // Silent — the lead was already saved.
    // WhatsApp notification is best-effort.
  }
}

export const getAdminReferralStats = async (): Promise<{ success: boolean; data?: { total_referrals: number; unique_referrers: number }; error?: string }> => {
  try {
    const { data, error } = await supabase
      .rpc('get_admin_referral_stats');

    if (error) throw error;
    const stats = (data as { total_referrals: number; unique_referrers: number }[])?.[0];
    return { success: true, data: stats || { total_referrals: 0, unique_referrers: 0 } };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) };
  }
};
