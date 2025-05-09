import React, { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import AppointmentModal from './AppointmentModal';
import { Appointment, AppointmentStatus } from '../../types/appointment';
import { getStatusText } from '../../utils/appointmentUtils';
import { Star } from 'lucide-react';

interface BusinessAppointmentListProps {
  appointments: Appointment[];
  onStatusChange?: (id: string, status: AppointmentStatus) => void;
  showReviewSection?: boolean;
}

const BusinessAppointmentList: React.FC<BusinessAppointmentListProps> = ({
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
    <div className='business-appointments-list'>
      {appointments.map((appointment) => (
        <div
          key={appointment.id}
          className="business-appointment-entry"
          onClick={() => setSelectedAppointment(appointment)}
        >
          <div className="business-appointment-content">
            <div className="business-appointment-info">
              <h4 className="business-appointment-title">
                {appointment.services?.name}
              </h4>
              <p className="business-appointment-subtitle">
                {appointment.profiles?.full_name}
              </p>
              <p className="business-appointment-time">
                {format(new Date(appointment.start_time), "PPP p", { locale: es })}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`px-2 py-1 text-sm font-medium rounded-full inline-flex items-center justify-center ${
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
              {showReviewSection && appointment.status === 'completed' && (
                appointment.review ? (
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: appointment.review.rating }).map((_, i) => (
                      <Star key={`star-filled-${i}`} className="h-4 w-4 text-yellow-400 fill-current" />
                    ))}
                    {Array.from({ length: 5 - appointment.review.rating }).map((_, i) => (
                      <Star key={`star-empty-${i}`} className="h-4 w-4 text-gray-300" />
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">Sin reseña</span>
                )
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

export default BusinessAppointmentList; 