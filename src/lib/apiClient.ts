import { supabase } from './supabase';
import { UserProfile } from './supabase';
import { 
  Business, 
  BusinessConfig, 
  BusinessHours, 
  Service,
  Appointment,
  Review
} from './api';

// Generic API response type for consistency
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Client for consistent API calls
export class ApiClient {
  // Business endpoints
  static async getBusinessById(id: string): Promise<ApiResponse<Business>> {
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

  static async getUserBusinesses(userId: string): Promise<ApiResponse<Business[]>> {
    try {
      const { data, error } = await supabase
        .from('agendaya_businesses')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data: data as Business[] };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error fetching businesses' };
    }
  }

  static async setActiveBusiness(userId: string, businessId: string): Promise<ApiResponse<null>> {
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

  static async getUserBusiness(userId: string): Promise<ApiResponse<Business | null>> {
    try {
      const { data, error } = await supabase
        .from('agendaya_businesses')
        .select('*')
        .eq('owner_id', userId)
        .maybeSingle();
        
      if (error) throw error;
      return { success: true, data: data as Business | null };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error fetching business' };
    }
  }

  static async updateBusiness(id: string, updates: Partial<Business>): Promise<ApiResponse<Business>> {
    try {
      const { data, error } = await supabase
        .from('agendaya_businesses')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return { success: true, data: data as Business };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error updating business' };
    }
  }

  // Config endpoints
  static async getBusinessConfig(businessId: string): Promise<ApiResponse<BusinessConfig>> {
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
        // No config found, return default
        if (error.code === 'PGRST116') {
          return { success: true, data: defaultConfig };
        }
        throw error;
      }
      
      return { success: true, data: data as BusinessConfig };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error fetching business config' };
    }
  }

  static async updateBusinessConfig(businessId: string, config: BusinessConfig): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase
        .from('agendaya_business_config')
        .upsert({
          business_id: businessId,
          ...config,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error updating business config' };
    }
  }

  // Hours endpoints
  static async getBusinessHours(businessId: string): Promise<ApiResponse<BusinessHours[]>> {
    try {
      const { data, error } = await supabase
        .from('agendaya_business_hours')
        .select('*')
        .eq('business_id', businessId);
        
      if (error) throw error;
      return { success: true, data: data as BusinessHours[] };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error fetching business hours' };
    }
  }

  static async updateBusinessHours(hours: Omit<BusinessHours, 'id'>[]): Promise<ApiResponse<BusinessHours[]>> {
    try {
      const businessId = hours[0]?.business_id;
      if (!businessId) throw new Error('Business ID is required');
      
      // Delete existing hours
      await supabase
        .from('agendaya_business_hours')
        .delete()
        .eq('business_id', businessId);
      
      // Insert new hours
      const { data, error } = await supabase
        .from('agendaya_business_hours')
        .insert(hours)
        .select();
        
      if (error) throw error;
      return { success: true, data: data as BusinessHours[] };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error updating business hours' };
    }
  }

  // Service endpoints
  static async getBusinessServices(businessId: string): Promise<ApiResponse<Service[]>> {
    try {
      const { data, error } = await supabase
        .from('agendaya_services')
        .select('*')
        .eq('business_id', businessId)
        .order('name');
        
      if (error) throw error;
      return { success: true, data: data as Service[] };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error fetching business services' };
    }
  }

  static async createBusinessService(service: Omit<Service, 'id' | 'likes_count' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Service>> {
    try {
      const { data, error } = await supabase
        .from('agendaya_services')
        .insert({
          ...service, 
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (error) throw error;
      return { success: true, data: data as Service };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error creating service' };
    }
  }

  static async updateBusinessService(id: string, updates: Partial<Service>): Promise<ApiResponse<Service>> {
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
      return { success: true, data: data as Service };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error updating service' };
    }
  }

  static async deleteBusinessService(id: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase
        .from('agendaya_services')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error deleting service' };
    }
  }

  // Clients endpoints
  static async getBusinessClients(businessId: string): Promise<ApiResponse<UserProfile[]>> {
    try {
      // Get unique user IDs from appointments
      const { data: appointments, error: apptError } = await supabase
        .from('agendaya_appointments')
        .select('user_id')
        .eq('business_id', businessId);
        
      if (apptError) throw apptError;
      
      const userIds = Array.from(new Set((appointments as { user_id: string }[]).map(a => a.user_id)));
      if (!userIds.length) return { success: true, data: [] };
      
      // Get profiles for these users
      const { data: profiles, error: profilesError } = await supabase
        .from('agendaya_profiles')
        .select('*')
        .in('id', userIds);
        
      if (profilesError) throw profilesError;
      return { success: true, data: profiles as UserProfile[] };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error fetching business clients' };
    }
  }

  // Appointment endpoints
  static async getBusinessAppointments(businessId: string): Promise<ApiResponse<Appointment[]>> {
    try {
      const { data, error } = await supabase
        .from('agendaya_appointments')
        .select(`*, profiles:agendaya_profiles (full_name, phone), services:agendaya_services (name, duration, price)`) 
        .eq('business_id', businessId)
        .order('start_time', { ascending: true });
        
      if (error) throw error;
      return { success: true, data: data as Appointment[] };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error fetching business appointments' };
    }
  }

  static async updateAppointmentStatus(id: string, status: Appointment['status']): Promise<ApiResponse<Appointment>> {
    try {
      const { data, error } = await supabase
        .from('agendaya_appointments')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      return { success: true, data: data as Appointment };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error updating appointment status' };
    }
  }

  // User Profile endpoints
  static async getUserProfile(userId: string): Promise<ApiResponse<UserProfile>> {
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

  static async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
    try {
      const { data, error } = await supabase
        .from('agendaya_profiles')
        .update({ 
          ...updates, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', userId)
        .select()
        .single();
        
      if (error) throw error;
      return { success: true, data: data as UserProfile };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error updating user profile' };
    }
  }

  // UI Config endpoints
  static async saveItemsPerPage(userId: string, itemsPerPage: number): Promise<ApiResponse<null>> {
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

  // Reviews management
  static async getBusinessReviews(businessId: string): Promise<ApiResponse<Review[]>> {
    try {
      const { data, error } = await supabase
        .from('agendaya_reviews')
        .select('*')
        .eq('business_id', businessId)
        .eq('status', 'approved');
        
      if (error) throw error;
      return { success: true, data: data as Review[] };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error fetching business reviews' };
    }
  }

  static async createBusinessReview(appointmentId: string, businessId: string, userId: string, rating: number, comment: string, beforeImage?: string, afterImage?: string): Promise<ApiResponse<Review>> {
    try {
      // Verificar si ya existe una reseña para esta cita
      const { data: existingReview, error: checkError } = await supabase
        .from('agendaya_reviews')
        .select('id')
        .eq('appointment_id', appointmentId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingReview) {
        return { 
          success: false, 
          error: 'Esta cita ya tiene una reseña' 
        };
      }

      const { data, error } = await supabase
        .from('agendaya_reviews')
        .insert({
          appointment_id: appointmentId,
          business_id: businessId,
          user_id: userId,
          rating,
          comment,
          status: 'pending',
          before_image_url: beforeImage || null,
          after_image_url: afterImage || null,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (error) throw error;
      return { success: true, data: data as Review };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error creating business review' };
    }
  }

  // ─── Moderation methods ───

  static async getPendingReviews(): Promise<ApiResponse<Review[]>> {
    try {
      const { data, error } = await supabase
        .from('agendaya_reviews')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return { success: true, data: data as Review[] };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error fetching pending reviews' };
    }
  }

  static async approveReview(reviewId: string): Promise<ApiResponse<undefined>> {
    try {
      const { error } = await supabase
        .from('agendaya_reviews')
        .update({ status: 'approved' })
        .eq('id', reviewId);
      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error approving review' };
    }
  }

  static async rejectReview(reviewId: string): Promise<ApiResponse<undefined>> {
    try {
      const { error } = await supabase
        .from('agendaya_reviews')
        .update({ status: 'rejected' })
        .eq('id', reviewId);
      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error rejecting review' };
    }
  }
} 