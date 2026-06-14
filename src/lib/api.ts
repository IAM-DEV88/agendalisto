import { supabase } from './supabase';
import { UserProfile } from './supabase';
import { Appointment, AppointmentStatus, Review, GuestInfo } from '../types/appointment';
import { DEFAULT_BUSINESS_CONFIG } from './defaults';

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
  tiempo_minimo_cancelacion: number;
  notificaciones_email: boolean;
  notificaciones_whatsapp: boolean;
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

export const getBusiness = async (id: string) => {
  const { data, error } = await supabase
    .from('agendaya_businesses')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data as Business;
};

// API functions for business services
export const getBusinessServices = async (businessId: string) => {
  try {
    const { data, error } = await supabase
      .from('agendaya_services')
      .select('*')
      .eq('business_id', businessId)
      .order('name');

    if (error) throw error;
    return { success: true, data: data as Service[] };
  } catch (err: any) {
    return { success: false, error: err.message };
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
  } catch (err: any) {
    return { success: false, error: err.message || 'Error fetching business' };
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
  } catch (err: any) {
    return { success: false, error: err.message || 'Error switching business' };
  }
}

export async function getUserProfile(userId: string): Promise<{ success: boolean; data?: UserProfile; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('agendaya_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return { success: true, data: data as UserProfile };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error fetching user profile' };
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
  } catch (err: any) {
    return { success: false, error: err.message || 'Error saving items per page' };
  }
}

// API functions for business hours
export const getBusinessHours = async (businessId: string) => {
  try {
    const { data, error } = await supabase
      .from('agendaya_business_hours')
      .select('*')
      .eq('business_id', businessId);
    if (error) throw error;
    return data as BusinessHours[];
  } catch (error: any) {
    throw new Error(error.message || 'Error al cargar horarios del negocio');
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
          price
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
    return { success: true, data: data as Appointment[], error: null };
  } catch (err: any) {
    return { success: false, data: null, error: err.message || 'Error al cargar citas' };
  }
}

