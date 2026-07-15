import React, { useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { joinWaitlist } from '../../lib/api';
import { trackEvent } from '../../lib/analytics';
import { notifySuccess, notifyError } from '../../lib/toast';

interface WaitlistButtonProps {
  businessId: string;
  serviceId: string;
  userId?: string;
  guestName?: string;
  guestEmail?: string;
  preferredDate?: string;
  preferredTimeStart?: string;
  preferredTimeEnd?: string;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md';
}

const WaitlistButton: React.FC<WaitlistButtonProps> = ({
  businessId,
  serviceId,
  userId,
  guestName,
  guestEmail,
  preferredDate,
  preferredTimeStart,
  preferredTimeEnd,
  variant = 'primary',
  size = 'md',
}) => {
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleJoin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (joined || loading) return;

    setLoading(true);
    try {
      const result = await joinWaitlist({
        business_id: businessId,
        service_id: serviceId,
        user_id: userId,
        guest_name: guestName,
        guest_email: guestEmail,
        preferred_date: preferredDate,
        preferred_time_start: preferredTimeStart,
        preferred_time_end: preferredTimeEnd,
      });

      if (result.success) {
        setJoined(true);
        trackEvent('waitlist_joined', { businessId, serviceId });
        notifySuccess('Te notificaremos cuando haya disponibilidad');
      } else {
        notifyError(result.error || 'Error al unirse a la lista de espera');
      }
    } catch {
      notifyError('Error al procesar tu solicitud');
    } finally {
      setLoading(false);
    }
  };

  if (joined) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold ${
        size === 'sm' ? 'text-xs' : 'text-sm'
      }`}>
        <Check className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
        En lista de espera
      </span>
    );
  }

  const baseClasses = variant === 'primary'
    ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-500/20'
    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300';

  return (
    <button
      onClick={handleJoin}
      disabled={loading}
      className={`inline-flex items-center justify-center gap-1.5 font-bold rounded-lg transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed ${baseClasses} ${
        size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
      }`}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <Bell className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      )}
      {loading ? 'Uniéndote...' : 'Notificarme'}
    </button>
  );
};

export default WaitlistButton;
