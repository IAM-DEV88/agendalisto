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
  created_at: string;
  updated_at: string;
  is_active: boolean;
  provider?: string;
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
const slugify = (str: string) => str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');

// API functions for businesses
export const getBusinesses = async (search?: string, _category?: string) => {
  let query = supabase.from('businesses').select('*');
  
  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }
  if (_category) {
    query = query.eq('category_id', _category);
  }
  
  // Note: Filter by category_id if provided
  
  const { data, error } = await query;
  
  if (error) throw error;
  // Add slug to each business object
  const businessesWithSlugs = (data as Business[]).map((b) => ({ ...b, slug: slugify(b.name) }));
  return businessesWithSlugs;
};

export const getBusiness = async (id: string) => {
  const { data, error } = await supabase
    .from('businesses')
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
      .from('services')
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
      .from('business_hours')
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
      .from('appointments')
      .select(`
        *,
        businesses (
          name,
          address
        ),
        services (
          name,
          duration,
          price
        ),
        review:reviews!appointment_id (
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
      .from('appointments')
      .select(`
        *, 
        profiles (
          full_name, 
          phone
        ), 
        services (
          name, 
          duration, 
          price
        ),
        review:reviews!appointment_id (
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
    .from('appointments')
    .insert(appointment)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateAppointmentStatus = async (id: string, status: AppointmentStatus) => {
  try {
    const { data, error } = await supabase
      .from('appointments')
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
      .from('appointments')
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
      .from('profiles')
      .select('*')
      .in('id', userIds);
    if (profilesError) throw profilesError;
    return { success: true, data: profiles as UserProfile[], error: null };
  } catch (err: any) {
    return { success: false, data: null, error: err.message || 'Error al obtener clientes del negocio' };
  }
}

// API functions for business management
export const createBusiness = async (business: Omit<Business, 'id' | 'created_at' | 'updated_at'>) => {
  try {
    // Exclude slug field from insert payload; it doesn't exist in the DB
    const { slug, ...payload } = business;
    const { data, error } = await supabase
      .from('businesses')
      .insert([{
        ...payload,
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    // Attach slug to the newly created business
    const businessWithSlug = { ...data, slug: slugify(data.name) } as Business;
    return { success: true, business: businessWithSlug };
  } catch (error) {
    return { success: false, error };
  }
};

export const updateBusiness = async (id: string, updates: Partial<Business>) => {
  const { data, error } = await supabase
    .from('businesses')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  // Attach slug to the updated business
  const updatedWithSlug = { ...data, slug: slugify(data.name) } as Business;
  return updatedWithSlug;
};

export const createService = async (service: Omit<Service, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('services')
    .insert(service)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateService = async (id: string, updates: Partial<Service>) => {
  const { data, error } = await supabase
    .from('services')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteService = async (id: string) => {
  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
};

// API functions for business hours
export const setBusinessHours = async (hours: Omit<BusinessHours, 'id'>[]) => {
  // First remove any existing hours for this business
  const businessId = hours[0]?.business_id;
  if (!businessId) throw new Error('Business ID is required');
  
  await supabase
    .from('business_hours')
    .delete()
    .eq('business_id', businessId);
  
  // Then insert the new hours
  const { data, error } = await supabase
    .from('business_hours')
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
          .from('profiles')
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


    if (error) {
      const errorMessage = error.message || 'Error desconocido';
      if (errorMessage === 'Timeout al obtener perfil de usuario') {
      } else {
      }

      if (error.code === 'PGRST116') {
        return { success: false, perfil: null, error: 'Perfil no encontrado' };
      }
      
      return { success: false, perfil: null, error: errorMessage };
    }

    if (data) {
      return { success: true, perfil: data, error: null };
    } else {
      return { success: false, perfil: null, error: 'Respuesta inesperada del servidor' };
    }

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
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export async function getUserBusiness(userId: string) {
  try {
    const { data, error } = await supabase
      .from('businesses')
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
    notificaciones_email: true,
    notificaciones_whatsapp: false
  };
  try {
    const { data, error } = await supabase
      .from('business_config')
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
      .from('business_config')
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
export const createBusinessService = async (service: Omit<Service, 'id' | 'created_at' | 'updated_at'>) => {
  try {
    const { data, error } = await supabase
      .from('services')
      .insert({
        ...service, 
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .single();

    if (error) throw error;
    return data;
  } catch (err: any) {
    throw err;
  }
};

export const updateBusinessService = async (id: string, updates: Partial<Service>) => {
  try {
    const { data, error } = await supabase
      .from('services')
      .update({ 
        ...updates, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err: any) {
    throw err;
  }
};

export const deleteBusinessService = async (id: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('services')
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
    // In a production environment, you would have a slug field in your table
    // For this implementation, we'll convert business names to slugs for comparison
    const { data, error } = await supabase
      .from('businesses')
      .select('*');
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      return { success: false, error: 'No businesses found' };
    }
    
    // Find the business by comparing slugs
    const business = data.find((business: Business) => slugify(business.name) === slug);
    
    if (!business) {
      return { success: false, error: 'Business not found' };
    }
    
    // Get business config
    const { success: configSuccess, config } = await getBusinessConfig(business.id);
    
    if (configSuccess && config) {
      business.config = config;
    }
    
    // Attach slug property
    business.slug = slug;
    return { success: true, business };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// API functions for reviews
export async function getBusinessReviews(businessId: string): Promise<{ success: boolean; data: Review[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('reviews')
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
      .from('reviews')
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
      .from('business_categories')
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
    const { data, error } = await supabase.from('milestones').select('*');
    if (error) throw error;
    return { success: true, data: (data as Milestone[]) || [] };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

export const getTopMilestones = async (limit = 3): Promise<{ success: boolean; data?: Milestone[]; error?: string }> => {
  try {
    const { data, error } = await supabase.from('milestones').select('*').order('current_amount', { ascending: false }).limit(limit);
    if (error) throw error;
    return { success: true, data: (data as Milestone[]) || [] };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

export const contributeToMilestone = async (id: string, amount: number): Promise<{ success: boolean; data?: Milestone; error?: string }> => {
  try {
    // Get existing current_amount
    const { data: existing, error: fetchError } = await supabase.from('milestones').select('current_amount').eq('id', id).single();
    if (fetchError || !existing) throw fetchError || new Error('Milestone not found');
    const newAmount = Number((existing as any).current_amount) + amount;
    const { data, error } = await supabase.from('milestones').update({ current_amount: newAmount }).eq('id', id).single();
    if (error) throw error;
    return { success: true, data: data as Milestone };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};
