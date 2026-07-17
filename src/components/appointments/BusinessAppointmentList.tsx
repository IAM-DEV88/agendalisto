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
  indexOffset?: number;
  currentUserId?: string;
}

const statusConfig: Record<string, { dot: string; label: string }> = {
  confirmed: { dot: 'bg-emerald-500', label: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-800' },
  pending: { dot: 'bg-amber-500', label: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-800' },
  cancelled: { dot: 'bg-red-500', label: 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-800' },
  completed: { dot: 'bg-slate-400', label: 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700' },
};

const BusinessAppointmentList: React.FC<BusinessAppointmentListProps> = ({
  appointments,
  onStatusChange,
  onReschedule,
  showReviewSection = false,
  indexOffset = 0,
  currentUserId,
}) => {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const handleStatusChange = (status: AppointmentStatus) => {
    if (selectedAppointment && onStatusChange) {
      onStatusChange(selectedAppointment.id, status);
    }
  };

  return (
    <>
      <div className="space-y-3">
        {appointments.map((appointment, index) => {
          const cfg = statusConfig[appointment.status] || statusConfig.pending;
          const date = new Date(appointment.start_time);

          return (
            <div
              key={appointment.id}
              className="group bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-lg transition-all duration-200 cursor-pointer animate-in fade-in slide-in-from-bottom-2"
              style={{ animationDelay: `${index * 60}ms` }}
              onClick={() => setSelectedAppointment(appointment)}
            >
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-black text-slate-500 dark:text-slate-300 flex-shrink-0">
                  {indexOffset + index + 1}
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white truncate flex-1 min-w-0">
                  {appointment.services?.name}
                </span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${cfg.label}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  {getStatusText(appointment.status)}
                </span>
              </div>

              <div className="p-4 sm:p-5">
                <div className="flex flex-row sm:items-start gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-primary-500 dark:text-primary-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-primary-600 dark:text-primary-400 mb-0">
                          {appointment.profiles?.full_name || 'Cliente'}
                        </p>
                        {(appointment.services?.duration || (appointment.services?.price ?? 0) > 0) && (
                          <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-0.5 mb-0">
                            {appointment.services?.duration && `${appointment.services.duration} min`}
                            {appointment.services?.duration && (appointment.services?.price ?? 0) > 0 && <> · ${appointment.services.price.toLocaleString()}</>}
                          </p>
                        )}
                      </div>
                    </div>

                    {appointment.staff_member && (
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                        <User className="w-3.5 h-3.5 text-primary-400" />
                        <span>{appointment.staff_member.full_name}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{format(date, "EEEE d 'de' MMMM", { locale: es })}</span>
                      <span className="mx-1 text-slate-300 dark:text-slate-600">·</span>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{format(date, 'HH:mm', { locale: es })}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    {showReviewSection && appointment.status === 'completed' && (
                      appointment.review ? (
                        <div className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 rounded-lg border border-amber-200 dark:border-amber-800">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                          <span className="text-xs font-black text-amber-700 dark:text-amber-400">{appointment.review.rating}.0</span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sin reseña</span>
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
        currentUserId={currentUserId}
      />
    </>
  );
};

export default BusinessAppointmentList;
