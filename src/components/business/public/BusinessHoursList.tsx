import React from 'react';
import { Clock } from 'lucide-react';
import { BusinessHours } from '../../../lib/api';

interface BusinessHoursListProps {
  businessHours: BusinessHours[];
}

const BusinessHoursList: React.FC<BusinessHoursListProps> = ({ businessHours }) => {
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  const formatTime = (time: string) => {
    if (!time) return '';
    if (time.includes('T')) return time.split('T')[1].substring(0, 5);
    const parts = time.split(':');
    if (parts.length >= 2) return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    return time;
  };

  const today = new Date().getDay();
  const todayIndex = today === 0 ? 6 : today - 1;

  return (
    <div className="space-y-1">
      {days.map((day, index) => {
        const hours = businessHours.find(h => h.day_of_week === index);
        const isOpen = hours && !hours.is_closed;
        const isToday = index === todayIndex;

        return (
          <div
            key={index}
            className={`flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors ${
              isToday ? 'bg-primary-50 dark:bg-primary-500/10 border border-primary-200 dark:border-primary-800' : ''
            }`}
          >
            <div className="flex items-center gap-2">
              {isToday && <Clock className="w-3 h-3 text-primary-500" />}
              <span className={`text-sm font-bold ${isToday ? 'text-primary-700 dark:text-primary-300' : isOpen ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-600'}`}>
                {day}
              </span>
              {isToday && (
                <span className="text-[9px] font-black text-primary-500 uppercase tracking-widest">Hoy</span>
              )}
            </div>
            {isOpen ? (
              <span className="text-sm font-black text-primary-600 dark:text-primary-400">
                {formatTime(hours.start_time)} - {formatTime(hours.end_time)}
              </span>
            ) : (
              <span className="text-xs font-bold text-slate-400 dark:text-slate-600 uppercase tracking-wider">
                Cerrado
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default BusinessHoursList;