export async function getBusinessAppointments(businessId: string) {
  try {
    const { data, error } = await supabase
      .from('agendaya_appointments')
      .select('*')
      .eq('business_id', businessId)
      .order('start_time', { ascending: true });
    if (error) throw error;
    const appointments = (data || []) as Appointment[];

    if (appointments.length === 0) {
      return { success: true, data: appointments, error: null };
    }

    const userIds = [...new Set(appointments.map(a => a.user_id).filter(Boolean))];
    const serviceIds = [...new Set(appointments.map(a => a.service_id).filter(Boolean))];

    const [profilesRes, servicesRes] = await Promise.all([
      userIds.length > 0
        ? supabase.from('agendaya_profiles').select('id, full_name, phone').in('id', userIds)
        : { data: [] },
      serviceIds.length > 0
        ? supabase.from('agendaya_services').select('id, name, duration, price').in('id', serviceIds)
        : { data: [] },
    ]);

    const profileMap = new Map((profilesRes.data || []).map((p: any) => [p.id, p]));
    const serviceMap = new Map((servicesRes.data || []).map((s: any) => [s.id, s]));

    const enriched = appointments.map(a => ({
      ...a,
      profiles: profileMap.get(a.user_id) || null,
      services: serviceMap.get(a.service_id) || null,
    }));

    return { success: true, data: enriched as Appointment[], error: null };
  } catch (err: any) {
    console.error('[getBusinessAppointments] Error:', err);
    return { success: false, data: null, error: err.message || 'Error al cargar citas del negocio' };
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
  } catch (err: any) {
    return { success: false, error: err.message };
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
  } catch (err: any) {
    return { success: false, error: err.message };
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
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al validar código' };
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
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

export const createAppointment = async (appointment: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('agendaya_appointments')
    .insert(appointment)
    .select()
    .single();
  
  if (error) throw error;
  return data;
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
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const cancelAppointment = async (id: string, reason?: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('agendaya_appointments')
      .update({ status: 'cancelled', cancel_reason: reason || null })
      .eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

export const rescheduleAppointment = async (id: string, startTime: string, endTime: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('agendaya_appointments')
      .update({ start_time: startTime, end_time: endTime, status: 'pending' })
      .eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
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
  } catch (err: any) {
    return { success: false, data: null, error: err.message || 'Error al obtener clientes del negocio' };
  }
}

// API functions for business management
export const createBusiness = async (business: Omit<Business, 'id' | 'plan' | 'plan_score' | 'likes_count' | 'created_at' | 'updated_at'>) => {
  try {
    const { data, error } = await supabase
      .from('agendaya_businesses')
      .insert([{
        ...business,
        plan: undefined,
        plan_score: undefined,
        likes_count: undefined,
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('[createBusiness] Supabase error:', error);
      throw error;
    }
    return { success: true, business: data as Business };
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

    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return !!data;
  } catch (error) {
    console.error('Error checking like status:', error);
    return false;
  }
};

export const toggleLike = async (userId: string, targetId: string, type: 'business' | 'service') => {
  try {
    const isLiked = await checkIfLiked(userId, targetId, type);
    
    if (isLiked) {
      // Remove like
      const query = supabase
        .from('agendaya_user_likes')
        .delete()
        .eq('user_id', userId);
      
      if (type === 'business') {
        query.eq('business_id', targetId);
      } else {
        query.eq('service_id', targetId);
      }
      
      const { error } = await query;
      if (error) throw error;
      return { success: true, action: 'removed' };
    } else {
      // Add like
      const payload: any = { user_id: userId };
      if (type === 'business') {
        payload.business_id = targetId;
      } else {
        payload.service_id = targetId;
      }
      
      const { error } = await supabase
        .from('agendaya_user_likes')
        .insert([payload]);
      
      if (error) throw error;
      return { success: true, action: 'added' };
    }
  } catch (error: any) {
    console.error('Error toggling like:', error);
    return { success: false, error: error.message };
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
  } catch (error: any) {
    console.error('[getUserFavorites] Error:', error);
    return { success: false, error: error.message };
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
  } catch (error: any) {
    console.error('[getUserFavoriteServices] Error:', error);
    return { success: false, error: error.message };
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
  } catch (error: any) {
    console.error('[getUserFavoriteBlogPosts] Error:', error);
    return { success: false, error: error.message };
  }
};

// API functions for business hours
export const setBusinessHours = async (hours: Omit<BusinessHours, 'id'>[]) => {
  // First remove any existing hours for this business
  const businessId = hours[0]?.business_id;
  if (!businessId) throw new Error('Business ID is required');
  
  await supabase
    .from('agendaya_business_hours')
    .delete()
    .eq('business_id', businessId);
  
  // Then insert the new hours
  const { data, error } = await supabase
    .from('agendaya_business_hours')
    .insert(hours)
    .select();
  
  if (error) throw error;
  return data;
};

// Helper para Promise con timeout
function withTimeout<T>(promise: Promise<T>, ms: number, timeoutError = 'Operación excedió el tiempo límite'): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(new Error(timeoutError));
    }, ms);
  });
  return Promise.race([promise, timeout]);
}

// Define la estructura esperada de la respuesta de Supabase para .single()
interface SingleResponse<T> {
  data: T | null;
  error: any | null; // Podrías usar PostgrestError si está disponible
}

