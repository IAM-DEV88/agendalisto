// Configuration and environment variables

// Supabase config
export const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL as string;
export const SUPABASE_ANON_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string;

// API URLs
export const BASE_URL = import.meta.env.VITE_BASE_URL || window.location.origin;

// Feature flags
export const ENABLE_NOTIFICATIONS = import.meta.env.VITE_ENABLE_NOTIFICATIONS === 'true';

// App settings
export const APP_NAME = 'AppAgenda';
export const APP_DESCRIPTION = 'Plataforma para la gestión de reservas y citas para negocios y servicios.';
export const DEFAULT_AVATAR = 'https://via.placeholder.com/150?text=Usuario';
export const DEFAULT_BUSINESS_LOGO = 'https://via.placeholder.com/300?text=Negocio';

// Validation settings
export const MIN_PASSWORD_LENGTH = 8;
export const PHONE_REGEX = /^\+?[0-9]{8,15}$/; // Simple phone validation regex

export default {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  BASE_URL,
  ENABLE_NOTIFICATIONS,
  APP_NAME,
  APP_DESCRIPTION,
  DEFAULT_AVATAR,
  DEFAULT_BUSINESS_LOGO,
  MIN_PASSWORD_LENGTH,
  PHONE_REGEX
}; 