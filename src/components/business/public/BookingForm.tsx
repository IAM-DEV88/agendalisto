import React, { useState, useEffect, useMemo } from 'react';
import { X, Clock, Calendar, CheckCircle } from 'lucide-react';
import { createAppointment, Service, getBusinessHours, getBusinessAppointments, BusinessHours, Appointment } from '../../../lib/api';
import { notifyError, notifyLoading, dismissToast } from '../../../lib/toast';
import { Link } from 'react-router-dom';

interface BookingFormProps {
  businessId: string;
  businessName: string;
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
  businessName,
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
    <div className="animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-primary-200 dark:border-primary-800">
        <h3 className="text-2xl font-black text-primary-900 dark:text-white tracking-tight">
          Reservar cita con <span className="text-primary-500">{businessName}</span>
        </h3>
        <button
          onClick={onClose}
          className="p-2 hover:bg-primary-100 dark:hover:bg-primary-900/50 text-primary-600 rounded-full transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="mb-8 p-5 bg-white dark:bg-slate-800 rounded-2xl border border-primary-100 dark:border-primary-800 shadow-sm">
        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Servicio Seleccionado</h4>
        <div className="flex justify-between items-center">
          <span className="text-xl font-bold text-slate-900 dark:text-white">{service.name}</span>
          {showPrices && (
            <span className="text-2xl font-black text-primary-600 dark:text-primary-400">
              ${service.price.toFixed(2)}
            </span>
          )}
        </div>
        <div className="flex items-center mt-2 text-slate-500 font-medium">
          <Clock className="h-4 w-4 mr-2 text-primary-500" />
          {service.duration} minutos
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
              1. Selecciona el día
            </label>
            <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner">
              <input
                type="date"
                id="date"
                min={today}
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-3 bg-transparent border-2 border-slate-100 dark:border-slate-700 rounded-xl focus:border-primary-500 focus:ring-0 transition-all font-bold text-slate-700 dark:text-white"
                required
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
              2. Horario disponible
            </label>
            {!formData.date ? (
              <div className="p-8 text-center bg-slate-100 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 font-medium italic">
                Selecciona una fecha primero
              </div>
            ) : loadingSlots ? (
              <div className="grid grid-cols-3 gap-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : availableTimeSlots.length === 0 ? (
              <div className="p-8 text-center bg-red-50 dark:bg-red-900/10 rounded-2xl border border-dashed border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 font-bold">
                No hay turnos disponibles para este día
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {availableTimeSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setFormData({ ...formData, time: slot })}
                    className={`py-3 px-2 text-sm font-black rounded-xl border-2 transition-all ${
                      formData.time === slot
                        ? 'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-500/30 scale-105 z-10'
                        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-primary-400 dark:hover:border-primary-600'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <label htmlFor="notes" className="block text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
          Notas adicionales
        </label>
        <textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:border-primary-500 focus:ring-0 transition-all font-medium text-slate-700 dark:text-white"
          rows={3}
          placeholder="Algún detalle que debamos saber..."
        ></textarea>
      </div>

      <div className="mt-12 flex flex-col sm:flex-row gap-4">
        <button
          onClick={onClose}
          type="button"
          className="flex-1 px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={!formData.date || !formData.time || submitting}
          className={`flex-[2] px-8 py-4 bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-500/20 transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
            submitting ? 'animate-pulse' : ''
          }`}
        >
          {submitting ? 'Procesando...' : requireConfirmation ? 'Solicitar Cita' : 'Confirmar Reserva'}
        </button>
      </div>

      <p className="mt-6 text-center text-xs text-slate-400 font-medium">
        {requireConfirmation 
          ? '* El negocio deberá confirmar tu solicitud para validar la cita.' 
          : '* Tu cita será agendada y confirmada instantáneamente.'}
      </p>
    </div>
  );
};

export default BookingForm; 
