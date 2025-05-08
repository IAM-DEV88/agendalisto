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
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
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
            </div>
            
            <div className="list-entry-actions">
              <span className={`status-${appointment.status}`}>
                {getStatusText(appointment.status)}
              </span>
              {showActions && (
                <div className="flex gap-2 mt-2">
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
                </div>
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