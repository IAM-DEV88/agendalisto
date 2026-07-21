import { supabase } from '../supabase';
import { getErrorMessage, validateBusinessShape } from '../api-helpers';
import { DEFAULT_BUSINESS_CONFIG } from '../defaults';
import type {
  Business,
  BusinessStats,
  BusinessConfig,
  BusinessHours,
  BusinessCategory,
  AdminBusiness,
} from '../api';

// ─── Business listing & search ───

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

// ─── Single business CRUD ───

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

// ─── User's businesses ───

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
    // Validación runtime: asegurar que el negocio tenga estructura esperada
    if (!validateBusinessShape(data as Record<string, unknown>)) {
      console.error('[getUserBusiness] Datos de negocio inválidos de Supabase', data);
      return { success: false, error: 'Datos del negocio inválidos' };
    }
    return { success: true, business: data as Business };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) || 'Error desconocido' };
  }
}

// ─── Business config ───

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

// ─── Business hours ───

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

// ─── Business by slug ───

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
    
    // Validación runtime: asegurar que el negocio tenga estructura esperada
    if (!validateBusinessShape(data as Record<string, unknown>)) {
      console.error('[getBusinessBySlug] Datos de negocio inválidos de Supabase', data);
      return { success: false, error: 'Datos del negocio inválidos' };
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

// ─── Business categories ───

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

// ─── Admin: business management ───

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
