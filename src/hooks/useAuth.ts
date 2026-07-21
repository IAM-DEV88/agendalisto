import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { obtenerPerfilUsuario } from '../lib/api';
import type { UserProfile } from '../lib/supabase';

export const useAuth = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        return obtenerPerfilUsuario(session.user.id).then(({ success, perfil, error: apiError }) => {
          if (success && perfil) setUser(perfil);
          else setError(apiError || 'Error al cargar perfil');
        });
      } else {
        setUser(null);
      }
    }).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }).finally(() => {
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setLoading(true);
        if (session?.user) {
          const { success, perfil, error: apiError } = await obtenerPerfilUsuario(session.user.id);
          if (success && perfil) setUser(perfil);
          else setError(apiError || 'Error al cargar perfil');
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  return { user, loading, error };
};