export const obtenerPerfilUsuario = async (userId: string): Promise<{ success: boolean; perfil: UserProfile | null; error: string | null; }> => {
  try {
    if (!userId) {
      return { success: false, perfil: null, error: 'ID de usuario no proporcionado' };
    }


    // Envolver la llamada async de Supabase en una Promise explícita
    const supabaseQueryPromise = new Promise<SingleResponse<UserProfile>>(async (resolve, reject) => {
      try {
        // Ejecutar la consulta dentro del try/catch de la Promise
        const response = await supabase
          .from('agendaya_profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        // Resolvemos con la estructura esperada
        resolve({ data: response.data as UserProfile | null, error: response.error });
        
      } catch (queryError) {
        // Rechazamos si la consulta misma lanza una excepción
        reject(queryError);
      }
    });

    // Aplicar timeout a la promesa envuelta
    const { data, error } = await withTimeout(supabaseQueryPromise, 1000, 'Timeout al obtener perfil de usuario');


    const perfilNoEncontrado = error && error.code === 'PGRST116';

    if (error && !perfilNoEncontrado) {
      const errorMessage = error.message || 'Error desconocido';
      if (errorMessage === 'Timeout al obtener perfil de usuario') {
      } else {
      }
      return { success: false, perfil: null, error: errorMessage };
    }

    if (data && !perfilNoEncontrado) {
      // Backfill business_id from agendaya_businesses if profile has it null
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
      // Si el perfil existe pero es visitor, promover a client.
      // updateProfileRole puede fallar si el RPC no existe en DB;
      // igual se actualiza en memoria para que el usuario acceda.
      if (data.role === 'visitor') {
        try { await updateProfileRole(userId, 'client'); } catch {}
        data.role = 'client';
      }
      return { success: true, perfil: data, error: null };
    }

    // PGRST116 o data null → Fallback: late-registration vía ensure_user_app
    try {
      const { error: rpcError } = await supabase.rpc('ensure_user_app', {
        p_user_id: userId,
        p_app_slug: 'agendaya',
      });
      if (rpcError) throw rpcError;

      await new Promise(resolve => setTimeout(resolve, 500));

      const retryResponse = await supabase
        .from('agendaya_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (retryResponse.data) {
        // Usuario proveniente de otra app → ensure_user_app crea role='visitor'.
        // Auto-promover a client para que pueda acceder a /dashboard y /business/register.
        if (retryResponse.data.role === 'visitor') {
          await updateProfileRole(userId, 'client');
          retryResponse.data.role = 'client';
        }
        return { success: true, perfil: retryResponse.data as UserProfile, error: null };
      }
    } catch {
      // Fallback silencioso — si no se pudo recuperar, retornar error original
    }

    return { success: false, perfil: null, error: 'Perfil no encontrado' };

  } catch (err: any) {
    return {
      success: false,
      perfil: null,
      error: err.message || 'Error desconocido'
    };
  }
};

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>) => {
  const { data, error } = await supabase
    .from('agendaya_profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
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
  } catch (err: any) {
    return { success: false, error: err.message || 'Error desconocido' };
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
  } catch (err: any) {
    return { success: false, error: err.message || 'Error desconocido' };
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
      return { success: false, error: error.message };
    }
    // Single row returned
    return { success: true, config: data as BusinessConfig };
  } catch (err: any) {
    return { success: false, error: err.message };
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
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
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
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al crear el servicio' };
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
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al actualizar el servicio' };
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
  } catch (error: any) {
    console.error('Error al eliminar servicio:', error);
    return { success: false, error: error.message || 'Error al eliminar servicio' };
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
  } catch (error: any) {
    return { success: false, error: error.message };
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
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al obtener el servicio' };
  }
}

