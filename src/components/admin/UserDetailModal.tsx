import { useState } from 'react';
import type { UserProfile } from '../../lib/supabase';
import { ROLES, PLANS, ROLE_LABELS } from '../../lib/roles';
import type { Role } from '../../lib/roles';
import { adminUpdateUser } from '../../lib/api';
import { notifySuccess, notifyError } from '../../lib/toast';
import { X } from 'lucide-react';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';

interface UserDetailModalProps {
  user: UserProfile;
  onClose: () => void;
  onUpdated: (updated: UserProfile) => void;
}

const UserDetailModal = ({ user, onClose, onUpdated }: UserDetailModalProps) => {
  useLockBodyScroll(true);
  const [role, setRole] = useState(user.role);
  const [plan, setPlan] = useState(user.plan);
  const [saving, setSaving] = useState(false);

  const hasChanges = role !== user.role || plan !== user.plan;

  const handleSave = async () => {
    setSaving(true);
    const res = await adminUpdateUser(user.id, { role, plan });
    if (res.success) {
      notifySuccess('Usuario actualizado correctamente');
      onUpdated({ ...user, role, plan });
      onClose();
    } else {
      notifyError(res.error || 'Error al actualizar usuario');
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-black text-slate-900 dark:text-white">Detalle del Usuario</h3>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-bold text-primary-700 dark:text-primary-300">
                {(user.full_name || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-base font-black text-slate-900 dark:text-white truncate">{user.full_name}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                ID: {user.id.slice(0, 8)}... · Creado {new Date(user.created_at).toLocaleDateString('es-CO')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Rol
              </label>
              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              >
                {ROLES.map(r => (
                  <option key={r} value={r}>{ROLE_LABELS[r as Role] || r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Plan
              </label>
              <select
                value={plan}
                onChange={e => setPlan(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              >
                {PLANS.map(p => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Teléfono</span>
              <p className="font-bold text-slate-700 dark:text-slate-300 mt-0.5">{user.phone || '—'}</p>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Negocio</span>
              <p className="font-bold text-slate-700 dark:text-slate-300 mt-0.5">{user.is_business ? 'Sí' : 'No'}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="px-5 py-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-500 rounded-xl shadow-lg shadow-primary-500/25 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal;
