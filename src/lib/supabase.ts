import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase URL or Anon Key. Please set them in your .env file.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Re-export auth functions from the api/auth module for backward compatibility
export { signUp, signIn, signOut, resetPassword, updatePassword, signInWithProvider } from './api/auth';

// User profile types
export interface UserProfile {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  role: string;
  plan: string;
  is_business: boolean;
  created_at: string;
  updated_at: string;
  business_id?: string;
  avatar_url?: string;
  items_per_page?: number;
  referred_by?: string;
}
