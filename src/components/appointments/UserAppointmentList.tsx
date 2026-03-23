import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { Appointment } from '../../types/appointment';
import { getStatusText } from '../../utils/appointmentUtils';
import { Star } from 'lucide-react';

interface UserAppointmentListProps {
  appointments: Appointment[];
  onReschedule?: (appointment: Appointment) => void;
  onCancel?: (appointment: Appointment) => void;
  onReview?: (appointment: Appointment) => void;
  showActions?: boolean;
}

const UserAppointmentList: React.FC<UserAppointmentListProps> = ({
  appointments,
  onReschedule,
  onCancel,
  onReview,
  showActions = true,
}) => {
  // Utility to generate URL slug from business name
  const slugify = (str: string) => str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');

  return (
    <div className="grid gap-4">
      {appointments.map((appointment) => (
        <div key={appointment.id} className="card p-5 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-xl transition-all group">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-lg font-black text-slate-900 dark:text-white truncate">
                  <Link
                    to={`/${appointment.businesses?.slug || ''}`}
                    className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    {appointment.businesses?.name}
                  </Link>
                </h4>
                <span className={`px-2 py-0.5 text-[10px] font-black rounded-lg uppercase tracking-tighter shadow-sm border ${
                  appointment.status === 'confirmed' 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800'
                    : appointment.status === 'pending'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                    : appointment.status === 'cancelled'
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800'
                    : 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 border-primary-200 dark:border-primary-800'
                }`}>
                  {getStatusText(appointment.status)}
                </span>
              </div>
              <p className="text-sm font-bold text-primary-600 dark:text-primary-400 mb-2">
                {appointment.services?.name}
              </p>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center">
                <svg className="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {format(new Date(appointment.start_time), "PPP p", { locale: es })}
              </p>
            </div>

            <div className="flex flex-col sm:items-end gap-3 w-full sm:w-auto">
              {showActions && (
                <div className="flex flex-wrap gap-2">
                  {['pending', 'confirmed'].includes(appointment.status) && onCancel && (
                    <button
                      onClick={() => onCancel(appointment)}
                      className="px-4 py-1.5 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 text-xs font-black rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-all uppercase tracking-wider"
                    >
                      Cancelar
                    </button>
                  )}
                  {['pending', 'confirmed', 'cancelled'].includes(appointment.status) && onReschedule && (
                    <button
                      onClick={() => onReschedule(appointment)}
                      className="px-4 py-1.5 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 text-xs font-black rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all uppercase tracking-wider"
                    >
                      Reagendar
                    </button>
                  )}
                  {onReview && appointment.status === 'completed' && (
                    <div className="flex flex-col gap-2">
                      {appointment.review ? (
                        <div className="flex bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-xl border border-amber-100 dark:border-amber-900/30 items-center gap-1">
                          <Star className="h-3.5 w-3.5 text-amber-500 fill-current" />
                          <span className="text-xs font-black text-amber-700 dark:text-amber-400">{appointment.review.rating}.0</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => onReview(appointment)}
                          className="px-4 py-1.5 bg-amber-500 text-white text-xs font-black rounded-xl shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all uppercase tracking-wider"
                        >
                          Dejar Reseña
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default UserAppointmentList; 