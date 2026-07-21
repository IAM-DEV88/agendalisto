import React, { useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Appointment, AppointmentStatus } from '../../types/appointment';
import { getStatusText } from '../../utils/appointmentUtils';
import {
  X, User, Calendar, Clock, MessageSquareText,
  CheckCircle, XCircle, Phone, Mail, Star, CalendarClock,
} from 'lucide-react';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onStatusChange?: (status: AppointmentStatus) => void;
  onReschedule?: (appointment: Appointment) => void;
  showReviewSection?: boolean;
  currentUserId?: string;
}

const statusConfig: Record<string, { dot: string; bg: string; text: string; border: string; icon: React.ReactNode }> = {
  confirmed: {
    dot: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800',
    icon: <CheckCircle className="w-3 h-3" />,
  },
  pending: {
    dot: 'bg-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10',
    text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800',
    icon: <Clock className="w-3 h-3" />,
  },
  cancelled: {
    dot: 'bg-red-500', bg: 'bg-red-50 dark:bg-red-500/10',
    text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-800',
    icon: <XCircle className="w-3 h-3" />,
  },
  completed: {
    dot: 'bg-slate-400', bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-200 dark:border-slate-700',
    icon: <CheckCircle className="w-3 h-3" />,
  },
};

const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onStatusChange,
  onReschedule,
  showReviewSection = false,
  currentUserId,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  useLockBodyScroll(isOpen && !!appointment);
  useFocusTrap(containerRef, isOpen && !!appointment);

  useEffect(() => {
    if (!isOpen || !appointment) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, appointment, onClose]);

  if (!isOpen || !appointment) return null;

  const cfg = statusConfig[appointment.status] || statusConfig.pending;

  const handleStatusChange = (status: AppointmentStatus) => {
    onStatusChange?.(status);
    onClose();
  };

  const startDate = new Date(appointment.start_time);
  const endDate = new Date(appointment.end_time);
  const isSameDay = startDate.toDateString() === endDate.toDateString();

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center px-2 pt-16 sm:pt-0 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 !mt-0"
      role="dialog"
      aria-modal="true"
      aria-labelledby="appt-title"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        className="relative w-full sm:max-w-lg max-h-[calc(100dvh-5rem)] sm:max-h-[85vh] bg-white dark:bg-slate-900 rounded-lg shadow-2xl overflow-hidden animate-in sm:zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle (mobile) */}
        <div className="sm:hidden flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
        </div>

        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between px-4 sm:px-5 py-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
              <div className="min-w-0">
                <h2 id="appt-title" className="text-sm font-bold text-slate-900 dark:text-white truncate mb-0">
                  {appointment.services?.name || 'Cita'}
                </h2>
                <p className="text-[11px] font-medium text-slate-400 truncate mb-0">
                  {appointment.businesses?.name || 'Detalles de la cita'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition-all active:scale-90 flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto scrollbar-fino" style={{ maxHeight: 'calc(92dvh - 60px)' }}>
          <div className="px-4 sm:px-5 py-4 space-y-3">

            {/* Status badge + client name row */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-primary-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate mb-0">
                    {currentUserId && appointment.user_id === currentUserId
                      ? 'Tú'
                      : appointment.profiles?.full_name || appointment.guest_info?.name || (appointment.is_guest ? 'Invitado' : 'Cliente')}
                  </p>
                  <p className="text-[11px] font-medium text-slate-400 mb-0">
                    {appointment.is_guest ? 'Reserva sin cuenta' : currentUserId && appointment.user_id === currentUserId ? 'Tú' : 'Cliente'}
                  </p>
                </div>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border flex-shrink-0 ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {getStatusText(appointment.status)}
              </span>
            </div>

            {/* Info cards grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                <Calendar className="w-3.5 h-3.5 text-primary-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0">Fecha</p>
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {format(startDate, "EEE d MMM", { locale: es })}
                    {!isSameDay && ` - ${format(endDate, "EEE d MMM", { locale: es })}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                <Clock className="w-3.5 h-3.5 text-primary-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0">Horario</p>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {format(startDate, "HH:mm", { locale: es })} - {format(endDate, "HH:mm", { locale: es })} hs
                  </p>
                </div>
              </div>

              {appointment.services?.duration && (
                <div className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                  <Clock className="w-3.5 h-3.5 text-primary-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0">Duración</p>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{appointment.services.duration} min</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                <User className="w-3.5 h-3.5 text-primary-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0">Encargado</p>
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {appointment.staff_member?.full_name || appointment.services?.provider || 'No asignado'}
                  </p>
                </div>
              </div>
              {appointment.services?.price !== undefined && appointment.services.price > 0 && (
                <div className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div className="flex-shrink-0 w-3.5 h-3.5 flex items-center justify-center">
                    <span className="text-xs font-black text-primary-400">$</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0">Precio</p>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      ${appointment.services.price.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Guest/Client contact */}
            {(appointment.is_guest && appointment.guest_info) ? (
              <div className="p-2.5 bg-amber-50/50 dark:bg-amber-500/5 rounded-lg border border-amber-200/50 dark:border-amber-800/30">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1.5">Información de contacto</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
                    <Mail className="w-3 h-3 flex-shrink-0" />
                    <span className="font-medium">{appointment.guest_info.email}</span>
                  </div>
                  {appointment.guest_info.phone && (
                    <div className="flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
                      <Phone className="w-3 h-3 flex-shrink-0" />
                      <span className="font-medium">{appointment.guest_info.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : appointment.profiles?.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                  {appointment.profiles.email}
                </span>
              </div>
            )}

            {/* Notes */}
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <MessageSquareText className="w-3 h-3 text-slate-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Notas</span>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {appointment.notes || (
                    <span className="italic text-slate-400">Sin notas adicionales</span>
                  )}
                </p>
              </div>
            </div>

            {/* Review */}
            {showReviewSection && appointment.review && (
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Star className="w-3 h-3 text-amber-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Reseña</span>
                </div>
                <div className="p-2.5 bg-amber-50/50 dark:bg-amber-500/5 rounded-lg border border-amber-200/50 dark:border-amber-800/30 space-y-1">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${i <= (appointment.review?.rating || 0) ? 'text-amber-500 fill-amber-500' : 'text-slate-200 dark:text-slate-700'}`}
                      />
                    ))}
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400 ml-1">
                      {appointment.review.rating}.0
                    </span>
                  </div>
                  {appointment.review.comment && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      "{appointment.review.comment}"
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Cancel reason */}
            {appointment.status === 'cancelled' && appointment.cancel_reason && (
              <div className="p-2.5 bg-red-50/50 dark:bg-red-500/5 rounded-lg border border-red-200/50 dark:border-red-800/30">
                <div className="flex items-center gap-1.5 mb-1">
                  <XCircle className="w-3 h-3 text-red-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-500">Motivo de cancelación</span>
                </div>
                <p className="text-xs text-red-700 dark:text-red-400">{appointment.cancel_reason}</p>
              </div>
            )}

          </div>

          {/* Actions footer — centralized via gestor de citas */}
          {['pending', 'confirmed'].includes(appointment.status) && onReschedule && (
            <div className="sticky bottom-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 px-4 sm:px-5 py-3">
              {appointment.status === 'pending' ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => { onReschedule(appointment); onClose(); }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-sm font-bold rounded-lg transition-all active:scale-[0.97]"
                  >
                    <CalendarClock className="w-4 h-4" />
                    Gestionar
                  </button>
                  {onStatusChange && (
                    <button
                      onClick={() => handleStatusChange('confirmed')}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-lg shadow-lg shadow-primary-500/20 transition-all active:scale-[0.97]"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Confirmar
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => { onReschedule(appointment); onClose(); }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-sm font-bold rounded-lg transition-all active:scale-[0.97]"
                  >
                    <CalendarClock className="w-4 h-4" />
                    Gestionar
                  </button>
                  {onStatusChange && (
                    <button
                      onClick={() => handleStatusChange('completed')}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.97]"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Completar
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentModal;
