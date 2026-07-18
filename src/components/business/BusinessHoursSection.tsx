import React, { useState } from 'react';
import { Clock, Save, Loader2, CalendarX, Coffee } from 'lucide-react';
import { BusinessHours } from '../../lib/api';
import SectionHeader from '../ui/SectionHeader';
import TabNav from '../ui/TabNav';
import EmptyState from '../ui/EmptyState';
import type { Tab } from '../ui/TabNav';
import StaffSection from './StaffSection';

interface BusinessHoursSectionProps {
  businessHours: BusinessHours[];
  loading: boolean;
  saving: boolean;
  message: { text: string; type: 'success' | 'error' } | null;
  onSave: (e: React.FormEvent) => Promise<boolean | void>;
  onHoursChange: (index: number, field: keyof Omit<BusinessHours, 'id'>, value: any) => void;
  days: string[];
  businessId?: string;
  plan?: 'starter' | 'pro' | 'premium';
  passwordProtectionEnabled?: boolean;
  passwordProtectStaff?: boolean;
  passwordProtectHours?: boolean;
  passwordProtectServices?: boolean;
  passwordProtectAppointments?: boolean;
  passwordProtectProfile?: boolean;
}

const BusinessHoursSection: React.FC<BusinessHoursSectionProps> = ({
  businessHours,
  loading,
  saving,
  onSave,
  onHoursChange,
  days,
  businessId,
  plan = 'starter',
  passwordProtectionEnabled,
  passwordProtectStaff,
  passwordProtectHours: _passwordProtectHours,
  passwordProtectServices: _passwordProtectServices,
  passwordProtectAppointments: _passwordProtectAppointments,
  passwordProtectProfile: _passwordProtectProfile,
}) => {
  const [activeHoursTab, setActiveHoursTab] = useState('jornadas');

  const hoursTabs: Tab[] = [
    { id: 'jornadas', label: 'Jornadas' },
    { id: 'breaks', label: 'Breaks' },
    { id: 'encargados', label: 'Encargados' },
  ];

  return (
    <div>
      <div className="mb-4 md:mb-6">
        <SectionHeader 
          title="Horario de Atención" 
          description="Configura jornadas laborales, descansos y encargados del negocio"
        />
      </div>

      <TabNav tabs={hoursTabs} activeTabId={activeHoursTab} onTabChange={setActiveHoursTab} variant="pill" sticky connected />

      <div className="bg-white dark:bg-slate-900 rounded-b-lg border border-slate-100 dark:border-slate-800 p-4 md:p-6 -mt-px min-h-[200px]">
        <div className="animate-in fade-in zoom-in-95 duration-300">

          {activeHoursTab === 'jornadas' && (
            loading && businessHours.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
                <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
                <p className="text-slate-500 font-medium">Cargando horario...</p>
              </div>
            ) : (
              <form onSubmit={onSave}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                  {businessHours.map((hour, idx) => (
                    <div key={hour.day_of_week} className="group py-4 border-b border-slate-100 dark:border-slate-800 last:border-0 md:[&:nth-last-child(2)]:border-0">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-base font-bold text-slate-900 dark:text-white capitalize">
                          {days[hour.day_of_week]}
                        </span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!hour.is_closed}
                            onChange={e => onHoursChange(idx, 'is_closed', !e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-primary-600"></div>
                          <span className="ml-3 text-sm font-bold text-slate-500 dark:text-slate-400 min-w-[60px]">
                            {hour.is_closed ? 'Cerrado' : 'Abierto'}
                          </span>
                        </label>
                      </div>
                      
                      {!hour.is_closed ? (
                        <div className="flex items-center gap-3 animate-in slide-in-from-top-1 duration-200">
                          <div className="relative flex-1">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                              type="time"
                              value={hour.start_time}
                              onChange={e => onHoursChange(idx, 'start_time', e.target.value)}
                              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm font-bold text-slate-900 dark:text-white"
                            />
                          </div>
                          <span className="text-slate-400 font-bold">a</span>
                          <div className="relative flex-1">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                              type="time"
                              value={hour.end_time}
                              onChange={e => onHoursChange(idx, 'end_time', e.target.value)}
                              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm font-bold text-slate-900 dark:text-white"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-400 py-2 italic text-sm">
                          <CalendarX className="w-4 h-4" />
                          <span>No se aceptan citas este día</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
                  <button 
                    type="submit" 
                    disabled={saving} 
                    className="inline-flex items-center px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg transition-all shadow-lg shadow-primary-500/25 gap-2 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    {saving ? 'Guardando...' : 'Guardar Horario'}
                  </button>
                </div>
              </form>
            )
          )}

          {activeHoursTab === 'breaks' && (
            <EmptyState
              icon={<Coffee className="w-8 h-8" />}
              title="Sin descansos configurados"
              description="Los descansos te permiten pausar la recepción de citas en momentos específicos del día, como horario de almuerzo."
            />
          )}

          {activeHoursTab === 'encargados' && businessId && (
            <StaffSection businessId={businessId} plan={plan} passwordProtectionEnabled={passwordProtectionEnabled} passwordProtectStaff={passwordProtectStaff} />
          )}

        </div>
      </div>
    </div>
  );
};

export default BusinessHoursSection; 
