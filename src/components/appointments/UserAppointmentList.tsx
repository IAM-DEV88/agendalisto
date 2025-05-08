import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { Appointment, AppointmentStatus } from '../../types/appointment';

interface UserAppointmentListProps {
  appointments: Appointment[];
  onReschedule?: (appointment: Appointment) => void;
  onCancel?: (appointment: Appointment) => void;
  onReview?: (appointment: Appointment) => void;
  showActions?: boolean;
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

const UserAppointmentList: React.FC<UserAppointmentListProps> = ({
  appointments,
  onReschedule,
  onCancel,
  onReview,
  showActions = true,
  currentPage,
  itemsPerPage,
  onPageChange,
}) => {
  // Utility to generate URL slug from business name
  const slugify = (str: string) => str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');

  // Pagination component
  const Pagination = () => {
    const totalPages = Math.ceil(appointments.length / itemsPerPage);
    if (totalPages <= 1) return null;

    return (
      <div className="flex justify-center mt-4">
        <nav className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded-md bg-gray-50 border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-3 py-1 rounded-md ${
                currentPage === page
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-50 border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded-md bg-gray-50 border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Siguiente
          </button>
        </nav>
      </div>
    );
  };

  const getStatusText = (status: AppointmentStatus) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'confirmed':
        return 'Confirmada';
      case 'completed':
        return 'Completada';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-4">
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {appointments
          .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
          .map((appointment) => (
            <div key={appointment.id} className="list-entry">
              <div className="list-entry-content">
                <div className="list-entry-info">
                  <h4 className="list-entry-title">
                    {appointment.businesses?.name ? (
                      <Link
                        to={`/${slugify(appointment.businesses.name)}`}
                        className="hover:text-indigo-600"
                      >
                        {appointment.businesses.name}
                      </Link>
                    ) : (
                      'Negocio sin nombre'
                    )}
                  </h4>
                  <p className="list-entry-subtitle">
                    {appointment.services?.name || 'Servicio sin nombre'} - {appointment.services?.duration || 0} min
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
      <Pagination />
    </div>
  );
};

export default UserAppointmentList; 