import React from 'react';
import { DollarSign, Calendar, Users, TrendingUp, Award, CalendarCheck, CalendarClock, Star, ListChecks } from 'lucide-react';
import { canAccessAdvancedAnalytics } from '../../lib/roles';

interface StatsSectionProps {
  totalAppointments: number;
  upcomingAppointments: number;
  pendingAppointments: number;
  completedAppointments: number;
  totalClients: number;
  totalServices: number;
  plan: 'starter' | 'pro' | 'premium';
  totalRevenue?: number;
  confirmationRate?: number;
  cancellationRate?: number;
  avgDuration?: number;
  avgPrice?: number;
  topServiceName?: string;
  topServiceCount?: number;
  peakDay?: string;
  peakHour?: number;
  lifetimeValueAvg?: number;
}

const StatCard = ({ icon, label, value, sub, color }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-700 transition-all">
    <div className="flex items-start gap-4">
      <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{value}</p>
        {sub && <p className="text-xs font-medium text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  </div>
);

const StatsSection: React.FC<StatsSectionProps> = ({
  totalAppointments, upcomingAppointments, pendingAppointments, completedAppointments,
  totalClients, totalRevenue = 0,
  confirmationRate = 0, cancellationRate = 0,
  avgDuration = 0, avgPrice = 0,
  topServiceName = '-', topServiceCount = 0,
  peakDay = '-', peakHour = 0, lifetimeValueAvg = 0,
  plan,
}) => {
  const hasAdvanced = canAccessAdvancedAnalytics(plan);

  const countCards = [
    {
      label: 'Confirmadas',
      value: String(upcomingAppointments),
      icon: <CalendarCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      color: 'bg-emerald-50 dark:bg-emerald-500/10',
    },
    {
      label: 'Pendientes',
      value: String(pendingAppointments),
      icon: <CalendarClock className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      color: 'bg-amber-50 dark:bg-amber-500/10',
    },
    {
      label: 'Completadas',
      value: String(completedAppointments),
      icon: <Star className="w-5 h-5 text-primary-600 dark:text-primary-400" />,
      color: 'bg-primary-50 dark:bg-primary-500/10',
    },
    {
      label: 'Clientes',
      value: String(totalClients),
      icon: <ListChecks className="w-5 h-5 text-slate-600 dark:text-slate-400" />,
      color: 'bg-slate-100 dark:bg-slate-800',
    },
  ];

  const basicStats = [
    {
      label: 'Ingresos Totales',
      value: `$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0 })}`,
      sub: totalAppointments > 0 ? `${totalAppointments} citas` : undefined,
      icon: <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      color: 'bg-emerald-50 dark:bg-emerald-500/10',
    },
    {
      label: 'Confirmación',
      value: `${confirmationRate.toFixed(0)}%`,
      sub: `Cancelación ${cancellationRate.toFixed(0)}%`,
      icon: <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />,
      color: 'bg-green-50 dark:bg-green-500/10',
    },
    {
      label: 'Precio Promedio',
      value: `$${avgPrice.toFixed(0)}`,
      sub: `${avgDuration.toFixed(0)} min promedio`,
      icon: <DollarSign className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
      color: 'bg-teal-50 dark:bg-teal-500/10',
    },
  ];

  const advancedStats = [
    {
      label: 'Servicio Top',
      value: topServiceName,
      sub: `${topServiceCount} reservas`,
      icon: <Award className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
      color: 'bg-rose-50 dark:bg-rose-500/10',
    },
    {
      label: 'Día Pico',
      value: peakDay,
      sub: peakHour > 0 ? `${peakHour}:00 hrs` : undefined,
      icon: <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
      color: 'bg-indigo-50 dark:bg-indigo-500/10',
    },
    {
      label: 'Valor por Cliente',
      value: `$${lifetimeValueAvg.toFixed(0)}`,
      sub: `${totalClients} clientes`,
      icon: <Users className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      color: 'bg-amber-50 dark:bg-amber-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white">Estadísticas del negocio</h2>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
          {hasAdvanced ? 'Resumen de rendimiento y métricas clave' : 'Métricas básicas de tu negocio'}
          {!hasAdvanced && (
            <span className="text-amber-600 dark:text-amber-400"> — Actualiza a Premium para ver analytics avanzados.</span>
          )}
        </p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {countCards.map((s, i) => (
            <StatCard key={`count-${i}`} {...s} />
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {basicStats.map((s, i) => (
            <StatCard key={`basic-${i}`} {...s} />
          ))}
        </div>

        {hasAdvanced && (
          <>
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Analytics Avanzados</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {advancedStats.map((s, i) => (
                  <StatCard key={`adv-${i}`} {...s} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StatsSection;
