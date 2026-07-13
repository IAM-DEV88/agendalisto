import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { Appointment, AppointmentStatus } from '../../types/appointment';
import { getStatusText } from '../../utils/appointmentUtils';
import AppointmentModal from './AppointmentModal';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  GripVertical,
} from 'lucide-react';
import { BusinessHours } from '../../lib/api';

interface AppointmentCalendarProps {
  appointments: Appointment[];
  onStatusChange?: (id: string, status: AppointmentStatus) => void;
  onReschedule?: (id: string, startTime: string, endTime: string) => Promise<{ success: boolean; error?: string }>;
  onCancel?: (appointment: Appointment) => void;
  isOwner?: boolean;
  businessHours?: BusinessHours[];
}

const statusDot: Record<string, string> = {
  pending: 'bg-amber-500',
  confirmed: 'bg-emerald-500',
  completed: 'bg-slate-400',
  cancelled: 'bg-red-400',
};

const statusChipBg: Record<string, string> = {
  pending: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400',
  confirmed: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400',
  completed: 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400',
  cancelled: 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400',
};

interface DragState {
  appointmentId: string;
  originalStart: string;
  originalEnd: string;
  ghostEl: HTMLDivElement | null;
}

const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({
  appointments,
  onStatusChange,
  onReschedule,
  onCancel,
  isOwner,
  businessHours,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [rescheduling, setRescheduling] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const dragRef = useRef<DragState | null>(null);
  const lastHoveredCell = useRef<string | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const dayHeaders = ['Lun', 'Mar', 'Mié', 'Jun', 'Vie', 'Sáb', 'Dom'];

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const getAppointmentsForDay = (day: Date) =>
    appointments.filter(a => isSameDay(new Date(a.start_time), day));

  const statusCounts = (day: Date) => {
    const dayAppts = getAppointmentsForDay(day);
    const counts: Record<string, number> = {};
    dayAppts.forEach(a => {
      counts[a.status] = (counts[a.status] || 0) + 1;
    });
    return counts;
  };

  const allStatuses: AppointmentStatus[] = ['pending', 'confirmed', 'completed', 'cancelled'];
  const statusOrder: AppointmentStatus[] = ['pending', 'confirmed', 'completed', 'cancelled'];

  const handleCellClick = (day: Date) => {
    if (dragRef.current) return;
    setSelectedDate(prev => (prev && isSameDay(prev, day)) ? null : day);
  };

  const findCalendarDayStr = useCallback((x: number, y: number): string | null => {
    const elements = document.elementsFromPoint(x, y);
    for (const el of elements) {
      const cell = (el as HTMLElement).closest('[data-day]');
      if (cell) return cell.getAttribute('data-day');
    }
    return null;
  }, []);

  const finishDrag = useCallback(() => {
    const drag = dragRef.current;
    if (!drag) return;
    if (drag.ghostEl) {
      drag.ghostEl.remove();
    }
    dragRef.current = null;
    lastHoveredCell.current = null;
    setDraggingId(null);
    setDragOverDate(null);
  }, []);

  const handleMouseUp = useCallback(async (e: MouseEvent) => {
    const drag = dragRef.current;
    if (!drag) return;

    const targetDayStr = findCalendarDayStr(e.clientX, e.clientY);
    finishDrag();

    if (!targetDayStr || !onReschedule) return;

    const targetDay = new Date(targetDayStr + 'T00:00:00');
    const originalStart = new Date(drag.originalStart);
    if (isSameDay(originalStart, targetDay)) return;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    if (targetDay < todayStart) {
      toast.error('No se puede reagendar a una fecha pasada');
      return;
    }

    if (!isOwner) {
      const appointment = appointments.find(a => a.id === drag.appointmentId);
      const minRescheduleHours = appointment?.services?.min_reschedule_hours ?? 48;
      if (minRescheduleHours > 0) {
        const lockoutTime = new Date(originalStart.getTime() - minRescheduleHours * 60 * 60 * 1000);
        if (new Date() > lockoutTime) {
          toast.error(`Contacta al negocio — solo pueden reagendar con ${minRescheduleHours}h de anticipación`);
          return;
        }
      }
    }

    const originalEnd = new Date(drag.originalEnd);
    const duration = originalEnd.getTime() - originalStart.getTime();

    const newStart = new Date(targetDay);
    newStart.setHours(originalStart.getHours(), originalStart.getMinutes(), 0, 0);
    const newEnd = new Date(newStart.getTime() + duration);

    if (newStart <= new Date()) {
      toast.error('La nueva fecha y hora no puede estar en el pasado');
      return;
    }

    setRescheduling(true);
    toast.loading('Reprogramando cita...', { id: 'reschedule' });
    try {
      const result = await onReschedule(drag.appointmentId, newStart.toISOString(), newEnd.toISOString());
      if (result.success) {
        toast.success('Cita reprogramada correctamente', { id: 'reschedule' });
      } else {
        toast.error(result.error || 'Error al reprogramar', { id: 'reschedule' });
      }
    } catch {
      toast.error('Error al reprogramar la cita', { id: 'reschedule' });
    } finally {
      setRescheduling(false);
    }
  }, [onReschedule, findCalendarDayStr, finishDrag, appointments, isOwner]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const drag = dragRef.current;
    if (!drag) return;

    if (drag.ghostEl) {
      drag.ghostEl.style.left = `${e.clientX + 12}px`;
      drag.ghostEl.style.top = `${e.clientY + 12}px`;
    }

    const dayStr = findCalendarDayStr(e.clientX, e.clientY);
    if (dayStr !== lastHoveredCell.current) {
      lastHoveredCell.current = dayStr;
      setDragOverDate(dayStr);
    }
  }, [findCalendarDayStr]);

  useEffect(() => {
    if (!draggingId) return;
    const onWindowBlur = () => finishDrag();
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('blur', onWindowBlur);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('blur', onWindowBlur);
    };
  }, [draggingId, handleMouseMove, handleMouseUp, finishDrag]);

  useEffect(() => {
    return () => finishDrag();
  }, [finishDrag]);

  const handleDragStart = (e: React.MouseEvent, appointment: Appointment) => {
    e.preventDefault();
    e.stopPropagation();

    const ghost = document.createElement('div');
    ghost.className = 'fixed z-[9999] pointer-events-none px-3 py-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white max-w-[200px] truncate';
    ghost.textContent = appointment.services?.name || 'Cita';
    ghost.style.left = `${e.clientX + 12}px`;
    ghost.style.top = `${e.clientY + 12}px`;
    document.body.appendChild(ghost);

    dragRef.current = {
      appointmentId: appointment.id,
      originalStart: appointment.start_time,
      originalEnd: appointment.end_time,
      ghostEl: ghost,
    };
    setDraggingId(appointment.id);
  };

  const today = new Date();
  const selectedDayAppts = selectedDate ? getAppointmentsForDay(selectedDate) : [];

  return (
    <div className="space-y-5">
      <div className="md:grid md:grid-cols-3 md:gap-5">
        {/* ─── Left Column: Calendar ─── */}
        <div className="md:col-span-2 space-y-5 min-w-0">
          {/* Month Navigation */}
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 rounded-xl transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-0">
              {format(currentMonth, "MMMM yyyy", { locale: es })}
            </h3>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 rounded-xl transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800">
              {dayHeaders.map(d => (
                <div
                  key={d}
                  className="py-2 text-center text-[10px] font-black uppercase tracking-widest text-slate-400"
                >
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {days.map((day, i) => {
                const dayStr = format(day, 'yyyy-MM-dd');
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isToday = isSameDay(day, today);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isDragOver = dragOverDate === dayStr;
                const counts = statusCounts(day);
                const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                const bizDayOfWeek = (day.getDay() + 6) % 7;
                const dayHours = businessHours?.find(h => h.day_of_week === bizDayOfWeek);
                const isClosedDay = businessHours?.length
                  ? dayHours?.is_closed !== false
                  : isWeekend;

                return (
                  <div
                    key={i}
                    data-day={dayStr}
                    className={`relative min-h-[72px] sm:min-h-[88px] border-b border-r border-slate-50 dark:border-slate-800/50 p-1.5 transition-colors cursor-pointer select-none ${
                      isCurrentMonth
                        ? 'hover:bg-primary-50/50 dark:hover:bg-primary-900/10'
                        : 'bg-slate-50/50 dark:bg-slate-900/50'
                    } ${
                      isSelected
                        ? 'ring-2 ring-inset ring-primary-500/40 bg-primary-50/30 dark:bg-primary-900/20'
                        : ''
                    } ${
                      isDragOver
                        ? 'ring-2 ring-inset ring-emerald-500/60 bg-emerald-50/40 dark:bg-emerald-900/20'
                        : ''
                    }`}
                    onClick={() => handleCellClick(day)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs font-bold leading-none ${
                          isToday
                            ? 'bg-primary-600 text-white w-6 h-6 flex items-center justify-center rounded-full'
                            : isCurrentMonth
                            ? isClosedDay
                              ? 'text-red-400 dark:text-red-500'
                              : 'text-slate-700 dark:text-slate-300'
                            : 'text-slate-300 dark:text-slate-600'
                        }`}
                      >
                        {format(day, 'd')}
                      </span>
                      {totalCount > 0 && (
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 leading-none">
                          {totalCount}
                        </span>
                      )}
                    </div>

                    {totalCount > 0 && (
                      <div className="flex flex-wrap gap-0.5 mt-auto">
                        {statusOrder.map(s => {
                          if (!counts[s]) return null;
                          return (
                            <div
                              key={s}
                              className={`w-1.5 h-1.5 rounded-full ${statusDot[s]} ${
                                s === 'completed' || s === 'cancelled' ? 'opacity-50' : ''
                              }`}
                              title={`${counts[s]} ${getStatusText(s as AppointmentStatus)}`}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-[11px] font-bold text-slate-500 dark:text-slate-400">
            {allStatuses.map(s => (
              <span key={s} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${statusDot[s]}`} />
                {getStatusText(s)}
              </span>
            ))}
          </div>
        </div>

        {/* ─── Right Column: Selected Day ─── */}
        <div className="md:col-span-1">
          {selectedDate && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 md:sticky md:top-44 pt-6 md:pt-0">
              {/* Day header */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center shrink-0">
                  <CalendarIcon className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 truncate mb-0">
                    {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
                  </h4>
                  <p className="text-[11px] font-bold text-slate-400 mb-0">
                    {selectedDayAppts.length} cita{selectedDayAppts.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {selectedDayAppts.map((appt) => {
                  const date = new Date(appt.start_time);
                  const canDrag = !!onReschedule && appt.status !== 'cancelled' && appt.status !== 'completed';
                  return (
                    <div
                      key={appt.id}
                      onClick={() => !draggingId && setSelectedAppointment(appt)}
                      className={`group relative bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-lg transition-all duration-200 ${
                        canDrag ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                      } ${draggingId === appt.id ? 'opacity-40' : ''}`}
                    >
                      <div className="flex items-start gap-3 p-3 sm:p-4">
                        {canDrag && (
                          <div
                            data-swipe-block
                            className="mt-0.5 text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 cursor-grab active:cursor-grabbing touch-none"
                            onMouseDown={(e) => handleDragStart(e, appt)}
                          >
                            <GripVertical className="w-4 h-4" />
                          </div>
                        )}

                        <div className={`w-1 self-stretch rounded-full shrink-0 ${statusDot[appt.status]} ${appt.status === 'completed' || appt.status === 'cancelled' ? 'opacity-50' : ''}`} />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate mb-0">
                              {appt.services?.name || 'Servicio'}
                            </p>
                            <span className={`shrink-0 px-2 py-0.5 text-[10px] font-bold rounded-full border ${statusChipBg[appt.status] || ''}`}>
                              {getStatusText(appt.status)}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {appt.profiles?.full_name || 'Cliente'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(date, 'HH:mm')} hs
                            </span>
                            {appt.services?.duration && (
                              <span className="text-slate-400">{appt.services.duration} min</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Desktop: prompt when no day selected */}
          {!selectedDate && (
            <div className="hidden md:flex flex-col items-center justify-center h-full min-h-[240px] bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center">
              <CalendarIcon className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-sm font-bold text-slate-400 dark:text-slate-500">
                Selecciona un día
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">
                para ver sus citas
              </p>
            </div>
          )}
        </div>
      </div>

      <AppointmentModal
        isOpen={!!selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        appointment={selectedAppointment}
        onStatusChange={onStatusChange ? (status) => {
          if (selectedAppointment) {
            onStatusChange(selectedAppointment.id, status);
          }
          setSelectedAppointment(null);
        } : undefined}
        onCancel={onCancel}
        showReviewSection={true}
      />

      {rescheduling && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Reprogramando cita...
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentCalendar;
