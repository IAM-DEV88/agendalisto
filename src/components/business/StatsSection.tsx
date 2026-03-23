import React from 'react';
import { Calendar, Clock, CheckSquare, Users, Box, DollarSign, Percent, TrendingUp, Star, Award, TrendingDown } from 'lucide-react';
import SectionHeader from '../ui/SectionHeader';

interface StatsSectionProps {
  totalAppointments: number;
  upcomingAppointments: number;
  pastAppointments: number;
  totalClients: number;
  totalServices: number;
  totalRevenue?: number;
  confirmationRate?: number;
  cancellationRate?: number;
  avgDuration?: number;
  avgPrice?: number;
  topServiceName?: string;
  topServiceCount?: number;
  topClientName?: string;
  topClientCount?: number;
  peakDay?: string;
  peakHour?: number;
  newClients?: number;
  returningClients?: number;
  lifetimeValueAvg?: number;
  avgRating?: number;
}

const StatsSection: React.FC<StatsSectionProps> = ({
  totalAppointments,
  upcomingAppointments,
  pastAppointments,
  totalClients,
  totalServices,
  totalRevenue = 0,
  confirmationRate = 0,
  cancellationRate = 0,
  avgDuration = 0,
  avgPrice = 0,
  topServiceName = '-',
  topServiceCount = 0,
  topClientName = '-',
  topClientCount = 0,
  peakDay = '-',
  peakHour = 0,
  newClients = 0,
  returningClients = 0,
  lifetimeValueAvg = 0,
  avgRating = 0
}) => {
  const stats = [
    {
      label: 'Ingresos Totales',
      value: `$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-500/10',
    },
    {
      label: 'Citas Totales',
      value: totalAppointments.toString(),
      icon: Calendar,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-500/10',
    },
    {
      label: 'Próximas Citas',
      value: upcomingAppointments.toString(),
      icon: Clock,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-500/10',
    },
    {
      label: 'Citas Pasadas',
      value: pastAppointments.toString(),
      icon: CheckSquare,
      color: 'text-slate-600 dark:text-slate-400',
      bgColor: 'bg-slate-50 dark:bg-slate-500/10',
    },
    {
      label: 'Clientes Totales',
      value: totalClients.toString(),
      icon: Users,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-500/10',
    },
    {
      label: 'Servicios Totales',
      value: totalServices.toString(),
      icon: Box,
      color: 'text-violet-600 dark:text-violet-400',
      bgColor: 'bg-violet-50 dark:bg-violet-500/10',
    },
    {
      label: 'Tasa de Confirmación',
      value: `${confirmationRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-500/10',
    },
    {
      label: 'Tasa de Cancelación',
      value: `${cancellationRate.toFixed(1)}%`,
      icon: TrendingDown,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-500/10',
    },
    {
      label: 'Duración Promedio',
      value: `${avgDuration.toFixed(0)} min`,
      icon: Clock,
      color: 'text-sky-600 dark:text-sky-400',
      bgColor: 'bg-sky-50 dark:bg-sky-500/10',
    },
    {
      label: 'Precio Promedio',
      value: `$${avgPrice.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-teal-600 dark:text-teal-400',
      bgColor: 'bg-teal-50 dark:bg-teal-500/10',
    },
    {
      label: 'Servicio Top',
      value: topServiceName,
      subValue: `${topServiceCount} citas`,
      icon: Award,
      color: 'text-rose-600 dark:text-rose-400',
      bgColor: 'bg-rose-50 dark:bg-rose-500/10',
    },
    {
      label: 'Valoración Media',
      value: avgRating.toFixed(1),
      icon: Star,
      color: 'text-orange-500 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader 
        title="Estadísticas del negocio" 
        description="Resumen detallado del rendimiento y métricas clave de tu actividad"
      />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="card p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
            <div className={`p-3 rounded-xl ${stat.bgColor} ${stat.color} flex-shrink-0`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">
                {stat.label}
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  {stat.value}
                </p>
                {stat.subValue && (
                  <span className="text-xs font-bold text-slate-400 truncate">
                    {stat.subValue}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatsSection;