type ErrorLevel = 'error' | 'warn' | 'info';

type ErrorPayload = {
  message: string;
  level: ErrorLevel;
  context?: string;
  error?: unknown;
  timestamp: string;
  url: string;
};

const STORAGE_KEY = 'agendaya_error_log';
const MAX_ERRORS = 50;

function captureError(payload: Omit<ErrorPayload, 'timestamp' | 'url'>): void {
  const entry: ErrorPayload = {
    ...payload,
    timestamp: new Date().toISOString(),
    url: window.location.href,
  };

  if (import.meta.env.DEV) {
    const fn = payload.level === 'error' ? console.error : payload.level === 'warn' ? console.warn : console.info;
    fn(`[${payload.level.toUpperCase()}]${payload.context ? ' [' + payload.context + ']' : ''} ${payload.message}`, payload.error || '');
  }

  try {
    const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]');
    stored.push(entry);
    if (stored.length > MAX_ERRORS) stored.shift();
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // storage not available
  }
}

export function reportError(message: string, context?: string, error?: unknown): void {
  captureError({ message, level: 'error', context, error });
}

export function reportWarning(message: string, context?: string, error?: unknown): void {
  captureError({ message, level: 'warn', context, error });
}

export function getErrorLog(): ErrorPayload[] {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function clearErrorLog(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch { /* ignore */ }
}
