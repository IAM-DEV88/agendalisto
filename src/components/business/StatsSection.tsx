import React from 'react';
import { Calendar, Clock, CheckSquare, Users, Box, DollarSign, Percent, TrendingUp } from 'lucide-react';

interface StatsSectionProps {
  totalAppointments: number;
  upcomingAppointments: number;
  pastAppointments: number;
  totalClients: number;
  totalServices: number;
  totalRevenue?: number;
  confirmationRate?: number;    // porcentaje 0-100
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
  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Estadísticas del negocio</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 flex items-center">
          <DollarSign className="h-6 w-6 text-green-600" />
          <div className="ml-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Ingresos Totales</p>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">${totalRevenue.toFixed(2)}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 flex items-center">
          <Calendar className="h-6 w-6 text-indigo-600" />
          <div className="ml-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Citas Totales</p>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">{totalAppointments}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 flex items-center">
          <Clock className="h-6 w-6 text-green-600" />
          <div className="ml-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Próximas Citas</p>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">{upcomingAppointments}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 flex items-center">
          <CheckSquare className="h-6 w-6 text-blue-600" />
          <div className="ml-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Citas Pasadas</p>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">{pastAppointments}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 flex items-center">
          <Users className="h-6 w-6 text-yellow-600" />
          <div className="ml-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Clientes Totales</p>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">{totalClients}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 flex items-center">
          <Box className="h-6 w-6 text-pink-600" />
          <div className="ml-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Servicios Totales</p>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">{totalServices}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 flex items-center">
          <TrendingUp className="h-6 w-6 text-indigo-500" />
          <div className="ml-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Tasa de Confirmación</p>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">{confirmationRate.toFixed(2)}%</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 flex items-center">
          <Percent className="h-6 w-6 text-red-500" />
          <div className="ml-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Tasa de Cancelación</p>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">{cancellationRate.toFixed(2)}%</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 flex items-center">
          <Clock className="h-6 w-6 text-gray-600" />
          <div className="ml-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Duración Promedio</p>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">{avgDuration.toFixed(1)} min</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 flex items-center">
          <DollarSign className="h-6 w-6 text-green-700" />
          <div className="ml-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Precio Promedio</p>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">${avgPrice.toFixed(2)}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 flex items-center">
          <Box className="h-6 w-6 text-blue-400" />
          <div className="ml-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Servicio Más Solicitado</p>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">{topServiceName} ({topServiceCount})</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 flex items-center">
          <Users className="h-6 w-6 text-yellow-700" />
          <div className="ml-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Cliente Top</p>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">{topClientName} ({topClientCount})</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 flex items-center">
          <Calendar className="h-6 w-6 text-purple-600" />
          <div className="ml-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Pico</p>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">{peakDay}, {peakHour}:00</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 flex items-center">
          <Users className="h-6 w-6 text-pink-500" />
          <div className="ml-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Clientes Nuevos</p>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">{newClients}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 flex items-center">
          <Users className="h-6 w-6 text-blue-500" />
          <div className="ml-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Clientes Recurrentes</p>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">{returningClients}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 flex items-center">
          <DollarSign className="h-6 w-6 text-teal-600" />
          <div className="ml-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">CLV Promedio</p>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">${lifetimeValueAvg.toFixed(2)}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 flex items-center">
          <Percent className="h-6 w-6 text-indigo-400" />
          <div className="ml-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Valoración Media</p>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">{avgRating.toFixed(1)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsSection; 
