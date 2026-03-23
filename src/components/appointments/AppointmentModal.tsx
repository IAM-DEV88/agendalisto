import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Appointment, AppointmentStatus } from '../../types/appointment';
import { getStatusText } from '../../utils/appointmentUtils';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onStatusChange?: (status: AppointmentStatus) => void;
  showReviewSection?: boolean;
}

const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onStatusChange,
  showReviewSection = false,
}) => {
  if (!isOpen) return null;

  const handleStatusChange = (status: AppointmentStatus) => {
    if (onStatusChange) {
      onStatusChange(status);
      onClose(); // Cerrar el modal después de cambiar el estado
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Detalles de la Cita</h3>
          <button 
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 rounded-full transition-colors" 
            onClick={onClose}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal-content">
          {/* Información Principal */}
          <div className="modal-section border-none">
            <div className="info-grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Servicio</span>
                <p className="text-lg font-black text-primary-600 dark:text-primary-400">{appointment?.services?.name}</p>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Estado</span>
                <div className="mt-1">
                  <span className={`px-3 py-1 text-xs font-black rounded-full uppercase tracking-tighter inline-flex items-center justify-center shadow-sm ${
                    appointment?.status === 'confirmed' 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800'
                      : appointment?.status === 'pending'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                      : appointment?.status === 'cancelled'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800'
                      : 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 border border-primary-200 dark:border-primary-800'
                  }`}>
                    {appointment?.status ? getStatusText(appointment.status) : ''}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Fecha</span>
                <p className="text-base font-bold text-slate-700 dark:text-slate-200">
                  {appointment?.start_time && format(new Date(appointment.start_time), "PPP", { locale: es })}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Hora</span>
                <p className="text-base font-bold text-slate-700 dark:text-slate-200">
                  {appointment?.start_time && format(new Date(appointment.start_time), "HH:mm")} hs
                </p>
              </div>
            </div>
          </div>

          {/* Notas de la Cita */}
          <div className="modal-section">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Notas adicionales</h4>
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 italic text-slate-600 dark:text-slate-400 text-sm">
              {appointment?.notes || 'Sin notas adicionales'}
            </div>
          </div>

          {/* Sección de Reseña si aplica */}
          {showReviewSection && appointment?.review && (
            <div className="modal-section">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Tu Reseña</h4>
              <div className="p-5 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                <div className="flex items-center mb-3">
                  {[...Array(5)].map((_, i) => (
                    <svg 
                      key={i} 
                      className={`h-4 w-4 ${i < appointment.review!.rating ? 'text-amber-400 fill-current' : 'text-slate-200 dark:text-slate-700'}`} 
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic">
                  "{appointment.review.comment}"
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer gap-3">
          {onStatusChange && (
            <div className="flex gap-2">
              {appointment?.status === 'pending' && (
                <>
                  <button className="px-6 py-2 bg-primary-600 text-white text-sm font-black rounded-xl shadow-lg shadow-primary-500/20 hover:bg-primary-500 transition-all" onClick={() => handleStatusChange('confirmed')}>
                    Confirmar
                  </button>
                  <button className="px-6 py-2 bg-red-100 text-red-600 text-sm font-black rounded-xl hover:bg-red-200 transition-all" onClick={() => handleStatusChange('cancelled')}>
                    Cancelar
                  </button>
                </>
              )}
              {appointment?.status === 'confirmed' && (
                <>
                  <button className="px-6 py-2 bg-green-600 text-white text-sm font-black rounded-xl shadow-lg shadow-green-500/20 hover:bg-green-500 transition-all" onClick={() => handleStatusChange('completed')}>
                    Completar
                  </button>
                  <button className="px-6 py-2 bg-red-100 text-red-600 text-sm font-black rounded-xl hover:bg-red-200 transition-all" onClick={() => handleStatusChange('cancelled')}>
                    Cancelar
                  </button>
                </>
              )}
            </div>
          )}
          <button className="btn-secondary w-auto px-6 py-2 text-sm" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentModal; 