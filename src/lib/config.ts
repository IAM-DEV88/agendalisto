// Configuration and environment variables

// Supabase config
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// API URLs
export const BASE_URL = import.meta.env.VITE_BASE_URL || window.location.origin;

// App settings
export const APP_NAME = 'AgendaYa';
export const APP_DESCRIPTION = 'Plataforma para la gestion de reservas y citas para negocios y servicios.';
export const FALLBACK_AVATAR = 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png';
export const FALLBACK_BUSINESS_LOGO = 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png';
export const FALLBACK_BLOG_IMG = 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400&q=80';

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
  FALLBACK_AVATAR,
  FALLBACK_BUSINESS_LOGO,
  FALLBACK_BLOG_IMG,
  MIN_PASSWORD_LENGTH,
  PHONE_REGEX
}; 
