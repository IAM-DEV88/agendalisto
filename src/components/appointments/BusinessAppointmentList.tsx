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
    <div className='grid gap-4'>
      {appointments.map((appointment) => (
        <div
          key={appointment.id}
          className="group p-5 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-xl transition-all cursor-pointer"
          onClick={() => setSelectedAppointment(appointment)}
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-lg font-black text-slate-900 dark:text-white truncate">
                  {appointment.services?.name}
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
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <p className="text-sm font-bold text-primary-600 dark:text-primary-400">
                  {appointment.profiles?.full_name}
                </p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center">
                  <svg className="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {format(new Date(appointment.start_time), "PPP p", { locale: es })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 self-end sm:self-center">
              {showReviewSection && appointment.status === 'completed' && (
                appointment.review ? (
                  <div className="flex bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-xl border border-amber-100 dark:border-amber-900/30 items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-amber-500 fill-current" />
                    <span className="text-xs font-black text-amber-700 dark:text-amber-400">{appointment.review.rating}.0</span>
                  </div>
                ) : (
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sin reseña</span>
                )
              )}
              <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 group-hover:text-primary-500 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-all">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
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