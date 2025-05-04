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

  // Return full week: if no entry for a day, show as Closed
  return (
    <ul className="space-y-2">
      {days.map((dayName, idx) => {
        const hour = businessHours.find(h => h.day_of_week === idx);
        return (
          <li key={idx} className="flex justify-between py-2 border-b border-gray-100">
            <span className="font-medium">{dayName}</span>
            {hour ? (
              hour.is_closed ? (
                <span>Cerrado</span>
              ) : (
                <span>{formatTime(hour.start_time)} - {formatTime(hour.end_time)}</span>
              )
            ) : (
              <span>Cerrado</span>
            )}
          </li>
        );
      })}
    </ul>
  );
};

export default BusinessHoursList; 
