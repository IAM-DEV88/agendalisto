import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { obtenerPerfilUsuario } from '../lib/api';
import type { UserProfile } from '../lib/supabase';

export function useAuthSession() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getSessionProfile = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { success, perfil, error: apiError } = await obtenerPerfilUsuario(session.user.id);
          if (success && perfil) {
            setUser(perfil);
          } else {
            setError(apiError || 'Error al cargar perfil');
          }
        } else {
          setUser(null);
        }
      } catch (err: any) {
        console.error('Error en getSessionProfile:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    getSessionProfile();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const { success, perfil, error: apiError } = await obtenerPerfilUsuario(session.user.id);
          if (success && perfil) setUser(perfil);
          else setError(apiError || 'Error al cargar perfil');
        } else {
          setUser(null);
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  return { user, loading, error };
} 