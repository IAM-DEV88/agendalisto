import React, { useState, useEffect, useCallback } from 'react';
import { Edit2, Trash2, User, Mail, Phone, Loader2, AlertTriangle, Lock, Plus, Users, CheckCircle, XCircle } from 'lucide-react';
import { getBusinessStaff, createStaff, updateStaff, deleteStaff, verifyPassword } from '../../lib/api';
import { getMaxStaff, PLAN_LABELS } from '../../lib/roles';
import { notifySuccess, notifyError } from '../../lib/toast';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';
import { supabase } from '../../lib/supabase';
import EmptyState from '../ui/EmptyState';
import type { Staff } from '../../lib/api';

interface StaffSectionProps {
  businessId: string;
  plan: 'starter' | 'pro' | 'premium';
  passwordProtectStaff?: boolean;
}

export default function StaffSection({ businessId, plan, passwordProtectStaff = true }: StaffSectionProps) {
  const maxStaff = getMaxStaff(plan);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [deletingStaff, setDeletingStaff] = useState<Staff | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: 'create' | 'edit' | 'delete';
    data?: { full_name: string; email?: string; phone?: string };
  } | null>(null);
  const [password, setPassword] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useLockBodyScroll(!!showCreateModal || !!editingStaff || !!deletingStaff || showPasswordModal);

  const loadStaff = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getBusinessStaff(businessId);
      let list = res.success && res.data ? [...res.data] : [];

      if (list.length === 0) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('agendaya_profiles')
            .select('full_name, email, phone')
            .eq('id', user.id)
            .single();
          if (profile?.full_name) {
            const created = await createStaff(businessId, {
              full_name: profile.full_name,
              email: profile.email || undefined,
              phone: profile.phone || undefined,
            });
            if (created.success && created.data) list = [created.data];
          }
        }
      }

      setStaff(list);
    } catch {
      notifyError('Error al cargar el personal');
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => { loadStaff(); }, [loadStaff]);

  const requestPassword = (action: typeof pendingAction) => {
    setPendingAction(action);
    setPassword('');
    setPasswordError('');
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = async () => {
    if (!password.trim()) { setPasswordError('Ingresa tu contraseña'); return; }
    setVerifying(true);
    setPasswordError('');
    const res = await verifyPassword(password);
    if (res.success) {
      setPassword('');
      setShowPasswordModal(false);
      const action = pendingAction;
      setPendingAction(null);
      if (action?.type === 'edit' && editingStaff) await executeEdit(editingStaff);
      else if (action?.type === 'create' && action.data) await executeCreate(action.data);
      else if (action?.type === 'delete' && deletingStaff) await executeDelete(deletingStaff.id);
    } else {
      setPasswordError(res.error || 'Contraseña incorrecta');
    }
    setVerifying(false);
  };



  const executeCreate = async (data: { full_name: string; email?: string; phone?: string }) => {
    setSubmitting(true);
    const res = await createStaff(businessId, data);
    if (res.success) {
      setStaff(prev => [...prev, res.data!]);
      setShowCreateModal(false);
      notifySuccess('Encargado añadido correctamente');
    } else notifyError(res.error || 'Error al añadir encargado');
    setSubmitting(false);
  };

  const executeEdit = async (member: Staff) => {
    setSubmitting(true);
    const res = await updateStaff(member.id, {
      full_name: member.full_name, email: member.email || undefined, phone: member.phone || undefined, is_active: member.is_active,
    });
    if (res.success) {
      setStaff(prev => prev.map(s => s.id === member.id ? res.data! : s));
      setEditingStaff(null);
      notifySuccess('Encargado actualizado correctamente');
    } else notifyError(res.error || 'Error al actualizar encargado');
    setSubmitting(false);
  };

  const executeDelete = async (id: string) => {
    setSubmitting(true);
    const res = await deleteStaff(id);
    if (res.success) {
      setStaff(prev => prev.filter(s => s.id !== id));
      setDeletingStaff(null);
      notifySuccess('Encargado eliminado correctamente');
    } else notifyError(res.error || 'Error al eliminar encargado');
    setSubmitting(false);
  };

  const needPassword = !!passwordProtectStaff;

  const handleDeleteConfirm = (member: Staff) => {
    setDeletingStaff(member);
    if (needPassword) requestPassword({ type: 'delete' });
    else executeDelete(member.id);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
      <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      <p className="text-sm text-slate-500 font-medium">Cargando encargados...</p>
    </div>
  );

  const atLimit = staff.length >= maxStaff;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {staff.length} / {maxStaff === 10 ? '10+' : maxStaff} encargados
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Plan {PLAN_LABELS[plan]}{' '}
            {maxStaff === 10 ? '— encargados ilimitados' : `— máximo ${maxStaff} encargados`}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          disabled={atLimit}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-primary-500/25 disabled:shadow-none"
        >
          <Plus className="w-3.5 h-3.5" />
          Añadir
        </button>
      </div>

      <div className="space-y-2">
        {staff.length === 0 ? (
          <EmptyState
            icon={<Users className="w-8 h-8" />}
            title="Sin encargados registrados"
            description="Agrega encargados para asignar profesionales o personal a los servicios y horarios de tu negocio."
          />
        ) : (
          staff.map((member) => (
            <div key={member.id} className="group bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${member.is_active ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{member.full_name}</span>
                  {member.is_active ? (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded text-[9px] font-bold">
                      <CheckCircle className="w-2 h-2" /> Activo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded text-[9px] font-bold">
                      <XCircle className="w-2 h-2" /> Inactivo
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {member.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{member.email}</span>}
                  {member.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{member.phone}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button type="button" onClick={() => setEditingStaff(member)} className="p-1.5 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all" title="Editar">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => handleDeleteConfirm(member)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all" title="Eliminar">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showCreateModal && (
        <StaffFormModal
          title="Añadir encargado"
          submitting={submitting}
          onSave={async (data) => {
            const name = data.full_name.trim();
            if (!name) return;
            if (needPassword) requestPassword({ type: 'create', data: { full_name: name, email: data.email, phone: data.phone } });
            else executeCreate({ full_name: name, email: data.email, phone: data.phone });
          }}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {editingStaff && (
        <StaffFormModal
          title="Editar encargado"
          initial={{ full_name: editingStaff.full_name, email: editingStaff.email || '', phone: editingStaff.phone || '', is_active: editingStaff.is_active }}
          submitting={submitting}
          onSave={async (data) => {
            const updated = { ...editingStaff, ...data };
            setEditingStaff(updated);
            if (needPassword) {
              requestPassword({ type: 'edit' });
            } else {
              await executeEdit(updated);
            }
          }}
          onClose={() => { setEditingStaff(null); setPendingAction(null); }}
        />
      )}

      {deletingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">¿Eliminar encargado?</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
              Se eliminará permanentemente a <strong className="text-slate-800 dark:text-slate-200">{deletingStaff.full_name}</strong> del personal del negocio.
            </p>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => { setDeletingStaff(null); setPendingAction(null); }} disabled={submitting} className="px-5 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-all">
                Cancelar
              </button>
              <button type="button" onClick={() => handleDeleteConfirm(deletingStaff)} disabled={submitting} className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all disabled:opacity-50">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {submitting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary-50 dark:bg-primary-500/10 rounded-full">
                <Lock className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Confirmar contraseña</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Ingresa tu contraseña para continuar con esta acción.
            </p>
            <input
              type="password" value={password}
              onChange={e => { setPassword(e.target.value); setPasswordError(''); }}
              onKeyDown={e => { if (e.key === 'Enter') handlePasswordSubmit(); }}
              placeholder="Tu contraseña"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all mb-1"
              autoFocus
            />
            {passwordError && <p className="text-xs font-bold text-red-500 mb-3">{passwordError}</p>}
            <div className="flex gap-3 justify-end mt-2">
              <button type="button" onClick={() => { setShowPasswordModal(false); setPendingAction(null); setEditingStaff(null); setDeletingStaff(null); setPassword(''); setPasswordError(''); }} disabled={verifying} className="px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-all">
                Cancelar
              </button>
              <button type="button" onClick={handlePasswordSubmit} disabled={verifying || !password.trim()} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-all disabled:opacity-50">
                {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                {verifying ? 'Verificando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StaffFormModal({ title, initial, submitting, onSave, onClose }: {
  title: string;
  initial?: { full_name: string; email?: string; phone?: string; is_active?: boolean };
  submitting: boolean;
  onSave: (data: { full_name: string; email?: string; phone?: string; is_active: boolean }) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    full_name: initial?.full_name || '',
    email: initial?.email || '',
    phone: initial?.phone || '',
    is_active: initial?.is_active ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim()) return;
    await onSave({ ...form, full_name: form.full_name.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" data-swipe-block>
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-50 dark:bg-primary-500/10 rounded-full">
              <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">{title}</h3>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre completo</label>
            <input type="text" value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
              required autoFocus placeholder="Ej: Juan Pérez"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Email <span className="text-slate-400 font-normal">(opcional)</span></label>
            <input type="email" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
              placeholder="correo@ejemplo.com"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Teléfono <span className="text-slate-400 font-normal">(opcional)</span></label>
            <input type="tel" value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
              placeholder="+57 300 123 4567"
            />
          </div>
          <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
            <input type="checkbox" checked={form.is_active}
              onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
              className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            <div>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Activo</span>
              <p className="text-xs text-slate-500 dark:text-slate-400">Disponible para recibir asignaciones</p>
            </div>
          </label>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} disabled={submitting} className="px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-all">
              Cancelar
            </button>
            <button type="submit" disabled={submitting || !form.full_name.trim()} className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-all disabled:opacity-50">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {submitting ? 'Guardando...' : title === 'Añadir encargado' ? 'Añadir' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
