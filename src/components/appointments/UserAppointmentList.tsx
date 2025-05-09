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
    <div className="space-y-4">
      <div>
        {appointments.map((appointment) => (
          <div key={appointment.id} className="user-appointment-entry">
            <div className="user-appointment-content">
              <div className="user-appointment-info">
                <h4 className="user-appointment-title">
                  <Link
                    to={`/${slugify(appointment.businesses?.name || '')}`}
                    className="hover:text-indigo-600"
                  >
                    {appointment.businesses?.name}
                  </Link>
                </h4>
                <p className="user-appointment-subtitle">
                  {appointment.services?.name}
                </p>
                <p className="user-appointment-time">
                  {format(new Date(appointment.start_time), "PPP p", { locale: es })}
                </p>
              </div>
              <div className='flex flex-col'>
                <div className='mb-2 self-end'>
                  <span className={`px-2 py-1 text-sm font-medium rounded-full inline-flex self-center items-center justify-center ${appointment.status === 'confirmed'
                    ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                    : appointment.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                      : appointment.status === 'cancelled'
                        ? 'bg-red-800 text-red-100'
                        : 'bg-blue-800 text-white'
                    }`}>
                    {getStatusText(appointment.status)}
                  </span>
                </div>
                <div className="user-appointment-actions">
                  {showActions && (
                    <>
                      {['pending', 'confirmed'].includes(appointment.status) && onCancel && (
                        <button
                          onClick={() => onCancel(appointment)}
                          className="btn-cancel"
                        >
                          Cancelar
                        </button>
                      )}
                      {['pending', 'confirmed', 'cancelled'].includes(appointment.status) && onReschedule && (
                        <button
                          onClick={() => onReschedule(appointment)}
                          className="btn-reschedule"
                        >
                          Reagendar
                        </button>
                      )}
                      {onReview && appointment.status === 'completed' && (
                        <div className="flex flex-col gap-2">
                          {appointment.review ? (
                            <div className="flex items-center space-x-1">
                              {Array.from({ length: appointment.review.rating }).map((_, i) => (
                                <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                              ))}
                              {Array.from({ length: 5 - appointment.review.rating }).map((_, i) => (
                                <Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />
                              ))}
                            </div>
                          ) : (
                            <button
                              onClick={() => onReview(appointment)}
                              className="btn-review"
                            >
                              Dejar Reseña
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserAppointmentList; 