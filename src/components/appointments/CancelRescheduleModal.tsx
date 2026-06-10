import { useState } from 'react';
import { X, AlertCircle, Calendar, ChevronLeft } from 'lucide-react';
import { Appointment } from '../../types/appointment';
import { cancelAppointment, rescheduleAppointment } from '../../lib/api';
import { toast } from 'react-hot-toast';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          {mode ? (
            <button onClick={() => reset()} className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-primary-600 transition-all">
              <ChevronLeft className="w-4 h-4" /> Volver
            </button>
          ) : <div />}
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Gestionar cita</span>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {appointment.services && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-sm">
              <p className="font-bold text-slate-900 dark:text-white">{appointment.services.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {new Date(appointment.start_time).toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })} · {new Date(appointment.start_time).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          )}

          {isWithinMinTime && (
            <div className="flex items-start gap-2.5 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800/50 text-sm">
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-amber-700 dark:text-amber-300 text-xs font-medium">
                Esta cita está dentro del tiempo mínimo de cancelación ({businessMinCancellationHours}h). Puede que el negocio no acepte cambios de último minuto.
              </p>
            </div>
          )}

          {!mode ? (
            <div className="space-y-3">
              <button onClick={() => setMode('reschedule')}
                className="w-full flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700 transition-all text-left">
                <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm text-slate-900 dark:text-white">Reprogramar</p>
                  <p className="text-xs text-slate-500">Elige una nueva fecha y hora</p>
                </div>
              </button>
              <button onClick={() => setMode('cancel')}
                className="w-full flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-700 transition-all text-left">
                <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                  <X className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm text-slate-900 dark:text-white">Cancelar cita</p>
                  <p className="text-xs text-slate-500">Esta acción no se puede deshacer</p>
                </div>
              </button>
            </div>
          ) : mode === 'cancel' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Motivo de cancelación (opcional)</label>
                <textarea value={reason} onChange={e => setReason(e.target.value)}
                  placeholder="Cuéntanos por qué cancelas..."
                  className="w-full h-24 resize-none" />
              </div>
              <button onClick={handleCancel} disabled={loading}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? 'Cancelando...' : 'Sí, cancelar cita'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Nueva fecha</label>
                <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Nueva hora</label>
                <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)}
                  className="w-full" />
              </div>
              <button onClick={handleReschedule} disabled={loading || !newDate || !newTime}
                className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? 'Reprogramando...' : 'Confirmar reprogramación'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
