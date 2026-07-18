import { useState, useEffect, useMemo, useCallback } from 'react';
import { X, AlertCircle, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, User } from 'lucide-react';
import { Appointment } from '../../types/appointment';
import { cancelAppointment, rescheduleAppointment, getBusinessHours, getBusinessAppointments, getBusinessConfig, getBusinessStaff, BusinessHours, Appointment as ApiAppointment } from '../../lib/api';
import type { Staff } from '../../lib/api';
import { toast } from 'react-hot-toast';
import {
  format,   startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek,
  isSameMonth, addMonths, subMonths,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  isOwner?: boolean;
}

export default function CancelRescheduleModal({ isOpen, onClose, appointment, isOwner }: Props) {
  useLockBodyScroll(isOpen);
  const [mode, setMode] = useState<'cancel' | 'reschedule' | null>(null);
  const [reason, setReason] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [businessHours, setBusinessHours] = useState<BusinessHours[]>([]);
  const [appointments, setAppointments] = useState<ApiAppointment[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [slotInterval, setSlotInterval] = useState(30);
  const [bufferMinutes, setBufferMinutes] = useState(0);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [localSlots, setLocalSlots] = useState<string[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [rescheduleStaff, setRescheduleStaff] = useState('');
  const currentStaffName = staffList.find(s => s.id === appointment?.staff_id)?.full_name;

  const minCancellationHours = appointment?.services?.min_cancellation_hours ?? 48;
  const minRescheduleHours = appointment?.services?.min_reschedule_hours ?? 48;

  useEffect(() => {
    if (!appointment?.business_id || !mode) return;
    const fetchSchedule = async () => {
      try {
        setLoadingSlots(true);
        const hours = await getBusinessHours(appointment.business_id);
        const apptsRes = await getBusinessAppointments(appointment.business_id);
        const configRes = await getBusinessConfig(appointment.business_id);
        const fullWeek = Array.from({ length: 7 }, (_, idx) => {
          const found = hours.find(h => h.day_of_week === idx);
          return found || {
            id: `${appointment.business_id}-${idx}`,
            business_id: appointment.business_id,
            day_of_week: idx,
            start_time: '00:00',
            end_time: '00:00',
            is_closed: true,
          } as BusinessHours;
        });
        setBusinessHours(fullWeek);
        setAppointments(apptsRes.success && apptsRes.data ? apptsRes.data.filter(a => a.id !== appointment.id) : []);
        if (configRes.success && configRes.config) {
          setSlotInterval(configRes.config.slot_interval_minutes ?? 30);
          setBufferMinutes(configRes.config.buffer_minutes ?? 0);
        }
        const staffRes = await getBusinessStaff(appointment.business_id);
        if (staffRes.success && staffRes.data) {
          setStaffList(staffRes.data.filter(s => s.id !== 'admin'));
        }
      } catch { /* ignore */ }
      finally { setLoadingSlots(false); }
    };
    fetchSchedule();
  }, [appointment?.business_id, mode]);

  const serviceDuration = appointment?.services?.duration || 60;

  // Index appointments by date for O(1) lookup
  const cancelApptsByDate = useMemo(() => {
    const map = new Map<string, ApiAppointment[]>();
    for (const appt of appointments) {
      if (!appt.start_time || appt.status === 'cancelled' || appt.status === 'completed') continue;
      const dateKey = new Date(appt.start_time).toLocaleDateString('sv-SE');
      let bucket = map.get(dateKey);
      if (!bucket) { bucket = []; map.set(dateKey, bucket); }
      bucket.push(appt);
    }
    if (appointment) {
      const selfKey = new Date(appointment.start_time).toLocaleDateString('sv-SE');
      let bucket = map.get(selfKey);
      if (!bucket) { bucket = []; map.set(selfKey, bucket); }
      if (!bucket.find(a => a.id === appointment.id)) bucket.push(appointment);
    }
    return map;
  }, [appointments, appointment]);

  const cancelGetConflicting = useCallback(
    (dateStr: string, slotTime: number, slotEndWithBuf: number, staffId?: string): ApiAppointment[] => {
      const dayAppts = cancelApptsByDate.get(dateStr);
      if (!dayAppts) return [];
      return dayAppts.filter(appt => {
        if (!appt.start_time || !appt.end_time) return false;
        if (appt.id === appointment?.id) return false;
        if (staffId && appt.staff_id && appt.staff_id !== staffId) return false;
        const aStart = new Date(appt.start_time).getTime();
        const aEnd = new Date(appt.end_time).getTime();
        if (isNaN(aStart) || isNaN(aEnd)) return false;
        return slotTime < aEnd && slotEndWithBuf > aStart;
      });
    },
    [cancelApptsByDate, appointment]
  );

  const cancelActiveStaffCount = useMemo(
    () => staffList.filter(s => s.is_active).length,
    [staffList]
  );

  useEffect(() => {
    if (!newDate || loadingSlots || !appointment) { setLocalSlots([]); return; }
    const jsDay = new Date(`${newDate}T00:00`).getDay();
    const selectedDay = (jsDay + 6) % 7;
    const todaysHours = businessHours.find(h => h.day_of_week === selectedDay);
    if (!todaysHours || todaysHours.is_closed) { setLocalSlots([]); return; }

    const [startH, startM] = todaysHours.start_time.replace('.', ':').split(':').map(Number);
    const [endH, endM] = todaysHours.end_time.replace('.', ':').split(':').map(Number);
    let businessStart = startH * 60 + startM;
    let businessEnd = endH * 60 + endM;
    if (businessEnd <= businessStart) businessEnd += 24 * 60;

    const interval = Math.max(slotInterval, 15);
    const slots: string[] = [];
    for (let mins = businessStart; mins + serviceDuration <= businessEnd && slots.length < 96; mins += interval) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }

    const available = slots.filter(slot => {
      const slotTime = new Date(`${newDate}T${slot}`).getTime();
      const now = Date.now();
      if (slotTime <= now) return false;
      const slotEnd = slotTime + serviceDuration * 60000;
      const slotEndWithBuf = slotEnd + bufferMinutes * 60000;

      const conflicting = cancelGetConflicting(newDate, slotTime, slotEndWithBuf, rescheduleStaff || undefined);

      if (rescheduleStaff) return conflicting.length === 0;
      if (cancelActiveStaffCount > 0) {
        return conflicting.filter((a: ApiAppointment) => a.staff_id).length < cancelActiveStaffCount;
      }
      return conflicting.length === 0;
    });

    const id = requestAnimationFrame(() => setLocalSlots(available));
    return () => cancelAnimationFrame(id);
  }, [newDate, loadingSlots, businessHours, serviceDuration, slotInterval, bufferMinutes, rescheduleStaff, cancelGetConflicting, cancelActiveStaffCount, appointment]);

  const cancelFullyBookedDates = useMemo(() => {
    if (!appointment) return new Set<string>();
    const result = new Set<string>();
    const maxDays = 90;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();

    for (let d = 0; d < maxDays; d++) {
      const dateMs = todayMs + d * 86400000;
      const date = new Date(dateMs);
      const dateStr = format(date, 'yyyy-MM-dd');
      const bizDay = (date.getDay() + 6) % 7;
      const dayHours = businessHours.find(h => h.day_of_week === bizDay);
      if (!dayHours || dayHours.is_closed) continue;

      const [startH, startM] = dayHours.start_time.replace('.', ':').split(':').map(Number);
      const [endH, endM] = dayHours.end_time.replace('.', ':').split(':').map(Number);
      let businessStart = startH * 60 + startM;
      let businessEnd = endH * 60 + endM;
      if (businessEnd <= businessStart) businessEnd += 24 * 60;
      const interval = Math.max(slotInterval, 15);
      const buf = bufferMinutes;
      let hasAnySlot = false;

      for (let mins = businessStart; mins + serviceDuration <= businessEnd && !hasAnySlot; mins += interval) {
        const slotMs = dateMs + mins * 60000;
        if (slotMs <= todayMs) continue;
        const slotEnd = slotMs + serviceDuration * 60000;
        const slotEndBuf = slotEnd + buf * 60000;

        const conflicting = cancelGetConflicting(dateStr, slotMs, slotEndBuf);

        if (cancelActiveStaffCount > 0) {
          if (conflicting.filter((a: ApiAppointment) => a.staff_id).length < cancelActiveStaffCount) hasAnySlot = true;
        } else if (conflicting.length === 0) hasAnySlot = true;
      }

      if (!hasAnySlot) result.add(dateStr);
    }
    return result;
  }, [businessHours, serviceDuration, slotInterval, bufferMinutes, cancelGetConflicting, cancelActiveStaffCount, appointment]);

  if (!isOpen || !appointment) return null;

  const isWithinMinTime = !isOwner && minCancellationHours > 0 &&
    (new Date(appointment.start_time).getTime() - Date.now()) < minCancellationHours * 3600000;

  const isRescheduleLocked = !isOwner && minRescheduleHours > 0 &&
    (new Date(appointment.start_time).getTime() - Date.now()) < minRescheduleHours * 3600000;

  const handleCancel = async () => {
    if (isWithinMinTime) { toast.error(`Contacta al negocio — solo pueden cancelar con ${minCancellationHours}h de anticipación`); return; }
    setLoading(true);
    toast.loading('Cancelando cita...', { id: 'cancel' });
    const res = await cancelAppointment(appointment.id, reason);
    setLoading(false);
    if (res.success) {
      toast.success('Cita cancelada correctamente', { id: 'cancel' });
      onClose();
    } else {
      toast.error(res.error || 'Error al cancelar', { id: 'cancel' });
    }
  };

  const handleReschedule = async () => {
    if (!newDate || !newTime) { toast.error('Selecciona fecha y hora'); return; }
    if (isRescheduleLocked) { toast.error(`Contacta al negocio — solo pueden reagendar con ${minRescheduleHours}h de anticipación`); return; }
    const startTime = new Date(`${newDate}T${newTime}`);
    const endTime = new Date(startTime.getTime() + serviceDuration * 60000);
    if (startTime <= new Date()) { toast.error('La nueva fecha y hora no puede estar en el pasado'); return; }
    setLoading(true);
    toast.loading('Reprogramando cita...', { id: 'reschedule' });
    const res = await rescheduleAppointment(appointment.id, startTime.toISOString(), endTime.toISOString(), rescheduleStaff || undefined);
    setLoading(false);
    if (res.success) {
      toast.success('Cita reprogramada correctamente', { id: 'reschedule' });
      onClose();
    } else {
      toast.error(res.error || 'Error al reprogramar', { id: 'reschedule' });
    }
  };

  const reset = () => { setMode(null); setReason(''); setNewDate(''); setNewTime(''); };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center px-2 pt-16 sm:pt-0 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div
        className="relative w-full sm:max-w-md max-h-[calc(100dvh-5rem)] sm:max-h-[85vh] bg-white dark:bg-slate-900 rounded-lg shadow-2xl overflow-hidden flex flex-col animate-in sm:zoom-in-95 duration-300"
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
                <button type="button" onClick={reset} className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-primary-600 transition-all">
                  <ChevronLeft className="w-4 h-4" /> Volver
                </button>
              ) : (
                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center">
                  <CalendarIcon className="w-4 h-4 text-primary-500" />
                </div>
              )}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {mode === 'cancel' ? 'Cancelar cita' : mode === 'reschedule' ? 'Reprogramar' : 'Gestionar cita'}
            </span>
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-all active:scale-90">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 min-h-0 px-4 sm:px-5 py-4 space-y-4 scrollbar-fino">
          {/* Appointment summary */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center flex-shrink-0">
              <CalendarIcon className="w-5 h-5 text-primary-500" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate mb-0">
                {appointment.services?.name || 'Cita'}
              </p>
              <p className="text-xs font-medium text-slate-400 truncate mb-0">
                {format(new Date(appointment.start_time), "EEE d MMM · HH:mm", { locale: es })} hs
              </p>
            </div>
          </div>

          {/* Warning: rescheduling confirmed resets status (B1/R5) */}
          {mode === 'reschedule' && appointment.status === 'confirmed' && (
            <div className="flex items-start gap-2.5 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800/50">
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-0">
                Tu cita esta confirmada. Al reprogramar, el negocio debera confirmar nuevamente.
              </p>
            </div>
          )}

          {/* Warning: reschedule lockout */}
          {mode === 'reschedule' && isRescheduleLocked && (
            <div className="flex items-start gap-2.5 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800/50">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs font-medium text-red-700 dark:text-red-300 mb-0">
                Esta cita está dentro del tiempo mínimo de reagendación ({minRescheduleHours}h). Contacta al negocio para gestionar cambios.
              </p>
            </div>
          )}

          {/* Warning: cancellation lockout */}
          {isWithinMinTime && (
            <div className="flex items-start gap-2.5 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800/50">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs font-medium text-red-700 dark:text-red-300 mb-0">
                Esta cita está dentro del tiempo mínimo de cancelación ({minCancellationHours}h). Contacta al negocio para gestionar cambios.
              </p>
            </div>
          )}

          {/* Mode selection */}
          {!mode ? (
            <div className="space-y-2">
              <button type="button" onClick={() => setMode('reschedule')}
                disabled={isRescheduleLocked}
                className={`w-full flex items-center gap-3 p-3.5 rounded-lg border transition-all text-left active:scale-[0.99] ${
                  isRescheduleLocked
                    ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-60 cursor-not-allowed'
                    : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700'
                }`}>
                <div className="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white mb-0">Reprogramar</p>
                  <p className="text-xs text-slate-500 mb-0">
                    {isRescheduleLocked
                      ? `Contacta al negocio (mín. ${minRescheduleHours}h)`
                      : 'Elige una nueva fecha y hora'}
                  </p>
                </div>
              </button>
              <button type="button" onClick={() => setMode('cancel')}
                disabled={isWithinMinTime}
                className={`w-full flex items-center gap-3 p-3.5 rounded-lg border transition-all text-left active:scale-[0.99] ${
                  isWithinMinTime
                    ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-60 cursor-not-allowed'
                    : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-700'
                }`}>
                <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                  <X className="w-4 h-4 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white mb-0">Cancelar cita</p>
                  <p className="text-xs text-slate-500 mb-0">
                    {isWithinMinTime
                      ? `Contacta al negocio (mín. ${minCancellationHours}h)`
                      : 'Esta acción no se puede deshacer'}
                  </p>
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
                  className="w-full h-24 resize-none bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                />
              </div>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="w-full py-3 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-sm font-bold rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 active:scale-[0.98]"
              >
                {loading ? 'Cancelando...' : 'Sí, cancelar cita'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {staffList.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Encargado (opcional)</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    <select value={rescheduleStaff} onChange={e => setRescheduleStaff(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-sm font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all appearance-none"
                    >
                      <option value="">{currentStaffName ? `${currentStaffName} (actual)` : 'No asignado'}</option>
                      {staffList.filter(s => s.is_active && s.id !== appointment?.staff_id).map(s => (
                        <option key={s.id} value={s.id}>{s.full_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Nueva fecha</label>
                <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                  {/* Month nav */}
                  <div className="flex items-center justify-between px-2 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4 text-slate-500" />
                    </button>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {format(calendarMonth, "MMMM yyyy", { locale: es })}
                    </span>
                    <button
                      onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>
                  {/* Day headers */}
                  <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800">
                    {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'].map(d => (
                      <div key={d} className="py-1 text-center text-[10px] font-bold text-slate-400">{d}</div>
                    ))}
                  </div>
                  {/* Day grid */}
                  <div className="grid grid-cols-7">
                    {(() => {
                      const monthStart = startOfMonth(calendarMonth);
                      const monthEnd = endOfMonth(calendarMonth);
                      const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
                      const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
                      const days = eachDayOfInterval({ start: calStart, end: calEnd });
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return days.map((day, i) => {
                        const dayStr = format(day, 'yyyy-MM-dd');
                        const isCurrentMonth = isSameMonth(day, calendarMonth);
                        const isSelected = newDate === dayStr;
                        const isDisabled = day < today;
                        const bizDayOfWeek = (day.getDay() + 6) % 7;
                        const dayHours = businessHours.find(h => h.day_of_week === bizDayOfWeek);
                        const isClosed = !isDisabled && isCurrentMonth && businessHours.length > 0 && dayHours?.is_closed === true;
                        return (
                          <button
                            key={i}
                            type="button"
                            disabled={isDisabled || !isCurrentMonth}
                            onClick={() => { setNewDate(dayStr); setNewTime(''); }}
                            className={`relative flex flex-col items-center justify-center py-1 text-xs font-bold rounded-none transition-colors ${
                              isSelected
                                ? 'bg-primary-600 text-white'
                                : isDisabled || !isCurrentMonth
                                ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                                : isClosed
                                ? 'text-red-400 dark:text-red-500'
                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            <span>{format(day, 'd')}</span>
                            {!isDisabled && isCurrentMonth && (
                              <span className={`w-1 h-1 rounded-full mt-0.5 ${
                                isSelected
                                  ? 'bg-white'
                                  : isClosed
                                    ? 'bg-red-400'
                                    : cancelFullyBookedDates.has(dayStr)
                                      ? 'bg-orange-400'
                                      : 'bg-emerald-400'
                              }`} />
                            )}
                          </button>
                        );
                      });
                    })()}
                  </div>
                  {businessHours.length > 0 && (
                    <div className="flex items-center gap-3 px-2 py-1.5 border-t border-slate-100 dark:border-slate-800">
                      <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" /> Disponible
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                        <span className="w-2 h-2 rounded-full bg-orange-400" /> Sin turnos
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                        <span className="w-2 h-2 rounded-full bg-red-400" /> Cerrado
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Nuevo horario</label>
                {!newDate ? (
                  <div className="py-6 text-center bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                    <CalendarIcon className="w-6 h-6 text-slate-300 dark:text-slate-600 mx-auto mb-1" />
                    <p className="text-xs font-medium text-slate-400 italic mb-0">Selecciona una fecha primero</p>
                  </div>
                ) : loadingSlots ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : localSlots.length === 0 ? (
                  <div className="py-6 text-center bg-amber-50 dark:bg-amber-500/10 rounded-lg border border-dashed border-amber-200 dark:border-amber-800">
                    <Clock className="w-6 h-6 text-amber-400 mx-auto mb-1" />
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-0">No hay turnos disponibles este día</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1 scrollbar-fino">
                    {localSlots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setNewTime(slot)}
                        className={`py-2.5 text-xs font-black rounded-lg border-2 transition-all active:scale-95 ${
                          newTime === slot
                            ? 'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-500/30'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-primary-400 dark:hover:border-primary-600'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={handleReschedule}
                disabled={loading || !newDate || !newTime}
                className="w-full py-3 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white text-sm font-bold rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20 active:scale-[0.98]"
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
