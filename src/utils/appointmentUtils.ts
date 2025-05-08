import { AppointmentStatus } from '../types/appointment';

export const getStatusText = (status: AppointmentStatus): string => {
  switch (status) {
    case 'pending':
      return 'Pendiente';
    case 'confirmed':
      return 'Confirmada';
    case 'completed':
      return 'Completada';
    case 'cancelled':
      return 'Cancelada';
    default:
      return status;
  }
};

export const filterAppointments = (appointments: any[], status: AppointmentStatus | AppointmentStatus[]) => {
  const statusArray = Array.isArray(status) ? status : [status];
  return appointments.filter(a => statusArray.includes(a.status));
}; 