import { supabase } from './supabase';
import { UserProfile } from './supabase';
import { Appointment, AppointmentStatus, Review } from '../types/appointment';

// Re-export types from appointment.ts
export type { Appointment, AppointmentStatus, Review };

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
  image_urls?: string[]; // Array of image URLs for the service gallery
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
export const getBusinesses = async (search?: string, _category?: string, location?: string) => {
  let query = supabase.from('agendaya_businesses').select('*');
  
  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }
  
  if (location) {
    query = query.ilike('address', `%${location}%`);
  }

  if (_category) {
    query = query.eq('category_id', _category);
  }

  query = query.order('plan_score', { ascending: false }).order('likes_count', { ascending: false }).order('created_at', { ascending: false });
  
  const { data, error } = await query;
  
  if (error) throw error;
  // Add slug to each business object
  const businessesWithSlugs = (data as Business[]).map((b) => ({ ...b, slug: slugify(b.name) }));
  return businessesWithSlugs;
};

export const getBusiness = async (id: string) => {
  const { data, error } = await supabase
    .from('agendaya_businesses')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  // Add slug to the business object
  return { ...data, slug: slugify(data.name) } as Business;
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
    return { success: false, error: err.message || 'Error al obtener servicios' };
  }
};

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
          business_id
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
      .select(`
        *, 
        profiles:agendaya_profiles (
          full_name, 
          phone
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
          business_id
        )
      `) 
      .eq('business_id', businessId)
      .order('start_time', { ascending: true });
    if (error) throw error;
    return { success: true, data: data as Appointment[], error: null };
  } catch (err: any) {
    return { success: false, data: null, error: err.message || 'Error al cargar citas del negocio' };
  }
}

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
    const cleanSlug = slugify(business.name);
    const { data, error } = await supabase
      .from('agendaya_businesses')
      .insert([{
        ...business,
        slug: cleanSlug,
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
    return { success: true, business: { ...data, slug: slugify(data.name) } as Business };
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
  // Attach slug to the updated business
  const updatedWithSlug = { ...data, slug: slugify(data.name) } as Business;
  return updatedWithSlug;
};

// --- Likes Functions ---
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
        slug: slugify(item.businesses.name),
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
    const businesses = (data || []).map(b => ({ ...b, slug: slugify(b.name) })) as Business[];
    return { success: true, businesses };
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
    const businessWithSlug = { ...data, slug: slugify(data.name) } as Business;
    return { success: true, business: businessWithSlug };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error desconocido' };
  }
}

// API functions for business config
export async function getBusinessConfig(businessId: string): Promise<{ success: boolean, config?: BusinessConfig, error?: string }> {
  // Default configuration if none exists
  const defaultConfig: BusinessConfig = {
    permitir_reservas_online: true,
    mostrar_precios: true,
    mostrar_telefono: true,
    mostrar_email: false,
    mostrar_redes_sociales: true,
    mostrar_direccion: true,
    requiere_confirmacion: false,
    tiempo_minimo_cancelacion: 48,
    notificaciones_email: false,
    notificaciones_whatsapp: false
  };
  try {
    const { data, error } = await supabase
      .from('agendaya_business_config')
      .select('*')
      .eq('business_id', businessId)
      .single();
    if (error) {
      // No config row: return default
      if (error.code === 'PGRST116') {
        return { success: true, config: defaultConfig };
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
      .select('*');
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      return { success: false, error: 'No businesses found' };
    }
    
    const business = data.find((business: Business) => slugify(business.name) === slug);
    
    if (!business) {
      return { success: false, error: 'Business not found' };
    }
    
    const { success: configSuccess, config } = await getBusinessConfig(business.id);
    
    if (configSuccess && config) {
      business.config = config;
    }
    
    business.slug = slug;
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
  comment: string
): Promise<{ success: boolean; data?: Review; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('agendaya_reviews')
      .insert([{ 
        appointment_id: appointmentId,
        business_id: businessId,
        user_id: userId,
        rating,
        comment,
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

export const getBlogPosts = async (page = 0, limit = 6): Promise<{ success: boolean; data?: BlogPost[]; error?: string; hasMore?: boolean }> => {
  try {
    const from = page * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('agendaya_blog_posts')
      .select('*, blog_comments:agendaya_blog_comments(count)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);
    
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
