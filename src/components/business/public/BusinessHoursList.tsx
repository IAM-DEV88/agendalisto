import React from 'react';
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

  return (
    <div className="space-y-3">
      {days.map((day, index) => {
        const hours = businessHours.find((h) => h.day_of_week === index);
        const isOpen = hours && !hours.is_closed;

        return (
          <div key={index} className="flex justify-between items-center py-2 group">
            <span className={`text-sm font-bold tracking-tight ${isOpen ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-600'}`}>
              {day}
            </span>
            {isOpen ? (
              <span className="text-sm font-black text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-3 py-1 rounded-lg border border-primary-100 dark:border-primary-800/50">
                {formatTime(hours.start_time)} - {formatTime(hours.end_time)}
              </span>
            ) : (
              <span className="text-xs font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest bg-slate-100 dark:bg-slate-800/50 px-3 py-1 rounded-lg">
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
