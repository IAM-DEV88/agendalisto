import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Eye, Bell, ListOrdered, Save, Loader2, CheckCircle2, AlertCircle, ChevronDown, Link as LinkIcon, Copy, Check, ExternalLink, Trash2, AlertTriangle, Clock, Timer, CalendarClock } from 'lucide-react';
import { BusinessConfig, deleteBusiness } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { useUIConfig } from '../../hooks/useUIConfig';
import { canUseEmailNotifications } from '../../lib/roles';
import SectionHeader from '../ui/SectionHeader';
import { toast } from 'react-hot-toast';
import { setBusinesses, setActiveBusinessId } from '../../store/userSlice';
import type { RootState } from '../../store';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';

interface BusinessConfigSectionProps {
  config: BusinessConfig;
  loading: boolean;
  saving: boolean;
  message: { text: string; type: 'success' | 'error' } | null;
  onSave: (e: React.FormEvent) => Promise<boolean | void>;
  onConfigChange: (field: keyof BusinessConfig, value: any) => void;
  plan?: 'starter' | 'pro' | 'premium';
  businessName?: string;
  businessAddress?: string;
  businessSlug?: string;
  businessId?: string;
}

export const BusinessConfigSection: React.FC<BusinessConfigSectionProps> = ({
  config,
  loading,
  saving,
  message,
  onSave,
  onConfigChange,
  plan = 'starter',
  businessName = '',
  businessAddress = '',
  businessSlug = '',
  businessId,
}) => {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const businesses = useSelector((state: RootState) => state.user.businesses);
  const userProfile = useSelector((state: RootState) => state.user.userProfile);
  const { itemsPerPage, setItemsPerPageValue, saveItemsPerPage } = useUIConfig(user?.id);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  useLockBodyScroll(showDeleteConfirm);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const saved = await saveItemsPerPage();
    if (saved) {
      onSave(e);
    }
  };

  const ConfigToggle = ({ id, label, description, checked, onChange, disabled }: { id: string, label: string, description: string, checked: boolean, onChange: (checked: boolean) => void, disabled?: boolean }) => (
    <label htmlFor={id} className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer group'}`}>
      <div className="flex items-center h-5 mt-0.5">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="w-5 h-5 rounded-md border-slate-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50"
        />
      </div>
      <div className="min-w-0">
        <span className="block text-sm font-bold text-slate-700 dark:text-slate-200 transition-colors">
          {label}
        </span>
        <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {description}
        </span>
      </div>
    </label>
  );

  return (
    <div className="space-y-6">
      <SectionHeader 
        title="Comportamiento" 
        description="Personaliza el comportamiento y la visibilidad de tu negocio en la plataforma"
      />
      
      {message && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'} flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <p className="font-bold">{message.text}</p>
        </div>
      )}
      
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
          <p className="text-slate-500 font-medium">Cargando configuración...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Configuración de Horarios */}
            <div className="card p-6 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="p-2 bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 rounded-lg">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Horarios de Reserva</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="slot_interval_minutes" className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                    Intervalo de slots
                  </label>
                  <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4 text-slate-400" />
                    <select
                      id="slot_interval_minutes"
                      value={config.slot_interval_minutes ?? 30}
                      onChange={(e) => onConfigChange('slot_interval_minutes', parseInt(e.target.value))}
                      className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value={15}>15 minutos</option>
                      <option value={30}>30 minutos</option>
                      <option value={60}>1 hora</option>
                    </select>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Cada cuánto tiempo se muestran los horarios disponibles.
                  </p>
                </div>

                <div>
                  <label htmlFor="buffer_minutes" className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                    Tiempo de buffer
                  </label>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <select
                      id="buffer_minutes"
                      value={config.buffer_minutes ?? 0}
                      onChange={(e) => onConfigChange('buffer_minutes', parseInt(e.target.value))}
                      className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value={0}>Sin buffer</option>
                      <option value={5}>5 minutos</option>
                      <option value={10}>10 minutos</option>
                      <option value={15}>15 minutos</option>
                      <option value={30}>30 minutos</option>
                    </select>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Tiempo libre entre citas para preparación.
                  </p>
                </div>

                <div>
                  <label htmlFor="max_advance_booking_days" className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                    Reservar con anticipación
                  </label>
                  <div className="flex items-center gap-2">
                    <CalendarClock className="w-4 h-4 text-slate-400" />
                    <select
                      id="max_advance_booking_days"
                      value={config.max_advance_booking_days ?? 90}
                      onChange={(e) => onConfigChange('max_advance_booking_days', parseInt(e.target.value))}
                      className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value={7}>7 días</option>
                      <option value={14}>14 días</option>
                      <option value={30}>30 días</option>
                      <option value={60}>60 días</option>
                      <option value={90}>90 días</option>
                      <option value={180}>180 días</option>
                      <option value={365}>1 año</option>
                    </select>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Cuántos días adelante los clientes pueden reservar.
                  </p>
                </div>
              </div>
            </div>

            {/* Información Visible */}
            <div className="card p-6 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="p-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 rounded-lg">
                  <Eye className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Información Visible</h3>
              </div>

              <div className="space-y-1">
                <ConfigToggle 
                  id="mostrar_telefono"
                  label="Mostrar teléfono"
                  description="Tu número de teléfono será visible en la página pública."
                  checked={config.mostrar_telefono}
                  onChange={(val) => onConfigChange('mostrar_telefono', val)}
                />
                <ConfigToggle 
                  id="mostrar_email"
                  label="Mostrar email"
                  description="Tu dirección de email será visible en la página pública."
                  checked={config.mostrar_email}
                  onChange={(val) => onConfigChange('mostrar_email', val)}
                />
                <ConfigToggle 
                  id="mostrar_redes_sociales"
                  label="Mostrar redes sociales"
                  description="Tus perfiles de redes sociales serán visibles en la página pública."
                  checked={config.mostrar_redes_sociales}
                  onChange={(val) => onConfigChange('mostrar_redes_sociales', val)}
                />
                <ConfigToggle 
                  id="mostrar_direccion"
                  label="Mostrar dirección"
                  description="Tu dirección y mapa serán visibles en la página pública."
                  checked={config.mostrar_direccion}
                  onChange={(val) => onConfigChange('mostrar_direccion', val)}
                />
              </div>
            </div>

            {/* Notificaciones */}
            <div className="card p-6 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="p-2 bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 rounded-lg">
                  <Bell className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Notificaciones</h3>
              </div>

              <div className="space-y-1">
                <ConfigToggle 
                  id="notificaciones_email"
                  label="Notificaciones por email"
                  description={canUseEmailNotifications(plan) ? "Recibir alertas de nuevas reservas en tu correo electrónico." : "Disponible en plan Pro o superior."}
                  checked={config.notificaciones_email}
                  disabled={!canUseEmailNotifications(plan)}
                  onChange={(val) => onConfigChange('notificaciones_email', val)}
                />
                <ConfigToggle 
                  id="notificaciones_whatsapp"
                  label="Notificaciones por WhatsApp"
                  description="Recibir alertas instantáneas en tu número de WhatsApp."
                  checked={config.notificaciones_whatsapp}
                  onChange={(val) => onConfigChange('notificaciones_whatsapp', val)}
                />
              </div>
            </div>

            {/* Paginación */}
            <div className="card p-6 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="p-2 bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 rounded-lg">
                  <ListOrdered className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Preferencias de Lista</h3>
              </div>

              <div className="space-y-2 px-3">
                <label htmlFor="items_per_page" className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                  Registros por página
                </label>
                <div className="relative">
                  <ListOrdered className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="number"
                    id="items_per_page"
                    min="1"
                    max="50"
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPageValue(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm font-bold"
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                  Número de elementos que se mostrarán en tablas y listados.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary-500/25 gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {saving ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </div>
        </form>
      )}

      {/* Google My Business Guide */}
                      <GoogleMyBusinessGuide businessName={businessName || ''} businessAddress={businessAddress || ''} businessSlug={businessSlug || ''} />

      {/* ─── ZONA DE PELIGRO ─── */}
      <div className="mt-10 pt-8 border-t-2 border-red-200 dark:border-red-900/50">
        <SectionHeader
          title="Zona de Peligro"
          description="Acciones irreversibles para tu negocio"
        />
        <div className="card p-6 border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 mt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-lg flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-black text-red-800 dark:text-red-300">Eliminar este negocio</h3>
                <p className="text-sm text-red-600/80 dark:text-red-400/70 mt-1">
                  Elimina permanentemente este negocio y todos sus datos (servicios, citas, horarios, reseñas). 
                  Esta acción no se puede deshacer.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-500/25 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar negocio
            </button>
          </div>
        </div>
      </div>

      {/* ─── MODAL CONFIRMACIÓN ELIMINAR ─── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">¿Eliminar negocio?</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
              Esta acción eliminará permanentemente <strong className="text-slate-800 dark:text-slate-200">{businessName}</strong> 
              y todos sus datos asociados. Una vez eliminado, no podrás recuperarlo.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="px-5 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  if (!businessId) return;
                  setDeleting(true);
                  const result = await deleteBusiness(businessId);
                  if (result.success) {
                    toast.success('Negocio eliminado correctamente');
                    const updated = businesses.filter(b => b.id !== businessId);
                    dispatch(setBusinesses(updated));
                    // If the deleted business was the active one, navigate
                    if (userProfile?.business_id === businessId) {
                      const nextBiz = updated[0]?.id;
                      dispatch(setActiveBusinessId(nextBiz));
                    }
                    navigate('/dashboard');
                  } else {
                    toast.error(result.error || 'Error al eliminar el negocio');
                    setDeleting(false);
                    setShowDeleteConfirm(false);
                  }
                }}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all disabled:opacity-50"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {deleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const GoogleMyBusinessGuide = ({ businessName, businessAddress, businessSlug }: { businessName: string; businessAddress?: string; businessSlug?: string }) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const businessPageUrl = `${window.location.origin}/${businessSlug || ''}`;
  const gmbUrl = `https://business.google.com/create?name=${encodeURIComponent(businessName)}${businessAddress ? `&address=${encodeURIComponent(businessAddress)}` : ''}`;

  const handleCopyBusinessLink = async () => {
    try {
      await navigator.clipboard.writeText(businessPageUrl);
      setCopied(true);
      toast.success('¡Enlace de tu negocio copiado!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('No se pudo copiar el enlace');
    }
  };

  return (
    <div className="mt-10 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 sm:p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
          <div>
            <h3 className="font-black text-slate-900 dark:text-white text-sm">Google My Business</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Aparece en Google Maps y búsquedas locales</p>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="px-5 sm:px-6 pb-6 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-5">
            <div className="bg-amber-50 dark:bg-amber-900/10 rounded-2xl p-5 border border-amber-100 dark:border-amber-800/30">
              <p className="text-sm font-bold text-amber-800 dark:text-amber-300 mb-2">📈 ¿Por qué es importante?</p>
              <p className="text-sm text-amber-700 dark:text-amber-400/80 leading-relaxed">
                El 76% de las personas que buscan un negocio local visitan el local en 24 horas.
                Tener tu perfil en Google My Business multiplica tu visibilidad en búsquedas locales y Google Maps.
              </p>
            </div>

            {/* ENLAZAR PÁGINA DE AGENDAYA */}
            <div className="bg-primary-50 dark:bg-primary-900/10 rounded-2xl p-5 border border-primary-100 dark:border-primary-800/30">
              <h4 className="text-sm font-black text-primary-800 dark:text-primary-300 mb-3 flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                Enlaza tu página de AgendaYa con Google
              </h4>
              <p className="text-sm text-primary-700 dark:text-primary-400/80 leading-relaxed mb-4">
                Agrega el enlace de tu perfil público en AgendaYa a tu ficha de Google My Business.
                Así tus clientes podrán reservar directamente desde Google Maps.
              </p>
              <div className="flex flex-col sm:flex-row items-stretch gap-2 mb-4">
                <div className="flex-1 flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 rounded-xl border border-primary-200 dark:border-primary-800/50 text-sm font-mono text-slate-600 dark:text-slate-300 truncate">
                  <ExternalLink className="w-4 h-4 flex-shrink-0 text-primary-500" />
                  <span className="truncate">{businessPageUrl}</span>
                </div>
                <button
                  onClick={handleCopyBusinessLink}
                  className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                    copied
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white dark:bg-slate-800 border border-primary-200 dark:border-primary-800/50 text-primary-700 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20'
                  }`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>
              <p className="text-xs text-primary-600/70 dark:text-primary-400/60 leading-relaxed">
                <strong>¿Cómo hacerlo?</strong> En tu perfil de Google My Business, ve a "Información" → "Sitio web"
                y pega este enlace. Así los clientes que te encuentren en Google podrán ver tus servicios y reservar online.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Checklist para aparecer en Google</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { emoji: '✅', title: 'Crea tu perfil', desc: 'Regístrate gratis en Google My Business' },
                  { emoji: '🔗', title: 'Enlaza tu web', desc: 'Agrega tu enlace de AgendaYa en "Sitio web"' },
                  { emoji: '📸', title: 'Agrega fotos', desc: 'Sube fotos de tu local, servicios y equipo' },
                  { emoji: '📝', title: 'Completa tu info', desc: 'Dirección, horarios, teléfono consistentes' },
                  { emoji: '⭐', title: 'Responde reseñas', desc: 'Responde a tus clientes, aumenta tu reputación' },
                  { emoji: '📊', title: 'Publica novedades', desc: 'Comparte ofertas y actualizaciones semanales' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-lg flex-shrink-0">{item.emoji}</span>
                    <div>
                      <p className="font-bold text-xs text-slate-800 dark:text-slate-200">{item.title}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <a
              href={gmbUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-amber-500/25"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              Registrarme en Google My Business
            </a>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              💡 <strong className="text-slate-500">Tip:</strong> Usa fotos de alta calidad y actualiza tu horario semanalmente.
              Los negocios con fotos reciben 42% más indicaciones de llegada en Google Maps.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessConfigSection; 
