import { useState } from 'react';
import { X, AlertCircle, Calendar, ChevronLeft, Clock } from 'lucide-react';
import { Appointment } from '../../types/appointment';
import { cancelAppointment, rescheduleAppointment } from '../../lib/api';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  businessMinCancellationHours?: number;
}

export default function CancelRescheduleModal({ isOpen, onClose, appointment, businessMinCancellationHours = 0 }: Props) {
  const [mode, setMode] = useState<'cancel' | 'reschedule' | null>(null);
  const [reason, setReason] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !appointment) return null;

  const isWithinMinTime = businessMinCancellationHours > 0 &&
    (new Date(appointment.start_time).getTime() - Date.now()) < businessMinCancellationHours * 3600000;

  const handleCancel = async () => {
    setLoading(true);
    const res = await cancelAppointment(appointment.id, reason);
    setLoading(false);
    if (res.success) {
      toast.success('Cita cancelada');
      onClose();
    } else {
      toast.error(res.error || 'Error al cancelar');
    }
  };

  const handleReschedule = async () => {
    if (!newDate || !newTime) { toast.error('Selecciona fecha y hora'); return; }
    const startTime = new Date(`${newDate}T${newTime}`);
    const endTime = new Date(startTime.getTime() + 3600000);
    setLoading(true);
    const res = await rescheduleAppointment(appointment.id, startTime.toISOString(), endTime.toISOString());
    setLoading(false);
    if (res.success) {
      toast.success('Cita reprogramada');
      onClose();
    } else {
      toast.error(res.error || 'Error al reprogramar');
    }
  };

  const reset = () => { setMode(null); setReason(''); setNewDate(''); setNewTime(''); };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div
        className="relative w-full sm:max-w-md max-h-[90dvh] bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle (mobile) */}
        <div className="sm:hidden flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
        </div>

        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between px-4 sm:px-5 py-3">
            <div className="flex items-center gap-2 min-w-0">
              {mode ? (
                <button onClick={reset} className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-primary-600 transition-all">
                  <ChevronLeft className="w-4 h-4" /> Volver
                </button>
              ) : (
                <div className="w-8 h-8 rounded-xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-primary-500" />
                </div>
              )}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {mode === 'cancel' ? 'Cancelar cita' : mode === 'reschedule' ? 'Reprogramar' : 'Gestionar cita'}
            </span>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-all active:scale-90">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto px-4 sm:px-5 py-4 space-y-4">
          {/* Appointment summary */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-primary-500" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {appointment.services?.name || 'Cita'}
              </p>
              <p className="text-xs font-medium text-slate-400 truncate">
                {format(new Date(appointment.start_time), "EEE d MMM · HH:mm", { locale: es })} hs
              </p>
            </div>
          </div>

          {/* Warning */}
          {isWithinMinTime && (
            <div className="flex items-start gap-2.5 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800/50">
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                Esta cita está dentro del tiempo mínimo de cancelación ({businessMinCancellationHours}h). Puede que el negocio no acepte cambios de último minuto.
              </p>
            </div>
          )}

          {/* Mode selection */}
          {!mode ? (
            <div className="space-y-2">
              <button onClick={() => setMode('reschedule')}
                className="w-full flex items-center gap-3 p-3.5 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700 transition-all text-left active:scale-[0.99]">
                <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Reprogramar</p>
                  <p className="text-xs text-slate-500">Elige una nueva fecha y hora</p>
                </div>
              </button>
              <button onClick={() => setMode('cancel')}
                className="w-full flex items-center gap-3 p-3.5 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-700 transition-all text-left active:scale-[0.99]">
                <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                  <X className="w-4 h-4 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Cancelar cita</p>
                  <p className="text-xs text-slate-500">Esta acción no se puede deshacer</p>
                </div>
              </button>
            </div>
          ) : mode === 'cancel' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Motivo de cancelación (opcional)</label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Cuéntanos por qué cancelas..."
                  className="w-full h-24 resize-none bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                />
              </div>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="w-full py-3 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 active:scale-[0.98]"
              >
                {loading ? 'Cancelando...' : 'Sí, cancelar cita'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Nueva fecha</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Nueva hora</label>
                <input
                  type="time"
                  value={newTime}
                  onChange={e => setNewTime(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                />
              </div>
              <button
                onClick={handleReschedule}
                disabled={loading || !newDate || !newTime}
                className="w-full py-3 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20 active:scale-[0.98]"
              >
                {loading ? 'Reprogramando...' : 'Confirmar reprogramación'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
