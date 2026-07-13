import React, { useState, useEffect, useMemo } from 'react';
import { Clock, CheckCircle, ArrowLeft, Send, AlertCircle, Gift, Check, X, Lock, FileText, Eye, CalendarDays, Info, Download, Store, User, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import CrossPromotion from '../CrossPromotion';
import AvailabilityCalendar from './AvailabilityCalendar';
import { createAppointment, Service, getBusinessHours, getBusinessAppointments, BusinessHours, Appointment, validateGiftCode, redeemGiftCode } from '../../../lib/api';
import type { GuestInfo, GiftCode } from '../../../lib/api';
import { notifyError, notifyLoading, dismissToast } from '../../../lib/toast';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import PaymentMethodSelector from '../../PaymentMethodSelector';
import { trackEvent } from '../../../lib/analytics';
import { downloadIcs } from '../../../utils/icsUtils';

interface BookingFormProps {
  businessId: string;
  businessName: string;
  businessAddress?: string;
  serviceId: string;
  userId?: string;
  service: Service | null;
  onClose: () => void;
  showPrices: boolean;
  requireConfirmation?: boolean;
  notifyEmail?: boolean;
  notifyWhatsapp?: boolean;
  minCancellationHours?: number;
  guestInfo?: GuestInfo;
  isOwnerPreview?: boolean;
  slotIntervalMinutes?: number;
  bufferMinutes?: number;
  maxAdvanceBookingDays?: number;
  images?: string[];
  activeImageIndex?: number;
  onImageChange?: (index: number) => void;
  onFullscreenImage?: (url: string) => void;
  cancellationPolicy?: string | null;
  reschedulePolicy?: string | null;
}

const BookingForm: React.FC<BookingFormProps> = ({
  businessId,
  businessName,
  businessAddress = '',
  serviceId,
  userId,
  service,
  onClose,
  showPrices,
  requireConfirmation = false,
  notifyEmail = false,
  notifyWhatsapp = false,
  minCancellationHours = 0,
  guestInfo,
  isOwnerPreview = false,
  slotIntervalMinutes = 30,
  bufferMinutes = 0,
  maxAdvanceBookingDays = 90,
  images,
  activeImageIndex: controlledImageIndex,
  onImageChange,
  onFullscreenImage,
  cancellationPolicy,
  reschedulePolicy,
}) => {
  const [localImageIndex, setLocalImageIndex] = useState(0);
  const imageIndex = controlledImageIndex ?? localImageIndex;
  const handleImageChange = onImageChange ?? setLocalImageIndex;
  const [localGuestInfo, setLocalGuestInfo] = useState<GuestInfo>(guestInfo || { name: '', email: '', phone: '' });
  const [confirmationChecked, setConfirmationChecked] = useState(!requireConfirmation);
  const [formData, setFormData] = useState({ date: '', time: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [giftCodeInput, setGiftCodeInput] = useState('');
  const [giftApplied, setGiftApplied] = useState<GiftCode | null>(null);
  const [giftError, setGiftError] = useState('');
  const [validatingGift, setValidatingGift] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const [businessHours, setBusinessHours] = useState<BusinessHours[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);

  useEffect(() => {
    trackEvent('booking_page_viewed', { business_id: businessId, service_id: serviceId });
  }, [businessId, serviceId]);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoadingSlots(true);
        const hours = await getBusinessHours(businessId);
        const apptsRes = await getBusinessAppointments(businessId);
        const fullWeek = Array.from({ length: 7 }, (_, idx) => {
          const found = hours.find(h => h.day_of_week === idx);
          return found || {
            id: `${businessId}-${idx}`,
            business_id: businessId,
            day_of_week: idx,
            start_time: '00:00',
            end_time: '00:00',
            is_closed: true,
          } as BusinessHours;
        });
        setBusinessHours(fullWeek);
        setAppointments(apptsRes.success && apptsRes.data ? apptsRes.data : []);
      } catch { /* ignore */ }
      finally { setLoadingSlots(false); }
    };
    if (businessId) fetchSchedule();
  }, [businessId]);

  useEffect(() => {
    if (!formData.date || !businessHours.length) return;
    const jsDay = new Date(`${formData.date}T00:00`).getDay();
    const selectedDay = (jsDay + 6) % 7;
    const todaysHours = businessHours.find(h => h.day_of_week === selectedDay);
    if (todaysHours?.is_closed) {
      setError('El negocio esta cerrado ese dia');
      setFormData(prev => ({ ...prev, time: '' }));
    } else {
      setError(null);
    }
  }, [formData.date, businessHours]);

  const availableTimeSlots = useMemo(() => {
    if (!formData.date || loadingSlots || !service) return [];
    const jsDay = new Date(`${formData.date}T00:00`).getDay();
    const selectedDay = (jsDay + 6) % 7;
    const todaysHours = businessHours.find(h => h.day_of_week === selectedDay);
    if (!todaysHours || todaysHours.is_closed) return [];

    const [startH, startM] = todaysHours.start_time.replace('.', ':').split(':').map(Number);
    const [endH, endM] = todaysHours.end_time.replace('.', ':').split(':').map(Number);
    let businessStart = startH * 60 + startM;
    let businessEnd = endH * 60 + endM;
    if (businessEnd <= businessStart) businessEnd += 24 * 60;

    const interval = slotIntervalMinutes || 30;
    const buffer = bufferMinutes || 0;
    const slots: string[] = [];
    for (let mins = businessStart; mins + service.duration <= businessEnd; mins += interval) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }

    return slots.filter(slot => {
      const slotTime = new Date(`${formData.date}T${slot}`).getTime();
      const now = Date.now();
      if (slotTime <= now) return false;
      const slotEnd = slotTime + service.duration * 60000;
      const slotEndWithBuffer = slotEnd + buffer * 60000;
      return !appointments.some(appt => {
        const apptDate = appt.start_time.split('T')[0];
        if (apptDate !== formData.date || appt.status === 'cancelled') return false;
        const aStart = new Date(appt.start_time).getTime();
        const aEnd = new Date(appt.end_time).getTime();
        return slotTime < aEnd && slotEndWithBuffer > aStart;
      });
    });
  }, [formData.date, loadingSlots, businessHours, appointments, service, slotIntervalMinutes, bufferMinutes]);

  const paymentAmount = service?.payment_percentage != null
    ? Math.round((service.price * service.payment_percentage) / 100)
    : service?.price || 0;
  const requiresPayment = !!service?.requires_payment && paymentAmount > 0 && !giftApplied;

  const doCreateAppointment = async (paymentProvider?: string, paymentId?: string, paymentAmt?: number) => {
    const startTime = new Date(`${formData.date}T${formData.time}`);
    const endTime = new Date(startTime.getTime() + (service?.duration || 0) * 60000);

    return await createAppointment({
      business_id: businessId,
      service_id: serviceId,
      user_id: userId || '',
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      status: requireConfirmation ? 'pending' as const : 'confirmed' as const,
      notes: formData.notes || null,
      is_guest: !userId,
      guest_info: !userId ? localGuestInfo : null,
      payment_status: paymentProvider ? 'completed' : undefined,
      payment_provider: paymentProvider || undefined,
      payment_id: paymentId || undefined,
      payment_amount: paymentAmt || undefined,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOwnerPreview) {
      setError('No puedes agendar citas en tu propio negocio.');
      return;
    }
    if (requireConfirmation && !confirmationChecked) {
      setError(`Debes aceptar las condiciones de cancelacion (${minCancellationHours}h de antelacion)`);
      return;
    }
    if (!businessId || !serviceId || !service) {
      setError('Faltan datos para la reserva');
      return;
    }
    if (!userId && (!localGuestInfo.name.trim() || !localGuestInfo.email.trim())) {
      setError('Completa tu nombre y correo para reservar');
      return;
    }
    if (!formData.date || !formData.time) {
      setError('Selecciona fecha y hora');
      return;
    }

    if (requiresPayment) {
      setShowPayment(true);
      return;
    }

    if (!showSummary) {
      setShowSummary(true);
      return;
    }

    let toastId = '';
    try {
      toastId = notifyLoading('Enviando solicitud...');
      setSubmitting(true);
      setError(null);

      const result = await doCreateAppointment();

      dismissToast(toastId);
      if (result) {
        if (giftApplied) {
          await redeemGiftCode(giftApplied.code);
        }
        trackEvent('booking_submitted', {
          business_id: businessId,
          service_id: serviceId,
          is_guest: !userId,
          has_payment: false,
        });
        setBookingSuccess(true);
      } else {
        const msg = 'Error al enviar la solicitud. Intenta de nuevo.';
        setError(msg);
        notifyError(msg);
      }
    } catch (err: unknown) {
      dismissToast(toastId);
      const msg = err instanceof Error ? err.message : 'Error al enviar la solicitud';
      setError(msg);
      notifyError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayPalCreateOrder = async (): Promise<string> => {
    const res = await fetch('/.netlify/functions/create-service-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'paypal',
        amount: paymentAmount,
        currency: 'COP',
        serviceName: service?.name || '',
        businessName,
        userId: userId || '',
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.orderId) throw new Error(data.error || 'Error al crear pago');
    return data.orderId;
  };

  const handlePayPalApprove = async (orderId: string) => {
    let toastId = '';
    try {
      toastId = notifyLoading('Procesando pago...');
      setSubmitting(true);
      setError(null);

      const res = await fetch('/.netlify/functions/capture-service-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'paypal',
          orderId,
          action: 'create_appointment',
          actionData: {
            business_id: businessId,
            service_id: serviceId,
            user_id: userId || '',
            start_time: new Date(`${formData.date}T${formData.time}`).toISOString(),
            end_time: new Date(new Date(`${formData.date}T${formData.time}`).getTime() + (service?.duration || 0) * 60000).toISOString(),
            notes: formData.notes || null,
            guest_info: !userId ? localGuestInfo : null,
            payment_provider: 'paypal',
            payment_amount: paymentAmount,
          },
        }),
      });

      const result = await res.json();
      dismissToast(toastId);

      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Error al procesar pago');
      }

      if (giftApplied) {
        await redeemGiftCode(giftApplied.code);
      }
      trackEvent('booking_submitted', {
        business_id: businessId,
        service_id: serviceId,
        is_guest: !userId,
        has_payment: true,
      });
      setBookingSuccess(true);
    } catch (err: unknown) {
      dismissToast(toastId);
      const msg = err instanceof Error ? err.message : 'Error al procesar pago';
      setError(msg);
      notifyError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleWompiPay = async () => {
    const startTime = new Date(`${formData.date}T${formData.time}`);
    const endTime = new Date(startTime.getTime() + (service?.duration || 0) * 60000);

    const res = await fetch('/.netlify/functions/create-service-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'wompi',
        amount: paymentAmount,
        currency: 'COP',
        serviceName: service?.name || '',
        businessName,
        userId: userId || '',
        userEmail: localGuestInfo.email || '',
        userName: localGuestInfo.name || '',
        action: 'create_appointment',
        actionData: {
          business_id: businessId,
          service_id: serviceId,
          user_id: userId || '',
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          notes: formData.notes || null,
          guest_info: !userId ? localGuestInfo : null,
          amount: paymentAmount,
          currency: 'COP',
        },
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.checkoutUrl) {
      toast.error(data.error || 'Error al iniciar pago con Wompi');
      return;
    }

    sessionStorage.setItem('pendingBooking', JSON.stringify({
      businessId, serviceId, date: formData.date, time: formData.time,
    }));
    window.location.href = data.checkoutUrl;
  };

  const handleDateSelect = (date: string) => {
    setFormData(prev => ({ ...prev, date, time: '' }));
    trackEvent('date_selected', { business_id: businessId, service_id: serviceId, date });
  };

  const handleTimeSelect = (time: string) => {
    setFormData(prev => ({ ...prev, time }));
    trackEvent('time_selected', { business_id: businessId, service_id: serviceId, time });
  };

  const resetForm = () => {
    setFormData({ date: '', time: '', notes: '' });
    setError(null);
    setBookingSuccess(false);
    setShowSummary(false);
  };

  if (bookingSuccess) {
    return (
      <div className="text-center py-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="w-20 h-20 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mx-auto mb-6 ring-1 ring-emerald-200 dark:ring-emerald-800">
          <CheckCircle className="w-10 h-10 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3">Solicitud enviada!</h2>
        <p className="text-slate-500 dark:text-slate-400 font-medium max-w-sm mx-auto leading-relaxed mb-6">
          {requireConfirmation
            ? 'El negocio revisara tu solicitud y te confirmara la cita pronto.'
            : 'Tu cita ha sido agendada correctamente.'}
        </p>
        <div className="space-y-2">
          {notifyEmail && (
            <p className="text-xs font-medium text-slate-400 flex items-center justify-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              Recibiras confirmacion por correo electronico
            </p>
          )}
          {notifyWhatsapp && (
            <p className="text-xs font-medium text-slate-400 flex items-center justify-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              Recibiras notificacion por WhatsApp
            </p>
          )}
        </div>
        <button
          onClick={() => {
            if (!formData.date || !formData.time || !service) return;
            const start = new Date(`${formData.date}T${formData.time}:00`);
            const end = new Date(start.getTime() + (service.duration || 60) * 60000);
            downloadIcs({
              summary: `${service.name} — ${businessName}`,
              description: service.description || `Cita en ${businessName}`,
              location: businessAddress || businessName,
              startTime: start,
              endTime: end,
            }, `${service.name.replace(/\s+/g, '_')}.ics`);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold text-sm rounded-xl transition-all active:scale-[0.97] border border-emerald-200 dark:border-emerald-800/50"
        >
          <Download className="w-4 h-4" />
          Agregar a mi calendario
        </button>
        {!userId && (
          <div className="mt-4 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-2xl border border-primary-200 dark:border-primary-800/50">
            <p className="text-sm font-bold text-primary-800 dark:text-primary-300 mb-1">
              Quieres guardar tus reservas?
            </p>
            <p className="text-xs text-primary-600 dark:text-primary-400 mb-3">
              Crea una cuenta gratis para ver el historial y recibir notificaciones.
            </p>
            <a href="/register" className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl transition-all">
              Registrarme ahora
            </a>
          </div>
        )}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
          {userId && (
            <Link to="/dashboard" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary-500/25 active:scale-[0.98]">
              Ver mis reservas
            </Link>
          )}
          <button onClick={() => { resetForm(); onClose(); }} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-[0.98]">
            {userId ? 'Cerrar' : 'Volver'}
          </button>
        </div>
        {businessAddress && (
          <CrossPromotion businessId={businessId} businessAddress={businessAddress} excludeId={businessId} />
        )}
      </div>
    );
  }

  return (
    <div className="animate-in slide-in-from-bottom-4 duration-500">
      {!userId && (
        <div className="mb-5 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-2xl border border-primary-200 dark:border-primary-800/50 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-800/50 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Info className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-primary-800 dark:text-primary-300">Crea una cuenta para gestionar tus reservas</p>
            <p className="text-xs text-primary-600 dark:text-primary-400 mt-0.5">
              Historial, reagendamiento y notificaciones.{' '}
              <a href="/register" className="font-bold underline hover:text-primary-500">Registrarme</a>
            </p>
          </div>
        </div>
      )}

      {/* ─── Integrated hero: image gallery + service info ─── */}
      {images && images.length > 0 && (
        <div className={`mb-6 overflow-hidden ${images.length > 0 ? 'md:grid md:grid-cols-5' : ''}`}>
          <div className="md:col-span-2 relative flex flex-col rounded-xl bg-slate-100 dark:bg-slate-800">
            <div className="relative aspect-[4/3] sm:aspect-video md:flex-1 md:min-h-[240px] md:max-h-[360px] group overflow-hidden md:rounded-l-xl">
              <img src={images[imageIndex]} alt={service?.name || ''}
                className="w-full h-full object-contain cursor-zoom-in transition-all duration-700 group-hover:scale-110"
                onClick={() => onFullscreenImage?.(images[imageIndex])} />
              {images.length > 1 && (
                <>
                  <button onClick={(e) => { e.stopPropagation(); handleImageChange((imageIndex - 1 + images.length) % images.length); }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/90 hover:bg-white text-slate-800 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleImageChange((imageIndex + 1) % images.length); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/90 hover:bg-white text-slate-800 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="absolute bottom-0 inset-x-0 flex gap-1.5 px-3 pb-3 pt-8 overflow-x-auto no-scrollbar z-10">
                {images.map((url, i) => (
                  <button key={i} onClick={() => handleImageChange(i)}
                    className={`w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 ring-2 transition-all hover:scale-105 ${
                      i === imageIndex ? 'ring-primary-500 scale-105' : 'ring-white/50 hover:ring-white'
                    }`}>
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="md:col-span-3 p-5 md:p-6 flex flex-col justify-center">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-[0.15em] mb-1">
              <Store className="w-3 h-3" />
              {businessName}
            </span>
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-tight mb-0 flex-1">
                {service?.name}
              </h1>
              {showPrices && (service?.price ?? 0) > 0 && (
                <span className="text-xl md:text-2xl font-black text-primary-600 dark:text-primary-400 flex-shrink-0 whitespace-nowrap">
                  ${service!.price.toLocaleString()}
                </span>
              )}
            </div>
            <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-2">
              <span className="flex items-center gap-1.5 text-sm font-bold text-slate-500 dark:text-slate-400">
                <Clock className="w-4 h-4 text-primary-500" />
                {service?.duration} min
              </span>
              {service?.provider && (
                <span className="flex items-center gap-1.5 text-sm font-bold text-slate-500 dark:text-slate-400">
                  <User className="w-4 h-4 text-primary-400" />
                  {service.provider}
                </span>
              )}
            </div>
            {service?.description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-3 max-w-prose">{service.description}</p>
            )}
            {!isOwnerPreview && (
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold mt-3 w-fit ${
                requireConfirmation
                  ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50'
                  : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50'
              }`}>
                {requireConfirmation
                  ? <><Clock className="w-3.5 h-3.5" /> Requiere confirmación</>
                  : <><CheckCircle className="w-3.5 h-3.5" /> Reserva inmediata</>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Guest info inline */}
      {!userId && (
        <div className="mb-5 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Tus datos</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input type="text" value={localGuestInfo.name} onChange={(e) => setLocalGuestInfo(p => ({ ...p, name: e.target.value }))}
              placeholder="Nombre" className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all" />
            <input type="email" value={localGuestInfo.email} onChange={(e) => setLocalGuestInfo(p => ({ ...p, email: e.target.value }))}
              placeholder="Correo" className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all" />
            <input type="tel" value={localGuestInfo.phone} onChange={(e) => setLocalGuestInfo(p => ({ ...p, phone: e.target.value }))}
              placeholder="Teléfono" className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all" />
          </div>
        </div>
      )}

      {service?.can_be_gifted && (
        <div className="mb-5 p-3 bg-rose-50 dark:bg-rose-900/10 rounded-2xl border border-rose-200 dark:border-rose-800/50">
          <p className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 mb-2">
            <Gift className="w-3.5 h-3.5" /> Tienes un codigo de regalo?
          </p>
          {giftApplied ? (
            <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-xl p-2.5 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="font-bold text-emerald-700 dark:text-emerald-300">Codigo aplicado</span>
                <span className="text-xs text-slate-400 ml-1">Servicio gratis</span>
              </div>
              <button onClick={() => setGiftApplied(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-400 pointer-events-none" />
                <input type="text" value={giftCodeInput} onChange={e => setGiftCodeInput(e.target.value.toUpperCase())} placeholder="Ej: GIFT-ABC123"
                  className="w-full pl-10 pr-3 py-2 text-sm rounded-xl border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none" />
              </div>
              <button onClick={async () => {
                if (!giftCodeInput.trim()) return;
                setValidatingGift(true);
                setGiftError('');
                const res = await validateGiftCode(giftCodeInput.trim(), serviceId, businessId);
                setValidatingGift(false);
                if (res.success && res.gift) { setGiftApplied(res.gift); setGiftCodeInput(''); toast.success('Codigo de regalo aplicado!'); }
                else { setGiftError(res.error || 'Codigo invalido'); }
              }} disabled={validatingGift || !giftCodeInput.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50">
                {validatingGift ? '...' : 'Canjear'}
              </button>
            </div>
          )}
          {giftError && <p className="text-xs text-red-500 mt-1.5">{giftError}</p>}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2.5 px-4 py-3 mb-5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-800 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-bold text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
          <div className="flex flex-col">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary-600 text-white text-[10px] font-black flex items-center justify-center">1</span>
              Selecciona el dia
            </label>
            <AvailabilityCalendar
              businessHours={businessHours}
              maxAdvanceDays={maxAdvanceBookingDays}
              selectedDate={formData.date}
              onSelectDate={handleDateSelect}
            />
          </div>

          <div className="flex flex-col">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary-600 text-white text-[10px] font-black flex items-center justify-center">2</span>
              Horario disponible
            </label>
            {!formData.date ? (
              <div className="flex-1 py-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center md:max-h-[380px]">
                <CalendarDays className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-400 italic">Selecciona una fecha primero</p>
              </div>
            ) : loadingSlots ? (
              <div className="flex-1 grid grid-cols-2 gap-2.5 content-start md:max-h-[380px]">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-11 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : availableTimeSlots.length === 0 ? (
              <div className="flex-1 py-8 text-center bg-amber-50 dark:bg-amber-500/10 rounded-2xl border border-dashed border-amber-200 dark:border-amber-800 flex flex-col items-center justify-center md:max-h-[380px]">
                <Clock className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-amber-700 dark:text-amber-400">No hay turnos disponibles este dia</p>
              </div>
            ) : (
              <div className="flex-1 grid grid-cols-2 gap-2.5 content-start overflow-y-auto pr-1 md:max-h-[380px]">
                {availableTimeSlots.map((slot) => (
                  <button key={slot} type="button" onClick={() => handleTimeSelect(slot)}
                    className={`py-3 text-sm font-black rounded-xl border-2 transition-all active:scale-95 ${
                      formData.time === slot
                        ? 'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-500/30'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-primary-400 dark:hover:border-primary-600'
                    }`}>
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
            Notas <span className="text-slate-400 font-normal">(opcional)</span>
          </label>
          <div className="relative">
            <FileText className="absolute top-3.5 left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <textarea id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm"
              rows={3} placeholder="Algun detalle que debamos saber..." />
          </div>
        </div>

        {requireConfirmation && (
          <label className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-500/10 rounded-2xl border border-amber-200 dark:border-amber-800 cursor-pointer">
            <input type="checkbox" checked={confirmationChecked} onChange={(e) => setConfirmationChecked(e.target.checked)}
              className="w-5 h-5 mt-0.5 rounded-md border-amber-300 text-primary-600 focus:ring-primary-500" />
            <div>
              <p className="text-sm font-bold text-amber-800 dark:text-amber-400 mb-0">Acepto las condiciones de cancelacion</p>
              <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5 mb-0">Debo cancelar con al menos {minCancellationHours}h de antelacion.</p>
            </div>
          </label>
        )}

        {showSummary && formData.date && formData.time && (
          <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-2xl border border-primary-200 dark:border-primary-800/50 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5" /> Resumen de tu reserva
            </p>
            <div className="text-sm text-slate-700 dark:text-slate-300 space-y-1">
              <p><span className="font-bold">Servicio:</span> {service?.name}</p>
              <p><span className="font-bold">Fecha:</span> {new Date(formData.date + 'T12:00').toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p><span className="font-bold">Hora:</span> {formData.time} hs</p>
              <p><span className="font-bold">Duracion:</span> {service?.duration} min</p>
              {showPrices && service?.price ? <p><span className="font-bold">Precio:</span> ${service.price.toLocaleString()}</p> : null}
              {formData.notes && <p><span className="font-bold">Notas:</span> {formData.notes}</p>}
            </div>
          </div>
        )}

        {showPayment && (
          <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800/50">
              <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Este servicio requiere pago online de <strong>${paymentAmount.toLocaleString()} COP</strong> para confirmar la reserva.
              </p>
            </div>
            <PaymentMethodSelector amount={paymentAmount} currency="COP" serviceName={service?.name || ''} businessName={businessName}
              userId={userId || ''} onPayPalCreateOrder={handlePayPalCreateOrder} onPayPalApprove={handlePayPalApprove}
              onWompiPay={handleWompiPay} disabled={submitting} />
          </div>
        )}

        {!showPayment && (
          <>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-[0.98]">
                <ArrowLeft className="w-4 h-4" /> Cancelar
              </button>
              <button type="submit" disabled={!formData.date || !formData.time || submitting || isOwnerPreview}
                className="flex-[2] inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-500/25 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:-translate-y-0">
                {submitting ? (
                  <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> Procesando...</>
                ) : isOwnerPreview ? (
                  <><Eye className="w-4 h-4" /> Vista previa</>
                ) : showSummary ? (
                  <><Send className="w-4 h-4" /> Confirmar reserva</>
                ) : (
                  <><Send className="w-4 h-4" /> {requireConfirmation ? 'Solicitar Cita' : 'Confirmar Reserva'}</>
                )}
              </button>
            </div>
            <p className="text-center text-xs text-slate-400 font-medium">
              {showSummary
                ? 'Revisa los detalles y confirma tu reserva.'
                : requireConfirmation
                  ? 'El negocio confirmara tu solicitud para validar la cita.'
                  : 'Tu cita sera agendada instantaneamente.'}
            </p>
          </>
        )}
      </form>

      {/* ─── Policies integrated ─── */}
      {!isOwnerPreview && (cancellationPolicy || reschedulePolicy) && (
        <details className="mt-6 group">
          <summary className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors list-none">
            Políticas
            <ChevronDown className="w-4 h-4 transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <div className="mt-3 space-y-3 px-4">
            {cancellationPolicy && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cancelación</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{cancellationPolicy}</p>
              </div>
            )}
            {reschedulePolicy && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Reagendamiento</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{reschedulePolicy}</p>
              </div>
            )}
          </div>
        </details>
      )}
    </div>
  );
};

export default BookingForm;
