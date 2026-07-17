import React, { useMemo } from 'react';
import { User, Mail, Phone, Users, AlertCircle, Calendar, DollarSign, Star } from 'lucide-react';
import { UserProfile } from '../../lib/supabase';
import type { Appointment } from '../../types/appointment';
import EmptyState from '../ui/EmptyState';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ClientsSectionProps {
  clients: UserProfile[];
  loading: boolean;
  message: { text: string; type: 'success' | 'error' } | null;
  appointments?: Appointment[];
  indexOffset?: number;
}

function SkeletonClient() {
  return (
    <div className="flex items-center gap-4 p-4 sm:p-6 animate-pulse">
      <div className="w-12 h-12 rounded-lg bg-slate-200 dark:bg-slate-700" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-lg w-32" />
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-lg w-48" />
      </div>
    </div>
  );
}

interface ClientStats {
  totalAppointments: number;
  lastVisit: Date | null;
  totalSpent: number;
  topService: string;
}

const ClientsSection: React.FC<ClientsSectionProps> = ({ clients, loading, message, appointments = [], indexOffset = 0 }) => {
  const clientStatsMap = useMemo(() => {
    const map = new Map<string, ClientStats>();

    for (const appt of appointments) {
      const uid = appt.user_id;
      if (!map.has(uid)) {
        map.set(uid, { totalAppointments: 0, lastVisit: null, totalSpent: 0, topService: '' });
      }
      const stats = map.get(uid)!;
      stats.totalAppointments++;

      const date = new Date(appt.start_time);
      if (!stats.lastVisit || date > stats.lastVisit) {
        stats.lastVisit = date;
      }

      if (appt.services?.price) {
        stats.totalSpent += appt.services.price;
      }
    }

    for (const [, stats] of map) {
      const serviceCounts = new Map<string, number>();
      for (const appt of appointments) {
        if (appt.services?.name) {
          const name = appt.services.name;
          serviceCounts.set(name, (serviceCounts.get(name) || 0) + 1);
        }
      }
      let topName = '';
      let topCount = 0;
      for (const [name, count] of serviceCounts) {
        if (count > topCount) {
          topCount = count;
          topName = name;
        }
      }
      stats.topService = topName;
    }

    return map;
  }, [appointments]);

  return (
    <div>
      {message && (
        <div className={`flex items-center gap-3 px-5 py-4 rounded-lg text-sm font-bold animate-in fade-in slide-in-from-top-2 duration-300 ${
          message.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
            : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
        }`}>
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
          {[1, 2, 3].map(i => <SkeletonClient key={i} />)}
        </div>
      ) : clients.length === 0 ? (
        <EmptyState
          icon={<Users className="w-8 h-8" />}
          title="Aún no tienes clientes"
          description="Los clientes aparecerán automáticamente cuando realicen su primera reserva."
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
          {clients.map((client, index) => {
            const stats = clientStatsMap.get(client.id);
            return (
              <div key={client.id} className="p-4 sm:p-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400 dark:text-slate-500 flex-shrink-0 mt-1">
                      {indexOffset + index + 1}
                    </span>
                    <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {client.full_name || 'Sin nombre'}
                      </h4>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <Mail className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{client.email}</span>
                        {client.phone && (
                          <>
                            <span className="text-slate-300 dark:text-slate-600">·</span>
                            <Phone className="w-3 h-3 flex-shrink-0" />
                            <span>{client.phone}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {stats && (
                    <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-lg font-black text-slate-900 dark:text-white">{stats.totalAppointments}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Citas</p>
                      </div>
                      <div className="text-right hidden sm:block">
                        <p className="text-lg font-black text-primary-600 dark:text-primary-400">
                          ${stats.totalSpent.toLocaleString()}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gastado</p>
                      </div>
                    </div>
                  )}
                </div>

                {stats && (stats.lastVisit || stats.topService) && (
                  <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-medium text-slate-400">
                    {stats.lastVisit && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Última visita: {format(stats.lastVisit, "d MMM", { locale: es })}
                      </span>
                    )}
                    {stats.topService && (
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400" />
                        {stats.topService}
                      </span>
                    )}
                    {stats.totalAppointments > 0 && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        ${(stats.totalSpent / stats.totalAppointments).toFixed(0)} / cita
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ClientsSection;
