import { useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { signUp } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { notifySuccess, notifyError } from '../lib/toast';
import { applyReferralCode, decodeReferralCode } from '../lib/api';
import SEO from '../components/SEO';
import PhoneInput from '../components/ui/PhoneInput';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get('ref');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const passwordsMatch = useMemo(
    () => confirmPassword.length === 0 || password === confirmPassword,
    [password, confirmPassword]
  );
  const passwordLengthOk = useMemo(() => password.length >= 6, [password]);

  const clearError = () => setError('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const { data, error: signUpError } = await signUp(email, password);

      if (signUpError) {
        throw signUpError;
      }

      if (data.user) {
        try {
          await supabase.auth.updateUser({
            data: { full_name: fullName, phone },
          });
        } catch {
          // Non-blocking
        }

        // Aplicar referido si existe código en la URL
        if (refCode) {
          const referrerId = decodeReferralCode(refCode);
          if (referrerId && referrerId !== data.user.id) {
            await applyReferralCode(data.user.id, refCode);
          }
        }

        setRegistered(true);
        setError('');
        notifySuccess('Registro exitoso');
        // Redirigir a dashboard si hay sesión activa, si no a login
        setTimeout(async () => {
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          console.log('[Register] currentSession on redirect:', !!currentSession);
          navigate(currentSession ? '/dashboard' : '/login');
        }, 2000);
      }
    } catch (err: any) {
      let errorMsg: string;
      if (err.message.includes('Email already registered')) {
        errorMsg = 'Este correo ya está registrado. Intenta iniciar sesión.';
      } else if (err.message.includes('Database error')) {
        errorMsg = 'Hubo un problema con el servidor. Intenta de nuevo más tarde.';
      } else {
        errorMsg = err.message || 'Error al registrar usuario.';
      }
      setError(errorMsg);
      notifyError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (registered) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 flex items-center justify-center px-4 transition-colors duration-200">
        <div className="text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="w-20 h-20 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mx-auto mb-6 ring-1 ring-emerald-200 dark:ring-emerald-800">
            <Check className="w-10 h-10 text-emerald-500" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-3">
            ¡Registro exitoso!
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium max-w-sm mx-auto leading-relaxed">
            Te hemos enviado un enlace de confirmación a <strong className="text-slate-700 dark:text-slate-300">{email}</strong>. Revisa tu bandeja de entrada.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-600 border-t-transparent" />
            <p className="text-xs font-medium text-slate-400">Redirigiendo al inicio de sesión...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-200">
      <SEO
        title="Crear cuenta gratis"
        description="Regístrate en AgendaYa para descubrir negocios, reservar servicios y gestionar tus citas online."
      />

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Brand */}
        <div className="text-center mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center mx-auto mb-4 ring-1 ring-primary-200 dark:ring-primary-800">
            <UserPlus className="w-7 h-7 text-primary-600 dark:text-primary-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
            Únete a AgendaYa
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            ¿Ya tienes una cuenta?{' '}
            <Link to="/login" className="font-bold text-primary-600 dark:text-primary-400 hover:text-primary-500 transition-colors">
              Inicia sesión
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

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Nombre completo
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  required
                  value={fullName}
                  onChange={(e) => { setFullName(e.target.value); clearError(); }}
                  placeholder="Tu nombre real"
                  className="w-full pl-10"
                />
              </div>
            </div>

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
                  onChange={(e) => { setEmail(e.target.value); clearError(); }}
                  placeholder="tu@email.com"
                  className="w-full pl-10"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Teléfono
              </label>
              <PhoneInput
                id="phone"
                name="phone"
                value={phone}
                onChange={(v) => { setPhone(v); clearError(); }}
                placeholder="Número de teléfono"
                required
              />
            </div>

            {/* Password + Confirm side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); clearError(); }}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Validation indicator */}
                {password.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {passwordLengthOk ? (
                      <Check className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <X className="w-3 h-3 text-red-400" />
                    )}
                    <span className={`text-[11px] font-bold ${passwordLengthOk ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                      Mínimo 6 caracteres
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Confirmar
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); clearError(); }}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Match indicator */}
                {confirmPassword.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {passwordsMatch ? (
                      <Check className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <X className="w-3 h-3 text-red-400" />
                    )}
                    <span className={`text-[11px] font-bold ${passwordsMatch ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                      {passwordsMatch ? 'Coinciden' : 'No coinciden'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-500/25 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:-translate-y-0 mt-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Creando cuenta...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Registrarme ahora
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
            <p className="text-center text-xs font-medium text-slate-500 dark:text-slate-400">
              Al registrarte aceptas nuestros{' '}
              <a href="#" className="font-bold text-primary-600 dark:text-primary-400 hover:text-primary-500 transition-colors">Términos</a>
              {' '}y{' '}
              <a href="#" className="font-bold text-primary-600 dark:text-primary-400 hover:text-primary-500 transition-colors">Privacidad</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
