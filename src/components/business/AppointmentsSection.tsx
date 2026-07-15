import React from 'react';
import { Calendar, User, Clock, Loader2, CheckCircle2, XCircle, PlayCircle, Info } from 'lucide-react';
import SectionHeader from '../ui/SectionHeader';

interface AppointmentsSectionProps {
  appointments: import('../../lib/api').Appointment[];
  loading: boolean;
  onUpdateStatus: (id: string, status: 'pending' | 'confirmed' | 'completed' | 'cancelled') => Promise<void>;
}

const AppointmentsSection: React.FC<AppointmentsSectionProps> = ({ 
  appointments, 
  loading,
  onUpdateStatus 
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <SectionHeader 
        title="Próximas Citas" 
        description="Gestiona las reservas activas y pendientes de confirmación"
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
          <p className="text-slate-500 font-medium">Cargando citas...</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="card p-12 flex flex-col items-center text-center max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-6 text-slate-400">
            <Calendar className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">No hay citas pendientes</h3>
          <p className="text-slate-500 dark:text-slate-400">Cuando tus clientes realicen reservas, aparecerán aquí para que las gestiones.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {appointments.map((appointment: any) => {
              return (
                <li key={appointment.id} className="p-4 sm:p-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${
                        appointment.status === 'pending' 
                          ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' 
                          : 'bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400'
                      }`}>
                        {appointment.status === 'pending' ? <Info className="w-6 h-6" /> : <PlayCircle className="w-6 h-6" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-lg font-black text-slate-900 dark:text-white truncate tracking-tight">
                            {appointment.services?.name}
                          </h4>
                          <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-lg ${
                            appointment.status === 'pending' 
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' 
                              : 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                          }`}>
                            {appointment.status === 'pending' ? 'Pendiente' : 'Confirmada'}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-6 gap-y-1 mt-1">
                          <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                            <User className="w-4 h-4" />
                            <span>{appointment.profiles?.full_name || 'Usuario desconocido'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                            <Clock className="w-4 h-4" />
                            <span className="capitalize">{formatDate(appointment.start_time)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {appointment.status === 'pending' && (
                        <>
                          <button
                            onClick={() => onUpdateStatus?.(appointment.id, 'confirmed')}
                            className="flex-1 md:flex-none inline-flex items-center justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-all shadow-lg shadow-emerald-500/25 gap-2"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Confirmar
                          </button>
                          <button
                            onClick={() => onUpdateStatus?.(appointment.id, 'cancelled')}
                            className="flex-1 md:flex-none inline-flex items-center justify-center px-4 py-2 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 text-sm font-bold rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all gap-2"
                          >
                            <XCircle className="w-4 h-4" />
                            Rechazar
                          </button>
                        </>
                      )}
                      {appointment.status === 'confirmed' && (
                        <button
                          onClick={() => onUpdateStatus?.(appointment.id, 'completed')}
                          className="w-full md:w-auto inline-flex items-center justify-center px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-lg transition-all shadow-lg shadow-primary-500/25 gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Finalizar Cita
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AppointmentsSection; 
