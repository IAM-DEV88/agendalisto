import React from 'react';
import { BusinessHours } from '../../lib/api';

interface BusinessHoursSectionProps {
  businessHours: BusinessHours[];
  loading: boolean;
  saving: boolean;
  message: { text: string; type: 'success' | 'error' } | null;
  onSave: (e: React.FormEvent) => Promise<void>;
  onHoursChange: (index: number, field: keyof Omit<BusinessHours, 'id'>, value: any) => void;
  days: string[];
}

const BusinessHoursSection: React.FC<BusinessHoursSectionProps> = ({
  businessHours,
  loading,
  saving,
  message,
  onSave,
  onHoursChange,
  days
}) => {
  return (
    <div className="container mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Gestión de Horarios</h2>
        <button 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          disabled={saving}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          Bloquear Horario
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}
      
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <form onSubmit={onSave}>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Horario Regular */}
              <div>
                <h3 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  Horario Regular
                </h3>
                <div className="space-y-4">
                  {businessHours.map((hour, idx) => (
                    <div key={hour.day_of_week} className="flex items-center justify-between border-b pb-2">
                      <span className="font-medium text-gray-700">{days[hour.day_of_week]}</span>
                      <div className="flex items-center gap-4">
                        {hour.is_closed ? (
                          <div className="flex items-center">
                            <input 
                              type="checkbox" 
                              checked={hour.is_closed} 
                              onChange={e => onHoursChange(idx, 'is_closed', e.target.checked)} 
                              className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500" 
                            />
                            <span className="text-gray-500">Cerrado</span>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center mr-4">
                              <input 
                                type="checkbox" 
                                checked={hour.is_closed} 
                                onChange={e => onHoursChange(idx, 'is_closed', e.target.checked)} 
                                className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500" 
                              />
                              <span className="text-gray-500">Cerrado</span>
                            </div>
                            <input 
                              type="time" 
                              value={hour.start_time} 
                              onChange={e => onHoursChange(idx, 'start_time', e.target.value)}
                              className="border rounded-md px-2 py-1 text-sm"
                            />
                            <span>-</span>
                            <input 
                              type="time" 
                              value={hour.end_time} 
                              onChange={e => onHoursChange(idx, 'end_time', e.target.value)}
                              className="border rounded-md px-2 py-1 text-sm"
                            />
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Horarios Bloqueados */}
              <div>
                <h3 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  Horarios Bloqueados
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-500 text-center">No hay horarios bloqueados</p>
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