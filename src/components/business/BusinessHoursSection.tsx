import React from 'react';
import { BusinessHours } from '../../lib/api';

interface BusinessHoursSectionProps {
  businessHours: BusinessHours[];
  loading: boolean;
  saving: boolean;
  message: { text: string; type: 'success' | 'error' } | null;
  onSave: (e: React.FormEvent) => Promise<boolean | void>;
  onHoursChange: (index: number, field: keyof Omit<BusinessHours, 'id'>, value: any) => void;
  days: string[];
}

const BusinessHoursSection: React.FC<BusinessHoursSectionProps> = ({
  businessHours,
  loading,
  saving,
  onSave,
  onHoursChange,
  days
}) => {
  return (
    <div className="container mx-auto">
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <form onSubmit={onSave}>
          <div className="bg-gray-50 dark:bg-opacity-10 shadow-md p-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Horario Regular */}
              <div>
                <div className="space-y-4">
                  {businessHours.map((hour, idx) => (
                    <div key={hour.day_of_week} className="border-b py-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-white">{days[hour.day_of_week]}</span>
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            checked={hour.is_closed}
                            onChange={e => onHoursChange(idx, 'is_closed', e.target.checked)}
                            className="h-4 w-4 mr-2 text-indigo-600 focus:ring-indigo-500 dark:bg-gray-900"
                          />
                          <span className="text-gray-500 dark:text-white">Cerrado</span>
                        </label>
                      </div>
                      {!hour.is_closed && (
                        <div className="mt-2 flex items-center space-x-2 flex-wrap">
                          <input
                            type="time"
                            value={hour.start_time}
                            onChange={e => onHoursChange(idx, 'start_time', e.target.value)}
                            className="border rounded-md p-2 text-sm dark:bg-gray-900 dark:text-white"
                          />
                          <span className="text-gray-700 dark:text-white">-</span>
                          <input
                            type="time"
                            value={hour.end_time}
                            onChange={e => onHoursChange(idx, 'end_time', e.target.value)}
                            className="border rounded-md p-2 text-sm dark:bg-gray-900 dark:text-white"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button 
                type="submit" 
                disabled={saving} 
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                  <polyline points="17 21 17 13 7 13 7 21"></polyline>
                  <polyline points="7 3 7 8 15 8"></polyline>
                </svg>
                {saving ? 'Guardando...' : 'Guardar horarios'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default BusinessHoursSection; 
