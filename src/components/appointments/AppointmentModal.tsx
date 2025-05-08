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
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          {/* Información Principal */}
          <div className="modal-section">
            <h4 className="modal-section-title">Información General</h4>
            <div className="info-grid">
              <div>
                <span className="info-grid-label">Servicio</span>
                <p className="info-grid-value">{appointment?.services?.name}</p>
              </div>
              <div>
                <span className="info-grid-label">Fecha</span>
                <p className="info-grid-value">
                  {appointment?.start_time && (
                    <p className="text-sm text-gray-500">
                      {format(new Date(appointment.start_time), "PPP", { locale: es })}
                    </p>
                  )}
                </p>
              </div>
              <div>
                <span className="info-grid-label">Hora</span>
                <p className="info-grid-value">
                  {appointment?.start_time && (
                    <p className="text-sm text-gray-500">
                      {format(new Date(appointment.start_time), "HH:mm")}
                    </p>
                  )}
                </p>
              </div>
              
              <div>
                <span className="info-grid-label">Estado</span>
                <p className="info-grid-value">
                  <span className={`status-${appointment?.status}`}>
                    {appointment?.status ? getStatusText(appointment.status) : ''}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Timeline de Estados */}
          <div className="modal-section">
            <h4 className="modal-section-title">Historial de Estados</h4>
            <div className="timeline">
              {appointment?.status_history?.map((history: any, index: number) => (
                <div key={index} className="timeline-item">
                  <div className="timeline-dot" />
                  <div className="timeline-content">
                    <p className="font-medium">{getStatusText(history.status)}</p>
                    <p className="text-xs">
                      {format(new Date(history.timestamp), "Pp", { locale: es })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sección de Reseña si aplica */}
          {showReviewSection && appointment?.review && (
            <div className="modal-section">
              <h4 className="modal-section-title">Reseña</h4>
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="text-yellow-400">{'★'.repeat(appointment.review.rating)}</span>
                  <span className="text-gray-300">{'★'.repeat(5 - appointment.review.rating)}</span>
                </div>
                <p className="modal-section-content">{appointment.review.comment}</p>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {onStatusChange && (
            <div className="flex space-x-2">
              {appointment?.status === 'pending' && (
                <>
                  <button className="btn-confirm" onClick={() => handleStatusChange('confirmed')}>
                    Confirmar
                  </button>
                  <button className="btn-cancel" onClick={() => handleStatusChange('cancelled')}>
                    Cancelar
                  </button>
                </>
              )}
              {appointment?.status === 'confirmed' && (
                <>
                  <button className="btn-complete" onClick={() => handleStatusChange('completed')}>
                    Completar
                  </button>
                  <button className="btn-cancel" onClick={() => handleStatusChange('cancelled')}>
                    Cancelar
                  </button>
                </>
              )}
            </div>
          )}
          <button className="btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentModal; 