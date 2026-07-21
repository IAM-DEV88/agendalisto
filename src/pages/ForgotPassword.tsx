import { useState } from 'react';
import { Link } from 'react-router-dom';
import { resetPassword } from '../lib/supabase';
import SEO from '../components/SEO';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const { error } = await resetPassword(email);
      
      if (error) throw error;
      
      setMessage('Se ha enviado un enlace de recuperación a tu correo electrónico.');
    } catch (err: any) {
      setError(err.message || 'Error al enviar el correo de recuperación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-200">
      <SEO
        title="Recuperar contraseña"
        description="Recibe un enlace de recuperación para restablecer tu contraseña de AgendaYa."
      />
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
          Recuperar acceso
        </h2>
        <p className="text-center text-slate-600 dark:text-slate-400 font-medium px-4">
          Ingresa tu correo para recibir un enlace de recuperación
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

          {message && (
            <div className="alert alert-success mb-6 py-4 text-center animate-in zoom-in duration-300">
              <p className="text-sm font-bold">{message}</p>
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
              <button
                type="submit"
                disabled={loading}
                className="btn-primary shadow-xl shadow-primary-500/20 py-4"
              >
                {loading ? 'Enviando...' : 'Enviar enlace'}
              </button>
            </div>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-700" />
              </div>
              <div className="relative flex justify-center text-sm font-bold uppercase tracking-widest">
                <span className="px-4 bg-white dark:bg-slate-800 text-slate-500">
                  O vuelve a
                </span>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <Link
                to="/login"
                className="btn-secondary py-3 text-sm font-bold text-center"
              >
                Iniciar sesión
              </Link>
              <Link
                to="/register"
                className="btn-secondary py-3 text-sm font-bold text-center"
              >
                Registrarse
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword; 
