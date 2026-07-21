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

/**
 * Valida en runtime que un objeto tenga la estructura esperada de un perfil de usuario.
 * Previene crashes cuando Supabase devuelve datos incompletos o con formato inesperado.
 */
export function validateUserProfileShape(data: Record<string, unknown>): boolean {
  if (!data || typeof data !== 'object') return false;
  const requiredFields = ['id', 'full_name', 'email', 'role'];
  return requiredFields.every(field => {
    const val = data[field];
    return val !== null && val !== undefined && typeof val === 'string' && String(val).trim().length > 0;
  });
}

/**
 * Valida en runtime que un objeto tenga la estructura esperada de un negocio.
 */
export function validateBusinessShape(data: Record<string, unknown>): boolean {
  if (!data || typeof data !== 'object') return false;
  const requiredFields = ['id', 'slug', 'name', 'owner_id'];
  const optionalStringFields = ['description', 'address', 'phone', 'email'];
  // Verificar campos requeridos
  const hasRequired = requiredFields.every(field => {
    const val = data[field];
    return val !== null && val !== undefined && typeof val === 'string' && String(val).trim().length > 0;
  });
  if (!hasRequired) return false;
  // Verificar que optionalStringFields sean strings o null/undefined
  const hasValidOptionals = optionalStringFields.every(field => {
    const val = data[field];
    return val === null || val === undefined || typeof val === 'string';
  });
  return hasValidOptionals;
}
