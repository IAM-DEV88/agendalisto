import { supabase } from '../supabase';
import { getErrorMessage } from '../api-helpers';
import type { Service } from '../api';

// ─── Services ───

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
