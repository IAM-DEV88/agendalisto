import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase URL or Anon Key. Please set them in your .env file.');
}

// Configuración simple pero robusta para Supabase
const supabaseOptions = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  // Enable realtime subscriptions (default settings)
  // Remove the eventsPerSecond limit to allow live updates
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      Accept: 'application/json'
    }
  }
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, supabaseOptions);

// Escuchar cambios de autenticación de manera simple
supabase.auth.onAuthStateChange(() => {
});

// Auth functions simplificadas
export const signUp = async (email: string, password: string) => {
  try {
    const response = await supabase.auth.signUp({
      email,
      password,
      options: { data: { email } }
    }) as any;
    
    if (response.error) {
    }
    
    return response;
  } catch (err) {
    return { error: err, data: null };
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    const response = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    }) as any;
    
    return response;
  } catch (err) {
    return { error: err, data: null };
  }
};

export const signOut = async () => {
  try {
    return await supabase.auth.signOut() as any;
  } catch (err) {
    return { error: err, data: { session: null } };
  }
};

export const resetPassword = async (email: string) => {
  try {
    return await supabase.auth.resetPasswordForEmail(email) as any;
  } catch (err) {
    return { error: err, data: null };
  }
};

export const updatePassword = async (newPassword: string) => {
  try {
    return await supabase.auth.updateUser({ password: newPassword }) as any;
  } catch (err) {
    return { error: err, data: { user: null } };
  }
};

// User profile types
export interface UserProfile {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  is_business: boolean;
  created_at: string;
  updated_at: string;
  business_id?: string;
  avatar_url?: string;
  items_per_page?: number;
} 
