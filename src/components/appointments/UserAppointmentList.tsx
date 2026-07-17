import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { Appointment } from '../../types/appointment';
import { getStatusText } from '../../utils/appointmentUtils';
import { Star, Clock, Calendar, MapPin, XCircle, RefreshCw, ChevronRight, User } from 'lucide-react';

interface UserAppointmentListProps {
  appointments: Appointment[];
  onReschedule?: (appointment: Appointment) => void;
  onCancel?: (appointment: Appointment) => void;
  onReview?: (appointment: Appointment) => void;
  showActions?: boolean;
  indexOffset?: number;
}

const statusConfig: Record<string, { dot: string; label: string }> = {
  confirmed: { dot: 'bg-emerald-500', label: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-800' },
  pending: { dot: 'bg-amber-500', label: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-800' },
  cancelled: { dot: 'bg-red-500', label: 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-800' },
  completed: { dot: 'bg-slate-400', label: 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700' },
};

const UserAppointmentList: React.FC<UserAppointmentListProps> = ({
  appointments,
  onReschedule,
  onCancel,
  onReview,
  showActions = true,
  indexOffset = 0,
}) => {
  return (
    <div className="space-y-3">
      {appointments.map((appointment, index) => {
        const cfg = statusConfig[appointment.status] || statusConfig.pending;
        const date = new Date(appointment.start_time);
        return (
          <div
            key={appointment.id}
            className="group bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-lg transition-all duration-200 animate-in fade-in slide-in-from-bottom-2"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-black text-slate-500 dark:text-slate-300 flex-shrink-0">
                {indexOffset + index + 1}
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-white truncate flex-1 min-w-0">
                <Link
                  to={`/${appointment.businesses?.slug || ''}`}
                  className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  {appointment.businesses?.name}
                </Link>
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${cfg.label}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {getStatusText(appointment.status)}
              </span>
            </div>

            <div className="p-4 sm:p-5">
              <div className="flex flex-row sm:items-start gap-4">
                <div className="flex-1 min-w-0 space-y-2">
                  {appointment.businesses?.address && (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 dark:text-slate-500">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{appointment.businesses.address}</span>
                    </div>
                  )}

                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                      <ChevronRight className="w-4 h-4 text-primary-500 dark:text-primary-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-primary-600 dark:text-primary-400 mb-0">
                        {appointment.services?.name}
                      </p>
                      <div className="flex items-center gap-3 text-xs font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                        {appointment.services?.duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {appointment.services.duration} min
                          </span>
                        )}
                        {appointment.services && (appointment.services?.price ?? 0) > 0 && (
                          <span className="font-black text-slate-700 dark:text-slate-300">
                            ${appointment.services.price.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {appointment.staff_member && (
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                        <User className="w-3.5 h-3.5 text-primary-400" />
                        <span>{appointment.staff_member.full_name}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{format(date, "EEEE d 'de' MMMM, yyyy", { locale: es })}</span>
                    <span className="mx-1.5 text-slate-300 dark:text-slate-600">·</span>
                    <Clock className="w-3.5 h-3.5" />
                    <span>{format(date, 'HH:mm', { locale: es })}</span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-stretch gap-2 sm:min-w-[130px]">
                  {showActions && (
                    <>
                      {(appointment.status === 'pending' || appointment.status === 'confirmed') && onCancel && (
                        <button
                          onClick={() => onCancel(appointment)}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 text-[11px] font-black rounded-lg transition-all active:scale-95 uppercase tracking-wider"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Cancelar
                        </button>
                      )}
                      {(appointment.status === 'pending' || appointment.status === 'confirmed' || appointment.status === 'cancelled') && onReschedule && (
                        <button
                          onClick={() => onReschedule(appointment)}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-black rounded-lg transition-all active:scale-95 uppercase tracking-wider"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Reagendar
                        </button>
                      )}
                      {appointment.status === 'completed' && onReview && (
                        appointment.review ? (
                          appointment.review.status === 'pending' ? (
                            <div className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-50 dark:bg-amber-500/10 rounded-lg border border-amber-200 dark:border-amber-800">
                              <Star className="w-3.5 h-3.5 text-amber-500" />
                              <span className="text-[11px] font-black text-amber-600 dark:text-amber-400">Pendiente</span>
                            </div>
                          ) : appointment.review.status === 'rejected' ? (
                            <button
                              onClick={() => onReview(appointment)}
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-black rounded-lg transition-all shadow-lg shadow-amber-500/25 active:scale-95 uppercase tracking-wider"
                            >
                              <Star className="w-3.5 h-3.5" />
                              Reseñar
                            </button>
                          ) : (
                            <div className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-50 dark:bg-amber-500/10 rounded-lg border border-amber-200 dark:border-amber-800">
                              <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                              <span className="text-[11px] font-black text-amber-700 dark:text-amber-400">{appointment.review.rating}.0</span>
                            </div>
                          )
                        ) : (
                          <button
                            onClick={() => onReview(appointment)}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-black rounded-lg transition-all shadow-lg shadow-amber-500/25 active:scale-95 uppercase tracking-wider"
                          >
                            <Star className="w-3.5 h-3.5" />
                            Reseña
                          </button>
                        )
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default UserAppointmentList;
