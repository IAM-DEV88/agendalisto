import { supabase, UserProfile } from './supabase';
import type { Appointment, AppointmentStatus, GuestInfo } from '../types/appointment';
import { getErrorMessage, validateUserProfileShape } from './api-helpers';
import { WHATSAPP_API_URL } from './config';
import type { BlogPostFavoriteItem } from './api/blog';

// Re-export types from appointment.ts
export type { Appointment, AppointmentStatus, GuestInfo };

// Re-export domain modules (extraídos para mejorar modularidad)
export { signUp, signIn, signOut, resetPassword, updatePassword, signInWithProvider } from './api/auth';
export {
  getBusinesses,
  recordBusinessVisit,
  getBusinessStats,
  getBusinessById,
  setActiveBusiness,
  getBusinessHours,
  setBusinessHours,
  createBusiness,
  updateBusiness,
  deleteBusiness,
  getUserBusinesses,
  getUserBusiness,
  getBusinessConfig,
  updateBusinessConfig,
  getBusinessBySlug,
  getBusinessCategories,
  getBusinessesList,
  adminUpdateBusiness,
} from './api/businesses';
export {
  getUserAppointments,
  getBusinessAppointments,
  createAppointment,
  updateAppointmentStatus,
  cancelAppointment,
  rescheduleAppointment,
} from './api/appointments';
export {
  getBusinessServices,
  getService,
  createBusinessService,
  updateBusinessService,
  deleteBusinessService,
} from './api/services';
export * from './api/reviews';
export * from './api/blog';
export * from './api/admin';

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
    // Validación runtime: asegurar que los datos tengan la estructura esperada
    if (!validateUserProfileShape(data as Record<string, unknown>)) {
      console.error('[obtenerPerfilUsuario] Datos de perfil inválidos de Supabase', data);
      return { success: false, perfil: null, error: 'Datos de perfil inválidos' };
    }

    if (!data.business_id) {
      try {
        const { data: biz } = await supabase
          .from('agendaya_businesses')
          .select('id')
          .eq('owner_id', userId)
          .maybeSingle();
        if (biz?.id) {
          data.business_id = biz.id;
          await supabase.from('agendaya_profiles').update({ business_id: biz.id }).eq('id', userId);
        }
      } catch {
        // Fallback silencioso si falla el backfill de business_id
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
      // Validación runtime también para el reintento
      if (!validateUserProfileShape(retryData as Record<string, unknown>)) {
        console.error('[obtenerPerfilUsuario] Datos de perfil inválidos tras reintento', retryData);
        return { success: false, perfil: null, error: 'Datos de perfil inválidos tras reintento' };
      }
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

// Type for business categories
export type BusinessCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
};

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

export type AdminBusiness = Business & {
  owner_name: string | null;
  owner_email: string | null;
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

