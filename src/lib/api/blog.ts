import { supabase } from '../supabase';
import { getErrorMessage } from '../api-helpers';

// ─── Types ───

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

export type BlogPostFavoriteItem = {
  like_id: string;
  post_id: string;
  title: string;
  excerpt: string | null;
  image_url: string | null;
  likes_count: number;
  created_at: string;
};

// ─── Blog Posts ───

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
      comment_count: (data as any).blog_comments?.[0]?.count || 0
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
      comment_count: (p as any).blog_comments?.[0]?.count || 0
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
      comment_count: (p as any).blog_comments?.[0]?.count || 0
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
      comment_count: (data as any).blog_comments?.[0]?.count || 0
    };

    return { success: true, data: post as BlogPost };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) };
  }
};

// ─── Blog Admin CRUD ───

export const adminGetAllPosts = async (): Promise<{ success: boolean; data?: BlogPost[]; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('agendaya_blog_posts')
      .select('*, blog_comments:agendaya_blog_comments(count)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    const posts = (data || []).map(p => ({
      ...p,
      comment_count: (p as any).blog_comments?.[0]?.count || 0
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

// ─── Blog Comments ───

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
