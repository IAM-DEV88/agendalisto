import { useState } from 'react';
import { Lock, Loader2, X } from 'lucide-react';
import { verifyPassword } from '../../lib/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void | Promise<void>;
  title?: string;
  description?: string;
}

export default function PasswordVerifyModal({ isOpen, onClose, onVerified, title = 'Confirmar contraseña', description = 'Ingresa tu contraseña para continuar con esta acción.' }: Props) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!password.trim()) { setError('Ingresa tu contraseña'); return; }
    setVerifying(true);
    setError('');
    try {
      const res = await verifyPassword(password);
      if (res.success) {
        setPassword('');
        setError('');
        await onVerified();
        onClose();
      } else {
        setError(res.error || 'Contraseña incorrecta');
      }
    } catch {
      setError('Error al verificar contraseña');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-50 dark:bg-primary-500/10 rounded-full">
              <Lock className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">{title}</h3>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{description}</p>
        <input
          type="password"
          value={password}
          onChange={e => { setPassword(e.target.value); setError(''); }}
          onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
          placeholder="Tu contraseña"
          className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
          autoFocus
        />
        {error && <p className="text-xs font-bold text-red-500 mt-2">{error}</p>}
        <div className="flex gap-3 justify-end mt-4">
          <button type="button" onClick={onClose} disabled={verifying} className="px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-all">
            Cancelar
          </button>
          <button type="button" onClick={handleSubmit} disabled={verifying || !password.trim()} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-all disabled:opacity-50">
            {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            {verifying ? 'Verificando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}
