import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, signIn } from '../lib/supabase';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { setUser, setUserProfile } from '../store/userSlice';
import { obtenerPerfilUsuario } from '../lib/api';
import { notifySuccess, notifyError } from '../lib/toast';
import SEO from '../components/SEO';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error } = await signIn(email, password);

      if (error) {
        let errorMsg = '';
        if (error.message.includes('Invalid login credentials')) {
          errorMsg = 'Credenciales incorrectas. Verifica tu correo y contraseña.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMsg = 'Tu correo aún no ha sido confirmado. Revisa tu bandeja de entrada.';
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
            const errorMsg = 'Credenciales incorrectas. Verifica tu correo y contraseña.';
            setError(errorMsg);
            notifyError(errorMsg);
            return;
          }
          dispatch(setUserProfile(perfil));
          nombreUsuario = perfil.full_name || nombreUsuario;
        } catch {
          await supabase.auth.signOut();
          dispatch(setUser(null));
          const errorMsg = 'Credenciales incorrectas. Verifica tu correo y contraseña.';
          setError(errorMsg);
          notifyError(errorMsg);
          return;
        }
        notifySuccess(`Bienvenido de nuevo ${nombreUsuario}`);
        navigate('/dashboard');
      } else {
        const errorMsg = 'No se pudo obtener la información del usuario.';
        setError(errorMsg);
        notifyError(errorMsg);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-200">
      <SEO
        title="Iniciar sesión"
        description="Accede a tu cuenta de AgendaYa para gestionar tus reservas, perfil y negocios."
      />

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Logo / Brand */}
        <div className="text-center mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center mx-auto mb-4 ring-1 ring-primary-200 dark:ring-primary-800">
            <LogIn className="w-7 h-7 text-primary-600 dark:text-primary-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
            ¡Hola de nuevo!
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            ¿No tienes una cuenta?{' '}
            <Link to="/register" className="font-bold text-primary-600 dark:text-primary-400 hover:text-primary-500 transition-colors">
              Regístrate aquí
            </Link>
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 px-4 py-3 mb-6 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-800 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-bold text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="tu@email.com"
                  className="w-full pl-10"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="password" className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                  Contraseña
                </label>
                <Link to="/forgot-password" className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-500 transition-colors">
                  ¿Olvidaste?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-500/25 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:-translate-y-0"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Iniciando sesión...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Entrar a mi cuenta
                </>
              )}
            </button>
          </form>

          {/* Divider + Register CTA */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
            <p className="text-center text-xs font-medium text-slate-500 dark:text-slate-400">
              ¿No tienes cuenta?{' '}
              <Link to="/register" className="font-bold text-primary-600 dark:text-primary-400 hover:text-primary-500 transition-colors">
                Regístrate gratis <ArrowRight className="w-3 h-3 inline" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
