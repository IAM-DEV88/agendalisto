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
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
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
          </div>
          
          <div className="list-entry-actions">
            <span className={`status-${appointment.status}`}>
              {getStatusText(appointment.status)}
            </span>
            {appointment.review && (
              <span className="text-yellow-400 text-sm">
                {'★'.repeat(appointment.review.rating)}
              </span>
            )}
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