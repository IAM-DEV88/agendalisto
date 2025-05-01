import React from 'react';
import { Star } from 'lucide-react';

interface AppointmentsSectionProps {
  appointments: any[];
  loading: boolean;
  onUpdateStatus: (id: string, status: 'pending' | 'confirmed' | 'completed' | 'cancelled') => Promise<void>;
}

const AppointmentsSection: React.FC<AppointmentsSectionProps> = ({ 
  appointments, 
  loading,
  onUpdateStatus 
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

  return (
    <div>
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : appointments.length === 0 ? (
        <div className="dark:bg-opacity-10 bg-white shadow overflow-hidden sm:rounded-md p-6 text-center">
          <p className="text-gray-500">No hay citas agendadas.</p>
        </div>
      ) : (
        <div className="dark:bg-opacity-10 bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {appointments.map((appointment) => (
              <li key={appointment.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-indigo-600 dark:text-indigo-200">{appointment.services?.name}</p>
                    <p className="text-sm text-gray-500 dark:text-white">Cliente: {appointment.profiles?.full_name || appointment.user_id}</p>
                    <p className="text-sm text-gray-500 dark:text-white">Fecha: {formatDate(appointment.start_time)}</p>
                    {appointment.status === 'completed' && (
                      appointment.review ? (
                        <div className="flex mt-1">
                          {Array.from({ length: appointment.review.rating }).map((_, i) => (
                            <Star key={`star-filled-${i}`} className="h-4 w-4 text-yellow-400" />
                          ))}
                          {Array.from({ length: 5 - appointment.review.rating }).map((_, i) => (
                            <Star key={`star-empty-${i}`} className="h-4 w-4 text-gray-300" />
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-yellow-500 mt-1">Pendiente de reseña</p>
                      )
                    )}
                  </div>
                  <div className="flex space-x-2">
                    {appointment.status === 'pending' && (
                      <>
                        <button 
                          onClick={() => onUpdateStatus(appointment.id, 'confirmed')} 
                          className="px-2.5 py-1.5 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700"
                        >
                          Confirmar
                        </button>
                        <button 
                          onClick={() => onUpdateStatus(appointment.id, 'cancelled')} 
                          className="px-2.5 py-1.5 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700"
                        >
                          Cancelar
                        </button>
                      </>
                    )}
                    {appointment.status === 'confirmed' && (
                      <button 
                        onClick={() => onUpdateStatus(appointment.id, 'completed')} 
                        className="px-2.5 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                      >
                        Completar
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AppointmentsSection; 