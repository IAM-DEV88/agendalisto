export type DetectedCountry = 'co' | 'us' | 'other';

export function detectCountry(): DetectedCountry {
  const lang = navigator.language?.toLowerCase() || '';
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';

  if (lang.startsWith('es-co') || timeZone === 'America/Bogota' || lang === 'es') {
    const tzMatch = timeZone.match(/^America\/(Bogota|Colombia)/i);
    if (tzMatch || lang.startsWith('es-co')) return 'co';
    return 'other';
  }

  return 'other';
}
