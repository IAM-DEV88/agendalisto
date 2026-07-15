import React, { useState, useEffect, useMemo } from 'react';
import { Clock, CheckCircle, ArrowLeft, Send, AlertCircle, Gift, Check, X, Lock, FileText, Eye, CalendarDays, Download, Store, User, ChevronLeft, ChevronRight } from 'lucide-react';
import CrossPromotion from '../CrossPromotion';
import AvailabilityCalendar from './AvailabilityCalendar';
import { createAppointment, Service, getBusinessHours, getBusinessAppointments, BusinessHours, Appointment, validateGiftCode, redeemGiftCode } from '../../../lib/api';
import type { GuestInfo, GiftCode } from '../../../lib/api';
import { signUp } from '../../../lib/supabase';
import { notifyError, notifyLoading, dismissToast } from '../../../lib/toast';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import PaymentMethodSelector from '../../PaymentMethodSelector';

import { downloadIcs } from '../../../utils/icsUtils';

interface BusinessContact {
  phone?: string;
  email?: string;
  whatsapp?: string;
  address?: string;
}

interface BookingFormProps {
  businessId: string;
  businessName: string;
  businessAddress?: string;
  businessContact?: BusinessContact;
  serviceId: string;
  userId?: string;
  service: Service | null;
  onClose: () => void;
  showPrices: boolean;
  requireConfirmation?: boolean;
  notifyEmail?: boolean;
  notifyWhatsapp?: boolean;
  minCancellationHours?: number;
  minRescheduleHours?: number;
  guestInfo?: GuestInfo;
  isOwnerPreview?: boolean;
  slotIntervalMinutes?: number;
  bufferMinutes?: number;
  maxAdvanceBookingDays?: number;
  onlineBookable?: boolean;
  images?: string[];
  activeImageIndex?: number;
  onImageChange?: (index: number) => void;
  onFullscreenImage?: (url: string) => void;
  onUserRegistered?: () => void;
  cancellationPolicy?: string | null;
  reschedulePolicy?: string | null;
}

