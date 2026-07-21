import { supabase, UserProfile } from '../supabase';
import { getErrorMessage } from '../api-helpers';

// ─── Types ───

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

export type ReferredUser = {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
  role: string;
  plan: string;
};

export type ReferralStat = {
  referrer_id: string;
  referrer_name: string | null;
  referrer_email: string | null;
  count: number;
};

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

// ─── Admin dashboard metrics (full) ───

export async function getAdminDashboardMetrics(): Promise<{ success: boolean; data?: DashboardMetrics; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('get_admin_dashboard_metrics');
    if (error) throw error;
    return { success: true, data: data as DashboardMetrics };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) };
  }
}

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

// ─── Admin: Marketing Tools ───

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

// ─── Admin: Referral Management ───

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
