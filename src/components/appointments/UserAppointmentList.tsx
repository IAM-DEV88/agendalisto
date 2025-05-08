import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { Appointment } from '../../types/appointment';
import { getStatusText } from '../../utils/appointmentUtils';

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
          <div key={appointment.id} className="list-entry">
            <div className="list-entry-content">
              <div className="list-entry-info">
                <h4 className="list-entry-title">
                  <Link
                    to={`/${slugify(appointment.businesses?.name || '')}`}
                    className="hover:text-indigo-600"
                  >
                    {appointment.businesses?.name}
                  </Link>
                </h4>
                <p className="list-entry-subtitle">
                  {appointment.services?.name}
                </p>
              </div>
              <div className="list-entry-time">
                {format(new Date(appointment.start_time), "PPP p", { locale: es })}
              </div>
              <div className='self-center'>
                <span className={`px-2 py-1 text-sm font-medium rounded-sm inline-flex self-center items-center justify-center ${
                  appointment.status === 'confirmed' 
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
            </div>
            
            <div className="list-entry-actions">
              
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
                  {appointment.status === 'completed' && onReview && !appointment.review && (
                    <button
                      onClick={() => onReview(appointment)}
                      className="btn-review"
                    >
                      Dejar reseña
                    </button>
                  )}
                </>
              )}
              {appointment.review && (
                <span className="text-yellow-400 text-sm">
                  {'★'.repeat(appointment.review.rating)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserAppointmentList; 