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
  // Disable realtime to avoid connection issues
  realtime: {
    // Deshabilitar completamente si no se usa para evitar problemas
    params: {
      eventsPerSecond: 0
    }
  }
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, supabaseOptions);

// Escuchar cambios de autenticación de manera simple
supabase.auth.onAuthStateChange((event, session) => {
  console.log(`[Auth] State changed: ${event}`);
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
      console.error('Error en signUp:', response.error.message);
    }
    
    return response;
  } catch (err) {
    console.error('Error en signUp:', err);
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
    console.error('Error en signIn:', err);
    return { error: err, data: null };
  }
};

export const signOut = async () => {
  try {
    return await supabase.auth.signOut() as any;
  } catch (err) {
    console.error('Error al cerrar sesión:', err);
    return { error: err, data: { session: null } };
  }
};

export const resetPassword = async (email: string) => {
  try {
    return await supabase.auth.resetPasswordForEmail(email) as any;
  } catch (err) {
    console.error('Error al restablecer contraseña:', err);
    return { error: err, data: null };
  }
};

export const updatePassword = async (newPassword: string) => {
  try {
    return await supabase.auth.updateUser({ password: newPassword }) as any;
  } catch (err) {
    console.error('Error al actualizar contraseña:', err);
    return { error: err, data: { user: null } };
  }
};

// User profile types
export type UserProfile = {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  is_business: boolean;
  created_at: string;
  updated_at: string;
  business_id?: string;
  avatar_url?: string;
}; 