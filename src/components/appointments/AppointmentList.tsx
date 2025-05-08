import React, { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import AppointmentModal from './AppointmentModal';
import { Appointment, AppointmentStatus } from '../../types/appointment';
import { getStatusText } from '../../utils/appointmentUtils';

interface AppointmentListProps {
  appointments: Appointment[];
  onStatusChange?: (id: string, status: AppointmentStatus) => void;
  showReviewSection?: boolean;
}

const AppointmentList: React.FC<AppointmentListProps> = ({
  appointments,
  onStatusChange,
  showReviewSection = false,
}) => {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const handleStatusChange = (status: AppointmentStatus) => {
    if (selectedAppointment && onStatusChange) {
      onStatusChange(selectedAppointment.id, status);
    }
  };

  return (
    <div>
      {appointments.map((appointment) => (
        <div
          key={appointment.id}
          className="list-entry"
          onClick={() => setSelectedAppointment(appointment)}
        >
          <div className="list-entry-content">
            <div className="list-entry-info">
              <h4 className="list-entry-title">
                {appointment.services?.name}
              </h4>
              <p className="list-entry-subtitle">
                {appointment.profiles?.full_name}
              </p>
            </div>
            <div className="list-entry-time">
              {format(new Date(appointment.start_time), "PPP p", { locale: es })}
            </div>
          <div className="list-entry-actions">
            <span className={`px-2 py-1 text-sm font-medium rounded-sm inline-flex items-center justify-center ${
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
            {appointment.review && (
              <span className="text-yellow-400 text-sm">
                {'★'.repeat(appointment.review.rating)}
              </span>
            )}
          </div>
          </div>
          
        </div>
      ))}

      <AppointmentModal
        isOpen={!!selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        appointment={selectedAppointment}
        onStatusChange={handleStatusChange}
        showReviewSection={showReviewSection}
      />
    </div>
  );
};

export default AppointmentList; 