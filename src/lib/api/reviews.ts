import { supabase } from '../supabase';
import { getErrorMessage } from '../api-helpers';
import type { Review } from '../../types/appointment';

export type { Review };

// ─── Reviews ───

export async function getBusinessReviews(businessId: string): Promise<{ success: boolean; data: Review[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('agendaya_reviews')
      .select(`
        id, rating, comment, created_at, appointment_id, business_id, user_id, status,
        agendaya_appointments (
          agendaya_services ( name )
        )
      `)
      .eq('business_id', businessId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });
    if (error) throw error;
    const flattened = (data as any[]).map(item => ({
      ...item,
      service_name: item.agendaya_appointments?.agendaya_services?.name ?? null,
    }));
    return { success: true, data: flattened as Review[] };
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

// ─── Review Moderation (admin/moderator) ───

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
        : { data: [] as any[] },
      businessIds.length > 0
        ? supabase.from('agendaya_businesses').select('id, name').in('id', businessIds)
        : { data: [] as any[] },
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
