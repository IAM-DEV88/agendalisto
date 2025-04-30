import React, { useState } from 'react';
import { X, Clock, Calendar, CheckCircle } from 'lucide-react';
import { createAppointment, Service } from '../../../lib/api';

interface BookingFormProps {
  businessId: string;
  serviceId: string;
  userId: string;
  service: Service | null;
  onClose: () => void;
  showPrices: boolean;
  requireConfirmation?: boolean;
  notifyEmail?: boolean;
  notifyWhatsapp?: boolean;
  minCancellationHours?: number;
}

const BookingForm: React.FC<BookingFormProps> = ({ 
  businessId, 
  serviceId, 
  userId, 
  service, 
  onClose,
  showPrices,
  requireConfirmation = false,
  notifyEmail = false,
  notifyWhatsapp = false,
  minCancellationHours = 0
}) => {
  // Manage confirmation checkbox state
  const [confirmationChecked, setConfirmationChecked] = useState(!requireConfirmation);
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate available time slots
  const generateTimeSlots = () => {
    const slots = [];
    // From 9:00 to 20:00 in 30-minute intervals
    for (let hour = 9; hour <= 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 20 && minute === 30) break; // Skip 20:30
        const formattedHour = hour.toString().padStart(2, '0');
        const formattedMinute = minute.toString().padStart(2, '0');
        slots.push(`${formattedHour}:${formattedMinute}`);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Ensure cancellation conditions accepted
    if (requireConfirmation && !confirmationChecked) {
      setError(`Debes aceptar las condiciones de cancelación (${minCancellationHours}h de antelación)`);
      return;
    }
    if (!businessId || !serviceId || !userId || !service) {
      setError('Faltan datos necesarios para la reserva');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Combine date and time for start_time
      const startTime = new Date(`${formData.date}T${formData.time}`);
      
      // Calculate end_time based on service duration
      const endTime = new Date(startTime.getTime() + service.duration * 60000);
      
      const appointmentData = {
        business_id: businessId,
        service_id: serviceId,
        user_id: userId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: 'pending' as const,
        notes: formData.notes || null
      };

      const result = await createAppointment(appointmentData);
      
      if (result) {
        setBookingSuccess(true);
      } else {
        setError('Error al crear la reserva. Por favor, inténtalo de nuevo.');
      }
    } catch (err: any) {
      console.error('Error creating appointment:', err);
      setError(err.message || 'Error al crear la reserva');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate min date (today)
  const today = new Date().toISOString().split('T')[0];

  if (bookingSuccess) {
    return (
      <div className="text-center py-6">
        <div className="flex justify-center mb-4">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        <h3 className="text-xl font-medium text-gray-900 mb-2">¡Reserva confirmada!</h3>
        <p className="text-gray-600 mb-6">
          Tu reserva ha sido registrada correctamente.
          {notifyEmail && <><br />Se enviará confirmación por correo electrónico.</>}
          {notifyWhatsapp && <><br />Se enviará notificación por WhatsApp.</>}
        </p>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Cerrar
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Reservar Cita</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {service && (
        <div className="mb-4 p-4 bg-indigo-50 rounded-lg">
          <h3 className="font-medium text-gray-900">{service.name}</h3>
          <div className="flex justify-between items-center mt-2">
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="h-4 w-4 mr-1" />
              <span>{service.duration} min</span>
            </div>
            {showPrices && (
              <span className="text-lg font-semibold text-gray-900">
                ${service.price.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {requireConfirmation && (
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="confirmCancellation"
              checked={confirmationChecked}
              onChange={e => setConfirmationChecked(e.target.checked)}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
            />
            <label htmlFor="confirmCancellation" className="ml-2 text-sm text-gray-700">
              Confirmo que entiendo las condiciones de cancelación (mínimo {minCancellationHours}h de antelación)
            </label>
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="h-4 w-4 inline mr-1" />
              Fecha
            </label>
            <input
              type="date"
              id="date"
              min={today}
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
              <Clock className="h-4 w-4 inline mr-1" />
              Hora
            </label>
            <select
              id="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            >
              <option value="">Seleccionar hora</option>
              {timeSlots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notas adicionales (opcional)
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              rows={3}
            ></textarea>
          </div>
        </div>

        <div className="mt-6">
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Procesando...' : 'Confirmar Reserva'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookingForm; 