import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase URL or Anon Key. Please set them in your .env file.');
}

// Solo opciones de auth; Supabase manejará internamente los timeouts
const supabaseOptions = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, supabaseOptions);

// Listen for authentication state changes to handle session expiration or disconnection
supabase.auth.onAuthStateChange((event, session) => {
  console.log(`[Auth] State changed: ${event}`, session);
  // If user explicitly signed out, log reason
  if (event === 'SIGNED_OUT') {
    console.warn(`User session closed (SIGNED_OUT)`);
  }
});

// Auth functions con manejo de errores mejorado
export const signUp = async (email: string, password: string) => {
  try {
    console.log('Intentando registrar usuario:', email);
    
    // Llamada directa sin timeout manual
    const response = await supabase.auth.signUp({
      email,
      password,
      options: { data: { email } }
    }) as any;
    
    // Si hay error, mostrar información detallada para depuración
    if (response.error) {
      console.error('Error en signUp:', {
        mensaje: response.error.message,
        código: response.error.status,
        detalles: response.error.name
      });
      
      // Transformar mensajes de error comunes a más amigables
      if (response.error.message.includes('Database error saving new user')) {
        console.error('Posible problema con triggers o restricciones en la base de datos');
        response.error.message = 'Error interno en la base de datos. Hay un problema con la configuración del servidor.';
      }
    } else {
      console.log('Registro exitoso:', response.data.user?.id);
    }
    
    return response;
  } catch (err) {
    console.error('Excepción no controlada en signUp:', err);
    throw new Error(`Error al registrar: ${err instanceof Error ? err.message : 'Error desconocido'}`);
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    console.log('Intentando iniciar sesión:', email);
    
    // Llamada directa sin timeout manual
    const response = await supabase.auth.signInWithPassword({ email, password }) as any;
    
    if (response.error) {
      console.error('Error en signIn:', {
        mensaje: response.error.message,
        código: response.error.status,
        detalles: response.error.name
      });
      
      if (response.error.status === 400) {
        console.error('Credenciales inválidas o cuenta no confirmada');
        response.error.message = 'El correo o contraseña son incorrectos, o la cuenta no ha sido confirmada.';
      }
    } else {
      console.log('Inicio de sesión exitoso:', response.data.user?.id);
    }
    
    return response;
  } catch (err) {
    console.error('Excepción no controlada en signIn:', err);
    throw new Error(`Error al iniciar sesión: ${err instanceof Error ? err.message : 'Error desconocido'}`);
  }
};

export const signOut = async () => {
  try {
    // Llamada directa sin timeout manual
    return await supabase.auth.signOut() as any;
  } catch (err) {
    console.error('Error al cerrar sesión:', err);
    return { error: err, data: { session: null } };
  }
};

export const resetPassword = async (email: string) => {
  try {
    // Llamada directa sin timeout manual
    return await supabase.auth.resetPasswordForEmail(email) as any;
  } catch (err) {
    console.error('Error al restablecer contraseña:', err);
    return { error: err, data: null };
  }
};

export const updatePassword = async (newPassword: string) => {
  try {
    // Llamada directa sin timeout manual
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