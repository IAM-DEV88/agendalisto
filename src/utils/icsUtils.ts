import type { Appointment } from '../types/appointment';

export interface IcsEventData {
  summary: string;
  description?: string;
  location?: string;
  startTime: Date;
  endTime: Date;
  uid?: string;
}

function formatIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export function generateIcsFile(data: IcsEventData): string {
  const now = formatIcsDate(new Date());

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AgendaYa//Cita//ES',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `DTSTART:${formatIcsDate(data.startTime)}`,
    `DTEND:${formatIcsDate(data.endTime)}`,
    `DTSTAMP:${now}`,
    `SUMMARY:${data.summary}`,
    data.location ? `LOCATION:${data.location}` : '',
    data.description ? `DESCRIPTION:${data.description}` : '',
    `UID:${data.uid || `${Date.now()}@agendaya.com`}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');
}

export function downloadIcs(data: IcsEventData, filename?: string) {
  const icsContent = generateIcsFile(data);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `cita-${data.summary.replace(/\s+/g, '_')}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generateIcsFromAppointment(appointment: Appointment): string {
  return generateIcsFile({
    summary: `${appointment.services?.name || 'Cita'} - ${appointment.businesses?.name || ''}`,
    description: appointment.notes || '',
    location: appointment.businesses?.address || '',
    startTime: new Date(appointment.start_time),
    endTime: new Date(appointment.end_time),
    uid: appointment.id,
  });
}
