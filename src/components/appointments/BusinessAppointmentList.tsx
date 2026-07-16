import React, { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import AppointmentModal from './AppointmentModal';
import { Appointment, AppointmentStatus } from '../../types/appointment';
import { getStatusText } from '../../utils/appointmentUtils';
import { Star, Clock, Calendar, User, ChevronRight } from 'lucide-react';

interface BusinessAppointmentListProps {
  appointments: Appointment[];
  onStatusChange?: (id: string, status: AppointmentStatus) => void;
  onReschedule?: (appointment: Appointment) => void;
  showReviewSection?: boolean;
}

const statusStyles: Record<string, { dot: string; bg: string; text: string; border: string }> = {
  confirmed: {
    dot: 'bg-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  pending: {
    dot: 'bg-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
  },
  cancelled: {
    dot: 'bg-red-500',
    bg: 'bg-red-50 dark:bg-red-500/10',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
  },
  completed: {
    dot: 'bg-slate-400',
    bg: 'bg-slate-50 dark:bg-slate-800',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-200 dark:border-slate-700',
  },
};

const BusinessAppointmentList: React.FC<BusinessAppointmentListProps> = ({
  appointments,
  onStatusChange,
  onReschedule,
  showReviewSection = false,
}) => {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const handleStatusChange = (status: AppointmentStatus) => {
    if (selectedAppointment && onStatusChange) {
      onStatusChange(selectedAppointment.id, status);
    }
  };

  return (
    <>
      <div className="space-y-4">
        {appointments.map((appointment, index) => {
          const styles = statusStyles[appointment.status] || statusStyles.pending;
          const date = new Date(appointment.start_time);

          return (
            <div
              key={appointment.id}
              className="group relative bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 cursor-pointer"
              style={{ animationDelay: `${index * 60}ms` }}
              onClick={() => setSelectedAppointment(appointment)}
            >
              <div className={`h-1.5 rounded-t-2xl ${styles.dot} opacity-60`} />

              <div className="p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1 min-w-0 space-y-3">
                    {/* Service + Status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="text-lg font-black text-slate-900 dark:text-white truncate">
                          {appointment.services?.name}
                        </h4>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border shadow-sm flex-shrink-0 ${styles.bg} ${styles.text} ${styles.border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
                        {getStatusText(appointment.status)}
                      </span>
                    </div>

                    {/* Client */}
                    <div className="flex items-start gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-primary-500 dark:text-primary-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-primary-600 dark:text-primary-400 mb-0">
                          {appointment.profiles?.full_name || 'Cliente'}
                        </p>
                        <p className="text-xs font-medium text-slate-400 mb-0">
                          {appointment.services?.duration && `${appointment.services.duration} min`}
                          {appointment.services?.duration && appointment.services?.price !== undefined && appointment.services.price > 0 && (
                            <> · ${appointment.services.price.toLocaleString()}</>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{format(date, "EEEE d 'de' MMMM", { locale: es })}</span>
                      <span className="mx-1 text-slate-300 dark:text-slate-600">·</span>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{format(date, 'HH:mm', { locale: es })}</span>
                    </div>
                  </div>

                  {/* Review badge + chevron */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {showReviewSection && appointment.status === 'completed' && (
                      appointment.review ? (
                        <div className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 rounded-lg border border-amber-200 dark:border-amber-800">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                          <span className="text-xs font-black text-amber-700 dark:text-amber-400">{appointment.review.rating}.0</span>
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sin reseña</span>
                      )
                    )}
                    <div className="p-2 rounded-lg text-slate-400 group-hover:text-primary-500 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-all">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <AppointmentModal
        isOpen={!!selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        appointment={selectedAppointment}
        onStatusChange={handleStatusChange}
        onReschedule={onReschedule}
        showReviewSection={showReviewSection}
      />
    </>
  );
};

export default BusinessAppointmentList;
