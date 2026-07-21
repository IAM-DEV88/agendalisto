/**
 * API module — punto de entrada unificado.
 * Re-exporta todos los módulos de dominio. A medida que se extraen
 * más dominios de api.ts, se agregan aquí.
 *
 * Para imports existentes, seguir usando `from '../lib/api'` (que resuelve
 * a api.ts, el cual re-exporta desde aquí).
 */

export * from './auth';
export * from './businesses';
export * from './appointments';
export * from './services';
export * from './reviews';
export * from './blog';
export * from './admin';
