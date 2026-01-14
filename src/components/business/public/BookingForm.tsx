import React, { useState, useEffect, useMemo } from 'react';
import { X, Clock, Calendar, CheckCircle } from 'lucide-react';
import { createAppointment, Service, getBusinessHours, getBusinessAppointments, BusinessHours, Appointment } from '../../../lib/api';
import { notifyError, notifyLoading, dismissToast } from '../../../lib/toast';
import { Link } from 'react-router-dom';

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

  // State for business hours and existing appointments to filter slots
  const [businessHours, setBusinessHours] = useState<BusinessHours[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);

  // Fetch business hours and existing appointments when businessId changes
  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoadingSlots(true);
        const hours = await getBusinessHours(businessId);
        const apptsRes = await getBusinessAppointments(businessId);
        // Build full week: idx 0=Monday .. 6=Sunday; missing days as closed
        const fullWeek = Array.from({ length: 7 }, (_, idx) => {
          const found = hours.find(h => h.day_of_week === idx);
          return (
            found || {
              id: `${businessId}-${idx}`,
              business_id: businessId,
              day_of_week: idx,
              start_time: '00:00',
              end_time: '00:00',
              is_closed: true,
            }
          );
        });
        setBusinessHours(fullWeek);
        setAppointments(apptsRes.success && apptsRes.data ? apptsRes.data : []);
      } catch (err) {
      } finally {
        setLoadingSlots(false);
      }
    };
    if (businessId) {
      fetchSchedule();
    }
  }, [businessId]);

  // Reset error and time selection if selected date is a closed day
  useEffect(() => {
    if (!formData.date || !businessHours.length) return;
    // JS getDay(): 0=Sunday..6=Saturday; DB day_of_week: 0=Monday..6=Sunday
    // Parseamos la fecha como local al añadir 'T00:00' para evitar el parsing en UTC
    const jsDay = new Date(`${formData.date}T00:00`).getDay();
    const selectedDay = (jsDay + 6) % 7;
    const todaysHours = businessHours.find(h => h.day_of_week === selectedDay);
    if (todaysHours && todaysHours.is_closed) {
      setError('El negocio está cerrado ese día');
      setFormData(prev => ({ ...prev, time: '' }));
    } else {
      setError(null);
    }
  }, [formData.date, businessHours]);

  // Removed static slot generator; slots will be built per business hours

  // Compute available slots dynamically based on business hours and service duration (supports cross-midnight)
  const availableTimeSlots = useMemo(() => {
    if (!formData.date || loadingSlots || !service) return [];
    // JS getDay(): 0=Sunday..6=Saturday; DB day_of_week: 0=Monday..6=Sunday
    // Parseamos la fecha como local al añadir 'T00:00' para evitar el parsing en UTC
    const jsDay = new Date(`${formData.date}T00:00`).getDay();
    const selectedDay = (jsDay + 6) % 7;
    const todaysHours = businessHours.find(h => h.day_of_week === selectedDay);
    if (!todaysHours || todaysHours.is_closed) return [];
    // Support time strings with ':' or '.' separators
    const [startH, startM] = todaysHours.start_time.replace('.', ':').split(':').map(Number);
    const [endH, endM] = todaysHours.end_time.replace('.', ':').split(':').map(Number);
    const businessStart = startH * 60 + startM;
    let businessEnd = endH * 60 + endM;
    // If closing time is at or before opening, assume next-day closing
    if (businessEnd <= businessStart) {
      businessEnd += 24 * 60;
    }
    const slots: string[] = [];
    for (let minutes = businessStart; minutes + service.duration <= businessEnd; minutes += 30) {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      slots.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
    }
    return slots.filter(slot => {
      const slotTime = new Date(`${formData.date}T${slot}`).getTime();
      const slotEnd = slotTime + service.duration * 60000;
      return !appointments.some(appt => {
        const apptDate = appt.start_time.split('T')[0];
        if (apptDate !== formData.date || appt.status === 'cancelled') return false;
        const apptStart = new Date(appt.start_time).getTime();
        const apptEnd = new Date(appt.end_time).getTime();
        return slotTime < apptEnd && slotEnd > apptStart;
      });
    });
  }, [formData.date, loadingSlots, businessHours, appointments, service]);

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

    let toastId: string = '';
    try {
      toastId = notifyLoading('Enviando solicitud...');
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
      
      dismissToast(toastId);
      if (result) {
        setBookingSuccess(true);
        // Aquí podrías notificar al negocio o usuario si quieres usar el nombre, actualmente no es usado.
      } else {
        const errorMsg = 'Error al enviar la solicitud. Por favor, inténtalo de nuevo.';
        setError(errorMsg);
        notifyError(errorMsg);
      }
    } catch (err: any) {
      dismissToast(toastId);
      const errorMsg = err.message || 'Error al enviar la solicitud';
      setError(errorMsg);
      notifyError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate min date (today) in local timezone
  const today = (() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  })();

  if (bookingSuccess) {
    return (
      <div className="text-center py-6">
        <div className="flex justify-center mb-4">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        <h3 className="text-xl font-medium mb-2">¡Solicitud enviada!</h3>
        <p className="mb-6">
          Tu solicitud ha sido enviada correctamente.
          {notifyEmail && <><br />Recibirás confirmación por correo electrónico cuando se confirme tu solicitud.</>}
          {notifyWhatsapp && <><br />Recibirás notificación por WhatsApp cuando se confirme tu solicitud.</>}
        </p>
        <Link
          to="/dashboard/"
          className="inline-block px-4 py-2 m-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Ver mis reservas
        </Link>
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
        <h2 className="text-xl font-semibold">Solicitar Reserva</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {service && (
        <div className="mb-4 p-4 bg-opacity-10 bg-gray-50 rounded-md">
          <h3 className="font-medium text-gray-900 dark:text-white">{service.name}</h3>
          <div className="flex justify-between items-center mt-2">
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-200">
              <Clock className="h-4 w-4 mr-1 " />
              <span className="">{service.duration} min</span>
            </div>
            {showPrices && (
              <span className="text-lg font-semibold text-gray-900 ">
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
            <label htmlFor="confirmCancellation" className="ml-2 text-sm text-gray-700 ">
              Confirmo que entiendo las condiciones de cancelación (mínimo {minCancellationHours}h de antelación)
            </label>
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Calendar className="h-4 w-4 inline mr-1 " />
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
            <label htmlFor="time" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Clock className="h-4 w-4 inline mr-1 " />
              Hora
            </label>
            <select
              id="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
              disabled={loadingSlots || !formData.date || availableTimeSlots.length === 0}
            >
              <option value="">
                {loadingSlots
                  ? 'Cargando...'
                  : !formData.date
                  ? 'Selecciona fecha primero'
                  : availableTimeSlots.length > 0
                  ? 'Seleccionar hora'
                  : 'No hay horas disponibles'}
              </option>
              {!loadingSlots && availableTimeSlots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
            {submitting ? 'Procesando...' : 'Enviar Solicitud'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookingForm; 
