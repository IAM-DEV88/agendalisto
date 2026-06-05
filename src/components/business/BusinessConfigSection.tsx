import React from 'react';
import { Settings, Eye, Bell, ListOrdered, Save, Loader2, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { BusinessConfig } from '../../lib/api';
import { useItemsPerPage } from '../../hooks/useItemsPerPage';
import { useAuth } from '../../hooks/useAuth';
import { canUseEmailNotifications } from '../../lib/roles';
import SectionHeader from '../ui/SectionHeader';

interface BusinessConfigSectionProps {
  config: BusinessConfig;
  loading: boolean;
  saving: boolean;
  message: { text: string; type: 'success' | 'error' } | null;
  onSave: (e: React.FormEvent) => Promise<boolean | void>;
  onConfigChange: (field: keyof BusinessConfig, value: any) => void;
  plan?: 'starter' | 'pro' | 'premium';
}

export const BusinessConfigSection: React.FC<BusinessConfigSectionProps> = ({
  config,
  loading,
  saving,
  message,
  onSave,
  onConfigChange,
  plan = 'starter'
}) => {
  const { user } = useAuth();
  const { localItemsPerPage, setLocalItemsPerPage, saveItemsPerPage } = useItemsPerPage(user?.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await saveItemsPerPage(localItemsPerPage);
    if (result.success) {
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
            {/* Reservas Online */}
            <div className="card p-6 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="p-2 bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400 rounded-lg">
                  <Settings className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Reservas Online</h3>
              </div>
              
              <div className="space-y-1">
                <ConfigToggle 
                  id="permitir_reservas_online"
                  label="Permitir reservas online"
                  description="Los clientes podrán realizar reservas directamente desde la web."
                  checked={config.permitir_reservas_online}
                  onChange={(val) => onConfigChange('permitir_reservas_online', val)}
                />

                <ConfigToggle 
                  id="requiere_confirmacion"
                  label="Requerir confirmación manual"
                  description="Las reservas quedarán pendientes hasta que las confirmes manualmente."
                  checked={config.requiere_confirmacion}
                  onChange={(val) => onConfigChange('requiere_confirmacion', val)}
                />
              </div>

              <div className="space-y-2 px-3 pt-2">
                <label htmlFor="tiempo_minimo_cancelacion" className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                  Tiempo mínimo para cancelaciones (horas)
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    id="tiempo_minimo_cancelacion"
                    value={config.tiempo_minimo_cancelacion}
                    onChange={(e) => onConfigChange('tiempo_minimo_cancelacion', parseInt(e.target.value) || 0)}
                    min="0"
                    max="72"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm font-bold"
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                  Plazo límite para que los clientes puedan cancelar sus citas.
                </p>
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
                  id="mostrar_precios"
                  label="Mostrar precios"
                  description="Los precios de los servicios serán visibles en la página pública."
                  checked={config.mostrar_precios}
                  onChange={(val) => onConfigChange('mostrar_precios', val)}
                />
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
                <input
                  type="number"
                  id="items_per_page"
                  min="1"
                  max="50"
                  value={localItemsPerPage}
                  onChange={(e) => setLocalItemsPerPage(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm font-bold"
                />
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
    </div>
  );
};

export default BusinessConfigSection; 
