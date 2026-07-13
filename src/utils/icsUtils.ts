import type { Appointment } from '../types/appointment';

function formatIcsDate(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export function generateIcsFile(appointment: Appointment): string {
  const summary = `${appointment.services?.name || 'Cita'} - ${appointment.businesses?.name || ''}`;
  const location = appointment.businesses?.address || '';
  const description = appointment.notes || '';
  const now = formatIcsDate(new Date().toISOString());

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AgendaYa//Cita//ES',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `DTSTART:${formatIcsDate(appointment.start_time)}`,
    `DTEND:${formatIcsDate(appointment.end_time)}`,
    `DTSTAMP:${now}`,
    `SUMMARY:${summary}`,
    location ? `LOCATION:${location}` : '',
    description ? `DESCRIPTION:${description}` : '',
    `UID:${appointment.id}@agendaya.com`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');
}

export function downloadIcs(appointment: Appointment) {
  const icsContent = generateIcsFile(appointment);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `cita-${appointment.services?.name || 'agendaya'}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
