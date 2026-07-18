import type { PostgrestError } from '@supabase/supabase-js';
import { reportError } from './errors';

export type ApiResult<T = void> =
  | { success: true; data?: T; error?: null }
  | { success: false; data?: null; error: string };

export type ApiDataResult<T> =
  | { success: true; data: T; error?: null }
  | { success: false; data?: null; error: string };

export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && 'message' in err) return String((err as { message: unknown }).message);
  return 'Error desconocido';
}

export function handleApiError<T>(err: unknown, context?: string): ApiResult<T> {
  const message = context ? `${context}: ${getErrorMessage(err)}` : getErrorMessage(err);
  reportError(message, context || 'API', err);
  return { success: false, error: message };
}

export function isNotFoundError(error: PostgrestError | null): boolean {
  return error?.code === 'PGRST116';
}
