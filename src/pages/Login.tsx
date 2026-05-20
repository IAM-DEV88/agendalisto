import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signIn } from '../lib/supabase';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { setUser, setUserProfile } from '../store/userSlice';
import { obtenerPerfilUsuario } from '../lib/api';
import { notifySuccess, notifyError } from '../lib/toast';

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      
      const { data, error } = await signIn(email, password);
      
      if (error) {
        let errorMsg = '';
        if (error.message.includes('Invalid login credentials')) {
          errorMsg = 'Credenciales incorrectas. Por favor verifica tu correo y contraseña.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMsg = 'Tu cuenta de correo aún no ha sido confirmada. Por favor revisa tu bandeja de entrada.';
        } else {
          errorMsg = error.message || 'Ocurrió un error al iniciar sesión';
        }
        setError(errorMsg);
        notifyError(errorMsg);
        throw error;
      }
      
      if (data.user) {
        dispatch(setUser(data.user));
        let nombreUsuario = data.user.user_metadata?.full_name || data.user.email;
        try {
          const { success, perfil } = await obtenerPerfilUsuario(data.user.id);
          if (!success || !perfil) {
            await supabase.auth.signOut();
            dispatch(setUser(null));
            const errorMsg = 'Credenciales incorrectas. Por favor verifica tu correo y contraseña.';
            setError(errorMsg);
            notifyError(errorMsg);
            return;
          }
          dispatch(setUserProfile(perfil));
          nombreUsuario = perfil.full_name || nombreUsuario;
        } catch {
          await supabase.auth.signOut();
          dispatch(setUser(null));
          const errorMsg = 'Credenciales incorrectas. Por favor verifica tu correo y contraseña.';
          setError(errorMsg);
          notifyError(errorMsg);
          return;
        }
        notifySuccess(`Bienvenido de nuevo ${nombreUsuario}`);
        navigate('/dashboard');
      } else {
        const errorMsg = 'No se pudo obtener la información del usuario. Inténtalo nuevamente.';
        setError(errorMsg);
        notifyError(errorMsg);
      }
    } catch (err: any) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
          ¡Hola de nuevo!
        </h2>
        <p className="text-center text-slate-600 dark:text-slate-400 font-medium">
          ¿No tienes una cuenta?{' '}
          <Link to="/register" className="font-bold text-primary-600 dark:text-primary-400 hover:text-primary-500 transition-colors">
            Regístrate aquí
          </Link>
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="card p-8 sm:p-10">
          {error && (
            <div className="alert alert-error mb-6 flex items-start gap-3">
              <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-bold">{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="block text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Contraseña
                </label>
                <Link to="/forgot-password" hidden className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-500">
                  ¿La olvidaste?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full"
              />
            </div>

            <div className="flex items-center justify-end">
              <Link to="/forgot-password" title="Próximamente" className="text-sm font-bold text-primary-600 dark:text-primary-400 hover:text-primary-500 transition-colors">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary shadow-xl shadow-primary-500/20 py-4"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Iniciando sesión...
                  </span>
                ) : 'Entrar a mi cuenta'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login; 