const BookingForm: React.FC<BookingFormProps> = ({
  businessId,
  businessName,
  businessAddress = '',
  businessContact,
  serviceId,
  userId,
  service,
  onClose,
  showPrices,
  requireConfirmation = false,
  notifyEmail = false,
  notifyWhatsapp = false,
  minCancellationHours = 0,
  minRescheduleHours = 0,
  guestInfo,
  isOwnerPreview = false,
  slotIntervalMinutes = 30,
  bufferMinutes = 0,
  maxAdvanceBookingDays = 90,
  onlineBookable = true,
  images,
  activeImageIndex: controlledImageIndex,
  onImageChange,
  onFullscreenImage,
  onUserRegistered,
  cancellationPolicy,
  reschedulePolicy,
}) => {
  const [localImageIndex, setLocalImageIndex] = useState(0);
  const imageIndex = controlledImageIndex ?? localImageIndex;
  const handleImageChange = onImageChange ?? setLocalImageIndex;
  const [localGuestInfo, setLocalGuestInfo] = useState<GuestInfo>(guestInfo || { name: '', email: '', phone: '' });
  const [guestPassword, setGuestPassword] = useState('');
  const [registering, setRegistering] = useState(false);
  const [registeredUserId, setRegisteredUserId] = useState<string | null>(null);
  const [confirmationChecked, setConfirmationChecked] = useState(!requireConfirmation);
  const [formData, setFormData] = useState({ date: '', time: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    if (bookingSuccess) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [bookingSuccess]);
  const [error, setError] = useState<string | null>(null);
  const [giftCodeInput, setGiftCodeInput] = useState('');
  const [giftApplied, setGiftApplied] = useState<GiftCode | null>(null);
  const [giftError, setGiftError] = useState('');
  const [validatingGift, setValidatingGift] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showPurchase, setShowPurchase] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  const handleDirectPurchasePayPal = async (): Promise<string> => {
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

  const handleDirectPurchaseApprove = async (orderId: string) => {
    setPurchasing(true);
    try {
      const placeholderDate = new Date().toISOString().split('T')[0];
      const placeholderTime = '12:00';
      const startTime = new Date(`${placeholderDate}T${placeholderTime}`);
      const endTime = new Date(startTime.getTime() + (service?.duration || 60) * 60000);

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
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            notes: 'Compra directa — pendiente de coordinar fecha',
            guest_info: !userId ? localGuestInfo : null,
            payment_provider: 'paypal',
            payment_amount: paymentAmount,
          },
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Error al procesar pago');
      toast.success('Pago exitoso! El negocio te contactará para coordinar la cita.');
      setShowPurchase(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al procesar pago');
    } finally {
      setPurchasing(false);
    }
  };

  const handleDirectPurchaseWompi = async () => {
    setPurchasing(true);
    try {
      const placeholderDate = new Date().toISOString().split('T')[0];
      const placeholderTime = '12:00';
      const startTime = new Date(`${placeholderDate}T${placeholderTime}`);
      const endTime = new Date(startTime.getTime() + (service?.duration || 60) * 60000);

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
            notes: 'Compra directa — pendiente de coordinar fecha',
            guest_info: !userId ? localGuestInfo : null,
            amount: paymentAmount,
            currency: 'COP',
          },
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Error al procesar pago');
      toast.success('Pago exitoso! El negocio te contactará para coordinar la cita.');
      setShowPurchase(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al procesar pago');
    } finally {
      setPurchasing(false);
    }
  };

  const [businessHours, setBusinessHours] = useState<BusinessHours[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);

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
      setError(`Debes aceptar las condiciones: cancelación ${minCancellationHours}h${minRescheduleHours > 0 ? `, reagendamiento ${minRescheduleHours}h` : ''} de antelación`);
      return;
    }
    if (!businessId || !serviceId || !service) {
      setError('Faltan datos para la reserva');
      return;
    }
    if (!userId && (!localGuestInfo.name.trim() || !localGuestInfo.email.trim() || !guestPassword.trim())) {
      setError('Completa tu nombre, correo y contraseña para crear tu cuenta');
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

    if (!showSummary && userId) {
      setShowSummary(true);
      return;
    }

    let toastId = '';
    try {
      setSubmitting(true);
      setError(null);

      // Register user if guest
      let effectiveUserId = userId || '';
      if (!effectiveUserId) {
        setRegistering(true);
        toastId = notifyLoading('Creando tu cuenta...');
        const signupRes = await signUp(localGuestInfo.email, guestPassword, localGuestInfo.name);
        if (signupRes.error) {
          dismissToast(toastId);
          setError(signupRes.error.message || 'Error al crear la cuenta');
          setRegistering(false);
          setSubmitting(false);
          return;
        }
        effectiveUserId = signupRes.data?.user?.id;
        if (!effectiveUserId) {
          dismissToast(toastId);
          setError('No se pudo crear la cuenta. Verifica tu correo.');
          setRegistering(false);
          setSubmitting(false);
          return;
        }
        setRegisteredUserId(effectiveUserId);
        dismissToast(toastId);
        onUserRegistered?.();
        setRegistering(false);
        // Wait for auth session to propagate
        await new Promise(r => setTimeout(r, 1000));
      }

      toastId = notifyLoading('Enviando solicitud...');
      setError(null);

      const result = await createAppointment({
        business_id: businessId,
        service_id: serviceId,
        user_id: effectiveUserId,
        start_time: new Date(`${formData.date}T${formData.time}`).toISOString(),
        end_time: new Date(new Date(`${formData.date}T${formData.time}`).getTime() + (service?.duration || 0) * 60000).toISOString(),
        status: requireConfirmation ? 'pending' as const : 'confirmed' as const,
        notes: formData.notes || null,
        is_guest: false,
        guest_info: null,
        payment_status: undefined,
        payment_provider: undefined,
        payment_id: undefined,
        payment_amount: undefined,
      });

      dismissToast(toastId);
      if (result) {
        if (giftApplied) {
          await redeemGiftCode(giftApplied.code);
        }
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
      setRegistering(false);
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
  };

  const handleTimeSelect = (time: string) => {
    setFormData(prev => ({ ...prev, time }));
  };

  const resetForm = () => {
    setFormData({ date: '', time: '', notes: '' });
    setError(null);
    setBookingSuccess(false);
    setShowSummary(false);
    setRegisteredUserId(null);
  };

  if (bookingSuccess) {
    return (
      <div className="text-center py-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center mx-auto mb-5 ring-8 ring-emerald-50 dark:ring-emerald-500/5">
          <CheckCircle className="w-8 h-8 text-emerald-500" />
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">Solicitud enviada!</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed mb-6">
          {requireConfirmation
            ? 'El negocio revisara tu solicitud y te confirmara la cita pronto.'
            : 'Tu cita ha sido agendada correctamente.'}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          {notifyEmail && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-full">
              <CheckCircle className="w-3 h-3" />
              Confirmación por correo
            </span>
          )}
          {notifyWhatsapp && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-full">
              <CheckCircle className="w-3 h-3" />
              Notificación por WhatsApp
            </span>
          )}
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
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
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-[0.97]"
          >
            <Download className="w-3.5 h-3.5" />
            Agregar a mi calendario
          </button>
          <Link to="/dashboard" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm rounded-lg transition-all shadow-lg shadow-primary-500/25 active:scale-[0.98]">
            Ver mis reservas
          </Link>
          <button onClick={() => { resetForm(); onClose(); }} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-[0.98]">
            Cerrar
          </button>
        </div>
        {businessAddress && (
          <div className="mt-6">
            <CrossPromotion businessId={businessId} businessAddress={businessAddress} excludeId={businessId} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-5">
      {/* ─── Hero: gallery + info fusionados ─── */}
      <div className={`overflow-hidden bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 ${images && images.length > 0 ? 'md:grid md:grid-cols-5' : 'p-4 sm:p-5'}`}>
        {images && images.length > 0 && (
          <div className="md:col-span-2 relative flex flex-col bg-slate-100 dark:bg-slate-800">
            <div className="relative aspect-[4/3] md:flex-1 md:min-h-[200px] md:max-h-[300px] group overflow-hidden">
              <img src={images[imageIndex]} alt={service?.name || ''}
                className="w-full h-full object-contain cursor-zoom-in transition-all duration-500 group-hover:scale-105"
                onClick={() => onFullscreenImage?.(images[imageIndex])} />
              {images.length > 1 && (
                <>
                  <button onClick={(e) => { e.stopPropagation(); handleImageChange((imageIndex - 1 + images.length) % images.length); }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/80 hover:bg-white text-slate-700 rounded-full shadow-md transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm">
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleImageChange((imageIndex + 1) % images.length); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/80 hover:bg-white text-slate-700 rounded-full shadow-md transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {images.map((_, i) => (
                      <button key={i} onClick={() => handleImageChange(i)}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${i === imageIndex ? 'bg-white scale-125 shadow-sm' : 'bg-white/50'}`} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        <div className={`${images && images.length > 0 ? 'md:col-span-3 p-4 md:p-5' : ''} flex flex-col justify-center`}>
          <div className="flex items-center gap-2 text-[11px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-1">
            <Store className="w-3 h-3" />
            {businessName}
          </div>
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-lg md:text-xl font-black text-slate-900 dark:text-white leading-tight mb-0">
              {service?.name}
            </h1>
            {showPrices && (service?.price ?? 0) > 0 && (
              <span className="text-lg md:text-xl font-black text-primary-600 dark:text-primary-400 flex-shrink-0 whitespace-nowrap">
                ${service!.price.toLocaleString()}
              </span>
            )}
          </div>
          <div className="flex items-center flex-wrap gap-3 mt-2">
            <span className="flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400">
              <Clock className="w-3.5 h-3.5 text-primary-500" />
              {service?.duration} min
            </span>
            {service?.provider && (
              <span className="flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                <User className="w-3.5 h-3.5 text-primary-400" />
                {service.provider}
              </span>
            )}
            {!isOwnerPreview && onlineBookable && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                requireConfirmation
                  ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400'
                  : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
              }`}>
                {requireConfirmation
                  ? <><Clock className="w-2.5 h-2.5" /> Requiere confirmación</>
                  : <><CheckCircle className="w-2.5 h-2.5" /> Reserva inmediata</>}
              </span>
            )}
          </div>
          {service?.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2 line-clamp-2 whitespace-pre-line">{service.description}</p>
          )}
        </div>
      </div>

      {!onlineBookable && !isOwnerPreview ? (
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800">
          <div className="p-4 sm:p-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center flex-shrink-0">
              <Store className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900 dark:text-white mb-0">Reserva no disponible online</p>
              <p className="text-xs text-slate-400 mb-0">Contacta directamente con {businessName}</p>
            </div>
          </div>
          {service?.requires_payment && (
            <div className="p-4 sm:p-5">
              {!showPurchase ? (
                <button onClick={() => setShowPurchase(true)}
                  className="flex items-center justify-center gap-2 w-full px-5 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg shadow-lg shadow-primary-500/25 transition-all hover:-translate-y-0.5 active:translate-y-0">
                  <Lock className="w-4 h-4" />
                  Comprar ahora — ${(service?.price ?? 0).toLocaleString()}
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Lock className="w-3 h-3" />
                    Pago seguro — El negocio te contactará
                  </p>
                  <PaymentMethodSelector amount={paymentAmount} currency="COP" serviceName={service?.name || ''} businessName={businessName}
                    userId={userId || ''} onPayPalCreateOrder={handleDirectPurchasePayPal} onPayPalApprove={handleDirectPurchaseApprove}
                    onWompiPay={handleDirectPurchaseWompi} disabled={purchasing} />
                </div>
              )}
            </div>
          )}
          <div className="p-4 sm:p-5 grid grid-cols-2 gap-2">
            {businessContact?.whatsapp && (
              <a href={`https://wa.me/${businessContact.whatsapp.replace(/[^0-9]/g, '')}?${encodeURIComponent(`Hola! Quiero agendar: ${service?.name || ''}`)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2.5 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/10 hover:bg-emerald-100 dark:hover:bg-emerald-900/20 transition-all group">
                <span className="text-lg flex-shrink-0">💬</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">WhatsApp</p>
                  <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 truncate">{businessContact.whatsapp}</p>
                </div>
              </a>
            )}
            {businessContact?.phone && (
              <a href={`tel:${businessContact.phone}`}
                className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all group">
                <span className="text-lg flex-shrink-0">📞</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Teléfono</p>
                  <p className="text-[10px] text-slate-500 truncate">{businessContact.phone}</p>
                </div>
              </a>
            )}
            {businessContact?.email && (
              <a href={`mailto:${businessContact.email}`}
                className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all group">
                <span className="text-lg flex-shrink-0">📧</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Email</p>
                  <p className="text-[10px] text-slate-500 truncate">{businessContact.email}</p>
                </div>
              </a>
            )}
            {businessContact?.address && (
              <a href={`https://maps.google.com/?q=${encodeURIComponent(businessContact.address)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all group">
                <span className="text-lg flex-shrink-0">📍</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Dirección</p>
                  <p className="text-[10px] text-slate-500 truncate">{businessContact.address}</p>
                </div>
              </a>
            )}
          </div>
        </div>
      ) : (
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ─── Step 1: Date + Time ─── */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary-600 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">1</span>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Fecha y hora</span>
            </div>
          </div>
          <div className="p-4 sm:p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
              <div className="flex flex-col">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Selecciona el día</label>
                <AvailabilityCalendar
                  businessHours={businessHours}
                  maxAdvanceDays={maxAdvanceBookingDays}
                  selectedDate={formData.date}
                  onSelectDate={handleDateSelect}
                />
              </div>
              <div className="flex flex-col">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Elige un horario</label>
                {!formData.date ? (
                  <div className="flex-1 flex items-center justify-center min-h-[280px] max-h-[380px] bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                    <div className="text-center">
                      <CalendarDays className="w-6 h-6 text-slate-300 dark:text-slate-600 mx-auto mb-1.5" />
                      <p className="text-xs font-medium text-slate-400 italic">Selecciona una fecha</p>
                    </div>
                  </div>
                ) : loadingSlots ? (
                  <div className="flex-1 grid grid-cols-2 gap-2 content-start min-h-[280px] max-h-[380px]">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-9 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : availableTimeSlots.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center min-h-[280px] max-h-[380px] bg-amber-50 dark:bg-amber-500/10 rounded-lg border border-dashed border-amber-200 dark:border-amber-800">
                    <div className="text-center">
                      <Clock className="w-6 h-6 text-amber-400 mx-auto mb-1.5" />
                      <p className="text-xs font-bold text-amber-700 dark:text-amber-400">Sin turnos disponibles</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 grid grid-cols-2 gap-2 content-start overflow-y-auto pr-0.5 scrollbar-fino min-h-[280px] max-h-[380px]">
                    {availableTimeSlots.map((slot) => (
                      <button key={slot} type="button" onClick={() => handleTimeSelect(slot)}
                        className={`py-2.5 text-xs font-bold rounded-lg border transition-all active:scale-95 ${
                          formData.time === slot
                            ? 'bg-primary-600 border-primary-600 text-white shadow-md shadow-primary-500/30'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-primary-400 dark:hover:border-primary-600'
                        }`}>
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Step 2: Details ─── */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary-600 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">2</span>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Detalles</span>
            </div>
          </div>
          <div className="p-4 sm:p-5 space-y-3">
            <div className="relative">
              <FileText className="absolute top-3 left-3 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <textarea id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all resize-none"
                rows={3} placeholder="Algo que debamos saber? (opcional)" />
            </div>
            {requireConfirmation && (
              <label className="flex items-start gap-2.5 p-3 bg-amber-50 dark:bg-amber-500/10 rounded-lg border border-amber-200 dark:border-amber-800/50 cursor-pointer">
                <input type="checkbox" checked={confirmationChecked} onChange={(e) => setConfirmationChecked(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-amber-300 text-primary-600 focus:ring-primary-500 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-amber-800 dark:text-amber-400 mb-0">Acepto las condiciones</p>
                  <p className="text-[11px] text-amber-600 dark:text-amber-500 mt-0.5 mb-0">
                    Cancelación {minCancellationHours}h{minRescheduleHours > 0 ? ` · Reagendamiento ${minRescheduleHours}h` : ''}
                  </p>
                </div>
              </label>
            )}
            {!isOwnerPreview && (cancellationPolicy || reschedulePolicy) && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Políticas del servicio</p>
                <div className="space-y-1.5">
                  {cancellationPolicy && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      <span className="font-medium text-slate-600 dark:text-slate-300">Cancelación:</span> {cancellationPolicy}
                    </p>
                  )}
                  {reschedulePolicy && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      <span className="font-medium text-slate-600 dark:text-slate-300">Reagendamiento:</span> {reschedulePolicy}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── Step 3: Guest registration ─── */}
        {!userId && !showPayment && (
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary-600 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">3</span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Crea tu cuenta gratis</span>
              </div>
            </div>
            <div className="p-4 sm:p-5 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input type="text" value={localGuestInfo.name} onChange={(e) => setLocalGuestInfo(p => ({ ...p, name: e.target.value }))}
                  placeholder="Nombre" className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all" />
                <input type="email" value={localGuestInfo.email} onChange={(e) => setLocalGuestInfo(p => ({ ...p, email: e.target.value }))}
                  placeholder="Correo electrónico" className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input type="tel" value={localGuestInfo.phone} onChange={(e) => setLocalGuestInfo(p => ({ ...p, phone: e.target.value }))}
                  placeholder="Teléfono (opcional)" className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all" />
                <input type="password" value={guestPassword} onChange={(e) => setGuestPassword(e.target.value)}
                  placeholder="Contraseña" className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all" />
              </div>
            </div>
          </div>
        )}

        {/* ─── Summary ─── */}
        {showSummary && formData.date && formData.time && (
          <div className="bg-primary-50/50 dark:bg-primary-900/10 rounded-lg border border-primary-200 dark:border-primary-800/50 p-4">
            <p className="text-xs font-bold text-primary-600 dark:text-primary-400 flex items-center gap-1.5 mb-2">
              <CalendarDays className="w-3.5 h-3.5" /> Resumen
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
              <span className="font-medium text-slate-500 dark:text-slate-500">Servicio</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 text-right">{service?.name}</span>
              <span className="font-medium text-slate-500 dark:text-slate-500">Fecha</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 text-right">{new Date(formData.date + 'T12:00').toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
              <span className="font-medium text-slate-500 dark:text-slate-500">Hora</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 text-right">{formData.time} hs</span>
              <span className="font-medium text-slate-500 dark:text-slate-500">Duración</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 text-right">{service?.duration} min</span>
              {showPrices && service?.price ? (
                <><span className="font-medium text-slate-500 dark:text-slate-500">Precio</span>
                <span className="font-bold text-primary-600 dark:text-primary-400 text-right">${service.price.toLocaleString()}</span></>
              ) : null}
            </div>
            {formData.notes && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-primary-200/50 dark:border-primary-800/30">
                <span className="font-medium">Notas:</span> {formData.notes}
              </p>
            )}
          </div>
        )}

        {/* ─── Payment ─── */}
        {showPayment && (
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-4 py-3 bg-amber-50 dark:bg-amber-500/10 border-b border-amber-200 dark:border-amber-800/50">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                  Pago requerido: <strong>${paymentAmount.toLocaleString()} COP</strong>
                </p>
              </div>
            </div>
            <div className="p-4 sm:p-5">
              <PaymentMethodSelector amount={paymentAmount} currency="COP" serviceName={service?.name || ''} businessName={businessName}
                userId={userId || ''} onPayPalCreateOrder={handlePayPalCreateOrder} onPayPalApprove={handlePayPalApprove}
                onWompiPay={handleWompiPay} disabled={submitting} />
            </div>
          </div>
        )}

        {/* ─── Error ─── */}
        {error && (
          <div className="flex items-start gap-2 px-3.5 py-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-800 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs font-bold text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* ─── Actions ─── */}
        {!showPayment && (
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <button type="button" onClick={onClose}
                className="sm:flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-sm rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-[0.98]">
                <ArrowLeft className="w-4 h-4" /> Cancelar
              </button>
              <button type="submit" disabled={!formData.date || !formData.time || submitting || registering || isOwnerPreview}
                className="sm:flex-[2] inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm rounded-lg shadow-lg shadow-primary-500/25 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:-translate-y-0">
                {submitting || registering ? (
                  <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> {registering ? 'Creando cuenta...' : 'Procesando...'}</>
                ) : isOwnerPreview ? (
                  <><Eye className="w-4 h-4" /> Vista previa</>
                ) : !userId && !registeredUserId ? (
                  <><Send className="w-4 h-4" /> Crear cuenta y reservar</>
                ) : showSummary ? (
                  <><Send className="w-4 h-4" /> Confirmar reserva</>
                ) : (
                  <><Send className="w-4 h-4" /> {requireConfirmation ? 'Solicitar Cita' : 'Confirmar Reserva'}</>
                )}
              </button>
            </div>
            <p className="text-center text-[11px] text-slate-400 font-medium mt-2">
              {showSummary
                ? 'Revisa los detalles y confirma'
                : requireConfirmation
                  ? 'El negocio confirmara tu solicitud'
                  : 'Tu cita sera agendada instantaneamente'}
            </p>
          </div>
        )}
      </form>
      )}



      {/* ─── Gift ─── */}
      {service?.can_be_gifted && (
        <div className="bg-rose-50 dark:bg-rose-900/10 rounded-lg border border-rose-200 dark:border-rose-800/50 p-3">
          <p className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 mb-2">
            <Gift className="w-3.5 h-3.5" /> Código de regalo?
          </p>
          {giftApplied ? (
            <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-lg p-2.5 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="font-bold text-emerald-700 dark:text-emerald-300">Aplicado</span>
                <span className="text-xs text-slate-400 ml-1">Servicio gratis</span>
              </div>
              <button onClick={() => setGiftApplied(null)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-rose-400 pointer-events-none" />
                  <input type="text" value={giftCodeInput} onChange={e => setGiftCodeInput(e.target.value.toUpperCase())} placeholder="GIFT-ABC123"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none" />
                </div>
                <button onClick={async () => {
                  if (!giftCodeInput.trim()) return;
                  setValidatingGift(true);
                  setGiftError('');
                  const res = await validateGiftCode(giftCodeInput.trim(), serviceId, businessId);
                  setValidatingGift(false);
                  if (res.success && res.gift) { setGiftApplied(res.gift); setGiftCodeInput(''); toast.success('Código aplicado!'); }
                  else { setGiftError(res.error || 'Código inválido'); }
                }} disabled={validatingGift || !giftCodeInput.trim()}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-lg transition-all disabled:opacity-50">
                  {validatingGift ? '...' : 'Canjear'}
                </button>
              </div>
              {giftError && <p className="text-xs text-red-500">{giftError}</p>}
              <div className="flex items-center gap-2 text-[11px] text-rose-400">
                <span className="flex-1 border-t border-rose-200 dark:border-rose-800/50" />
                <span>o</span>
                <span className="flex-1 border-t border-rose-200 dark:border-rose-800/50" />
              </div>
              <a href={`/${window.location.pathname.split('/')[1]}/gift/${serviceId}`}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 text-sm font-bold rounded-lg transition-all active:scale-[0.98]">
                <Gift className="w-4 h-4" />
                Regalar este servicio
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BookingForm;
