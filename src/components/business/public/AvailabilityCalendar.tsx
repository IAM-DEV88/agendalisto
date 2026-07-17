import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isBefore, startOfDay, isToday as isTodayFn } from 'date-fns';
import { es } from 'date-fns/locale';

interface BusinessHours {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_closed: boolean;
}

interface AvailabilityCalendarProps {
  businessHours: BusinessHours[];
  maxAdvanceDays?: number;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  fullyBookedDates?: Set<string>;
}

function jsDayToBusiness(jsDay: number): number {
  return (jsDay + 6) % 7;
}

export default function AvailabilityCalendar({
  businessHours,
  maxAdvanceDays = 90,
  selectedDate,
  onSelectDate,
  fullyBookedDates,
}: AvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const today = startOfDay(new Date());
  const maxDate = maxAdvanceDays > 0
    ? new Date(today.getTime() + maxAdvanceDays * 86400000)
    : null;

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const isDayOpen = (date: Date): boolean => {
    const jsDay = getDay(date);
    const bizDay = jsDayToBusiness(jsDay);
    const hours = businessHours.find(h => h.day_of_week === bizDay);
    return !!hours && !hours.is_closed;
  };

  const isDayDisabled = (date: Date): boolean => {
    if (isBefore(date, today) && !isTodayFn(date)) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const firstDayOffset = useMemo(() => {
    const day = getDay(startOfMonth(currentMonth));
    return jsDayToBusiness(day);
  }, [currentMonth]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-all active:scale-95"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary-500" />
          <span className="text-sm font-black text-slate-900 dark:text-white capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: es })}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-all active:scale-95"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d, i) => (
          <div key={i} className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for offset */}
        {Array.from({ length: firstDayOffset }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const disabled = isDayDisabled(day);
          const open = isDayOpen(day);
          const selected = dateStr === selectedDate;
          const todayMark = isTodayFn(day);

          return (
            <button
              key={dateStr}
              type="button"
              disabled={disabled}
              onClick={() => !disabled && onSelectDate(dateStr)}
              className={`
                relative flex flex-col items-center justify-center py-2 rounded-lg text-sm font-bold transition-all
                ${disabled
                  ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                  : selected
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
                    : open
                      ? 'text-slate-700 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 active:scale-95 cursor-pointer'
                      : 'text-slate-400 dark:text-slate-500 cursor-pointer'
                }
                ${todayMark && !selected ? 'ring-2 ring-primary-300 dark:ring-primary-700' : ''}
              `}
            >
              <span>{format(day, 'd')}</span>
              {/* Availability indicator dot */}
              {!disabled && (
                <span className={`w-1 h-1 rounded-full mt-0.5 ${
                  selected
                    ? 'bg-white'
                    : open
                      ? fullyBookedDates?.has(dateStr)
                        ? 'bg-orange-400'
                        : 'bg-emerald-400'
                      : 'bg-red-300 dark:bg-red-600'
                }`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-[10px] font-bold text-slate-400">Disponible</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-orange-400" />
          <span className="text-[10px] font-bold text-slate-400">Sin turnos</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-300" />
          <span className="text-[10px] font-bold text-slate-400">Cerrado</span>
        </div>
      </div>
    </div>
  );
}
