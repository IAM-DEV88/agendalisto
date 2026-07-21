// Configuration and environment variables

// Supabase config
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// API URLs
export const BASE_URL = import.meta.env.VITE_BASE_URL || window.location.origin;

// App settings
export const APP_NAME = 'AgendaYa';
export const APP_DESCRIPTION = 'Plataforma para la gestion de reservas y citas para negocios y servicios.';

// Placeholder SVG local (data URI) — evita dependencia de URLs externas para fallback de imágenes
const PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect fill="#e2e8f0" width="400" height="400"/>
  <circle fill="#cbd5e1" cx="200" cy="150" r="60"/>
  <rect fill="#cbd5e1" x="100" y="260" width="200" height="80" rx="10"/>
  <text x="200" y="370" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="16">Sin imagen</text>
</svg>`;
export const FALLBACK_PLACEHOLDER = `data:image/svg+xml,${encodeURIComponent(PLACEHOLDER_SVG)}`;
export const FALLBACK_AVATAR = FALLBACK_PLACEHOLDER;
export const FALLBACK_BUSINESS_LOGO = FALLBACK_PLACEHOLDER;
export const FALLBACK_BLOG_IMG = FALLBACK_PLACEHOLDER;

// Validation settings
export const MIN_PASSWORD_LENGTH = 8;
export const PHONE_REGEX = /^\+?[0-9]{8,15}$/; // Simple phone validation regex

// WhatsApp
export const AGENDAYA_WHATSAPP = import.meta.env.VITE_AGENDAYA_WHATSAPP || '573178684451';
export const WHATSAPP_API_URL = import.meta.env.VITE_WHATSAPP_API_URL || '/.netlify/functions/whatsapp-leads';

export default {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  BASE_URL,
  APP_NAME,
  APP_DESCRIPTION,
  FALLBACK_PLACEHOLDER,
  FALLBACK_AVATAR,
  FALLBACK_BUSINESS_LOGO,
  FALLBACK_BLOG_IMG,
  MIN_PASSWORD_LENGTH,
  PHONE_REGEX
}; 