// API functions for reviews
export async function getBusinessReviews(businessId: string): Promise<{ success: boolean; data: Review[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('agendaya_reviews')
      .select('*')
      .eq('business_id', businessId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return { success: true, data: data as Review[] };
  } catch (err: any) {
    return { success: false, data: [], error: err.message };
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
  } catch (err: any) {
    return { success: false, error: err.message };
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

    const profileMap = new Map((profilesRes.data || []).map((p: any) => [p.id, p]));
    const businessMap = new Map((businessesRes.data || []).map((b: any) => [b.id, b]));

    const enriched = reviews.map(r => ({
      ...r,
      profiles: profileMap.get(r.user_id) || null,
      businesses: businessMap.get(r.business_id) || null,
    }));

    return { success: true, data: enriched as any[] };
  } catch (err: any) {
    console.error('[getPendingReviews] Error:', err);
    return { success: false, data: [], error: err.message };
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
  } catch (err: any) {
    return { success: false, error: err.message };
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
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getReviewStats(): Promise<{ success: boolean; data?: { pending: number; approved: number; rejected: number; total: number }; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('agendaya_reviews')
      .select('status');
    if (error) throw error;
    const counts = { pending: 0, approved: 0, rejected: 0, total: 0 };
    (data as any[] || []).forEach(r => {
      counts.total++;
      if (r.status === 'pending') counts.pending++;
      else if (r.status === 'approved') counts.approved++;
      else if (r.status === 'rejected') counts.rejected++;
    });
    return { success: true, data: counts };
  } catch (err: any) {
    return { success: false, error: err.message };
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
  } catch (err: any) {
    return { success: false, error: err.message };
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
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Type for business categories
export type BusinessCategory = {
  id: string;
  name: string;
  description: string | null;
};

// Fetch all business categories
export async function getBusinessCategories(): Promise<{ success: boolean; data: BusinessCategory[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('agendaya_business_categories')
      .select('*');
    if (error) throw error;
    return { success: true, data: data as BusinessCategory[], error: null };
  } catch (err: any) {
    return { success: false, data: null, error: err.message || 'Error fetching categories' };
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
  } catch (err: any) {
    return { success: false, error: err.message };
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
  } catch (err: any) {
    return { success: false, error: err.message };
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
  } catch (err: any) {
    return { success: false, error: err.message };
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
  } catch (err: any) {
    return { success: false, error: err.message };
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
  } catch (err: any) {
    return { success: false, error: err.message };
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
  } catch (err: any) {
    return { success: false, error: err.message };
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
  } catch (err: any) {
    return { success: false, error: err.message };
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
  } catch (err: any) {
    return { success: false, error: err.message };
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
  } catch (err: any) {
    return { success: false, error: err.message };
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
  } catch (err: any) {
    return { success: false, error: err.message };
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
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

export const toggleBlogLike = async (userId: string, targetId: string, type: 'post' | 'comment'): Promise<{ success: boolean; action?: 'added' | 'removed'; error?: string }> => {
  try {
    const query = supabase
      .from('agendaya_blog_likes')
      .select('id')
      .eq('user_id', userId);
    
    if (type === 'post') query.eq('post_id', targetId);
    else query.eq('comment_id', targetId);

    const { data: existingLike } = await query.maybeSingle();

    if (existingLike) {
      const { error } = await supabase
        .from('agendaya_blog_likes')
        .delete()
        .eq('id', existingLike.id);
      
      if (error) throw error;
      return { success: true, action: 'removed' };
    } else {
      const payload: any = { user_id: userId };
      if (type === 'post') payload.post_id = targetId;
      else payload.comment_id = targetId;

      const { error } = await supabase
        .from('agendaya_blog_likes')
        .insert([payload]);
      
      if (error) throw error;
      return { success: true, action: 'added' };
    }
  } catch (err: any) {
    return { success: false, error: err.message };
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
  } catch (err: any) {
    return { success: false, error: err.message };
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
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

export const getTopMilestones = async (limit = 3): Promise<{ success: boolean; data?: Milestone[]; error?: string }> => {
  try {
    const { data, error } = await supabase.from('agendaya_milestones').select('*').order('current_amount', { ascending: false }).limit(limit);
    if (error) throw error;
    return { success: true, data: (data as Milestone[]) || [] };
  } catch (err: any) {
    return { success: false, error: err.message };
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
  } catch (err: any) {
    return { success: false, error: err.message };
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
  } catch (err: any) {
    return { success: false, error: err.message };
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
  } catch (err: any) {
    return { success: false, data: [], total: 0, error: err.message };
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
  } catch (err: any) {
    return { success: false, error: err.message };
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
  } catch (err: any) {
    return { success: false, error: err.message };
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
  } catch (err: any) {
    return { success: false, data: [], total: 0, error: err.message };
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
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export const contributeToMilestone = async (id: string, amount: number): Promise<{ success: boolean; data?: Milestone; error?: string }> => {
  try {
    // Get existing current_amount
    const { data: existing, error: fetchError } = await supabase.from('agendaya_milestones').select('current_amount').eq('id', id).single();
    if (fetchError || !existing) throw fetchError || new Error('Milestone not found');
    const newAmount = Number((existing as any).current_amount) + amount;
    const { data, error } = await supabase.from('agendaya_milestones').update({ current_amount: newAmount }).eq('id', id).single();
    if (error) throw error;
    return { success: true, data: data as Milestone };
  } catch (err: any) {
    return { success: false, error: err.message };
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
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

// --- Referral System ---

const REFERRAL_PREFIX = 'AG';

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

export const getReferralLink = (userId: string): string => {
  const code = generateReferralCode(userId);
  return `${window.location.origin}/register?ref=${code}`;
};

export const applyReferralCode = async (newUserId: string, referralCode: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const referrerId = decodeReferralCode(referralCode);
    if (!referrerId) return { success: false, error: 'Código de referido inválido' };
    const { error } = await supabase
      .from('agendaya_profiles')
      .update({ referred_by: referrerId })
      .eq('id', newUserId);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
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
  } catch (err: any) {
    return { success: false, error: err.message };
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
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

export const getGiftCodes = async (): Promise<{ success: boolean; data?: any[]; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('agendaya_gift_codes')
      .select('*, agendaya_services(name), agendaya_businesses(name)')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    return { success: true, data: data as any[] };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

export const getAdminLoyaltyStats = async (): Promise<{ success: boolean; data?: { total_entries: number; vip_count: number; frecuente_count: number; regular_count: number }; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('agendaya_loyalty')
      .select('loyalty_level');
    if (error) throw error;

    const rows = data as { loyalty_level: string }[];
    return {
      success: true,
      data: {
        total_entries: rows.length,
        vip_count: rows.filter(r => r.loyalty_level === 'vip').length,
        frecuente_count: rows.filter(r => r.loyalty_level === 'frecuente').length,
        regular_count: rows.filter(r => r.loyalty_level === 'regular').length,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message };
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
  } catch (err: any) {
    return { success: false, error: err.message };
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
      .from('agendaya_profiles')
      .select('referred_by')
      .not('referred_by', 'is', null);
    if (error) throw error;

    const countMap = new Map<string, number>();
    (data as { referred_by: string }[]).forEach(row => {
      countMap.set(row.referred_by, (countMap.get(row.referred_by) || 0) + 1);
    });

    const referrerIds = Array.from(countMap.keys());
    if (referrerIds.length === 0) return { success: true, data: [] };

    const { data: profiles, error: profilesError } = await supabase
      .from('agendaya_profiles')
      .select('id, full_name, email')
      .in('id', referrerIds);
    if (profilesError) throw profilesError;

    const profileMap = new Map((profiles as { id: string; full_name: string | null; email: string | null }[]).map(p => [p.id, p]));

    const stats: ReferralStat[] = referrerIds
      .map(id => ({
        referrer_id: id,
        referrer_name: profileMap.get(id)?.full_name || null,
        referrer_email: profileMap.get(id)?.email || null,
        count: countMap.get(id) || 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return { success: true, data: stats };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

export const getAdminReferralStats = async (): Promise<{ success: boolean; data?: { total_referrals: number; unique_referrers: number }; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('agendaya_profiles')
      .select('referred_by')
      .not('referred_by', 'is', null);
    if (error) throw error;

    const referrals = data as { referred_by: string }[];
    const uniqueReferrers = new Set(referrals.map(r => r.referred_by));

    return {
      success: true,
      data: {
        total_referrals: referrals.length,
        unique_referrers: uniqueReferrers.size,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};
