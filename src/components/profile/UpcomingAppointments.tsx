import React from 'react';
import { Link } from 'react-router-dom';
import { Appointment } from '../../lib/api';

interface UpcomingAppointmentsProps {
  appointments: Appointment[];
  loading: boolean;
  currentPage: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  onReschedule: (appointment: Appointment) => void;
  onCancel: (appointment: Appointment) => void;
}

// Helper to generate slug from business name
const slugify = (str: string): string =>
  str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '');

const UpcomingAppointments: React.FC<UpcomingAppointmentsProps> = ({
  appointments,
  loading,
  currentPage,
  onPageChange,
  itemsPerPage,
  onReschedule,
  onCancel
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
  };

  // Componente de paginación
  const Pagination = ({ currentPage, totalItems, onPageChange }: { currentPage: number, totalItems: number, onPageChange: (page: number) => void }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
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
              className={`px-3 py-1 rounded-md ${currentPage === page
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

  return (
    <>
      <div className="mt-2">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : appointments.length === 0 ? (
          <div className="dark:bg-opacity-10 bg-gray-50 shadow overflow-hidden sm:rounded-md p-6 text-center">
            <p className="text-gray-500 dark:text-white">No tienes citas programadas.</p>
            <Link to="/explore" className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
              Explorar
            </Link>
          </div>
        ) : (
          <>
            <div className="dark:bg-opacity-10 bg-gray-50 shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {appointments
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((appointment) => (
                    <li key={appointment.id}>
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <p className="text-sm dark:text-white font-medium text-indigo-600 truncate">
                              {appointment.businesses?.name ? (
                                <Link
                                  to={`/${slugify(appointment.businesses.name)}`}
                                  className="hover:text-indigo-700"
                                >
                                  {appointment.businesses.name}
                                </Link>
                              ) : (
                                'Negocio sin nombre'
                              )}
                            </p>
                            <p className={`ml-2 dark:text-black px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                    'bg-blue-100 text-blue-800'}`}>
                              {appointment.status === 'confirmed' ? 'Confirmada' :
                                appointment.status === 'pending' ? 'Pendiente' :
                                  appointment.status === 'cancelled' ? 'Cancelada' : 'Completada'}
                            </p>
                          </div>

                        </div>
                        <div className="mt-2 flex flex-col md:flex-row md:justify-between gap-2 ">
                          <div className="dark:text-white text-sm text-gray-500">
                            {appointment.services?.name || 'Servicio sin nombre'}
                          </div>
                          <div className="dark:text-white text-sm text-gray-500">
                            Duración: {appointment.services?.duration || 0} min
                          </div>
                          <div className="dark:text-white text-sm text-gray-500">
                            {formatDate(appointment.start_time)}
                          </div>
                        </div>
                        <div className="mt-2 flex space-x-2">
                          {['pending', 'confirmed'].includes(appointment.status) && (
                            <>
                              <button
                                onClick={() => onReschedule(appointment)}
                                className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-50"
                              >
                                Reagendar
                              </button>
                              <button
                                onClick={() => onCancel(appointment)}
                                className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium text-red-700 bg-gray-50 hover:bg-gray-50"
                              >
                                Cancelar
                              </button>
                            </>
                          )}
                          {appointment.status === 'cancelled' && (
                            <button
                              onClick={() => onReschedule(appointment)}
                              className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-50"
                            >
                              Reagendar
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
            <Pagination
              currentPage={currentPage}
              totalItems={appointments.length}
              onPageChange={onPageChange}
            />
          </>
        )}
      </div>

    </>
  );
};

export default UpcomingAppointments; 
