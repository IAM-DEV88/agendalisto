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
    <div>
      {loading && businessHours.length === 0 ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <form onSubmit={onSave}>
          <div className="bg-gray-50 dark:bg-opacity-10 shadow-md p-4 rounded-md">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Horario Regular */}
              <div>
                <div className="space-y-4">
                  {businessHours.map((hour, idx) => (
                    <div key={hour.day_of_week} className="border-b py-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 ">{days[hour.day_of_week]}</span>
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            checked={hour.is_closed}
                            onChange={e => onHoursChange(idx, 'is_closed', e.target.checked)}
                            className="h-4 w-4 mr-2 text-indigo-600 focus:ring-indigo-500 dark:bg-gray-900"
                          />
                          <span className="text-gray-500 ">Cerrado</span>
                        </label>
                      </div>
                      {!hour.is_closed && (
                        <div className="mt-2 flex items-center space-x-2 flex-wrap">
                          <input
                            type="time"
                            value={hour.start_time}
                            onChange={e => onHoursChange(idx, 'start_time', e.target.value)}
                            className="border rounded-md p-2 text-sm dark:bg-gray-900 "
                          />
                          <span className="text-gray-700 ">-</span>
                          <input
                            type="time"
                            value={hour.end_time}
                            onChange={e => onHoursChange(idx, 'end_time', e.target.value)}
                            className="border rounded-md p-2 text-sm dark:bg-gray-900 "
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
            <div className="mt-2 flex justify-end">
              <button 
                type="submit" 
                disabled={saving} 
                className={`inline-flex rounded-md items-center px-4 py-2 border border-transparent text-sm font-medium -md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${saving ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
        </form>
      )}
    </div>
  );
};

export default BusinessHoursSection; 
