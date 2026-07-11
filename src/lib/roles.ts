// Roles y Planes para AgendaYa

export const ROLES = ['visitor', 'client', 'business_owner', 'moderator', 'admin'] as const;
export type Role = (typeof ROLES)[number];

export const SELF_ASSIGNABLE_ROLES: Role[] = ['visitor', 'client', 'business_owner'];

export const ROLE_LABELS: Record<Role, string> = {
  visitor: 'Visitante',
  client: 'Cliente',
  business_owner: 'Dueño de negocio',
  moderator: 'Moderador',
  admin: 'Administrador',
};

export const PLANS = ['starter', 'pro', 'premium'] as const;
export type Plan = (typeof PLANS)[number];

export const PLAN_LABELS: Record<Plan, string> = {
  starter: 'Starter',
  pro: 'Pro',
  premium: 'Premium',
};

export const PLAN_DESCRIPTIONS: Record<Plan, string> = {
  starter: 'Perfecto para empezar',
  pro: 'Para hacer crecer tu negocio',
  premium: 'Máxima visibilidad y control',
};

export const PLAN_PRICES: Record<Plan, { amount: number; currency: string }> = {
  starter: { amount: 0, currency: 'COP' },
  pro: { amount: 49900, currency: 'COP' },
  premium: { amount: 99900, currency: 'COP' },
};

export const PLAN_FEATURES: Record<Plan, { label: string; included: boolean }[]> = {
  starter: [
    { label: 'Página web profesional con mapa y reseñas', included: true },
    { label: '1 negocio', included: true },
    { label: 'Hasta 5 servicios', included: true },
    { label: '1 imagen por servicio', included: true },
    { label: 'Reservas online y gestión de citas', included: true },
    { label: 'Widget embebible + Código QR', included: true },
    { label: 'Lealtad y referidos con badges', included: true },
    { label: 'Notificaciones por email y WhatsApp', included: false },
    { label: 'Analytics e insights', included: false },
    { label: 'Badge destacado en búsquedas', included: false },
    { label: 'Posición prioritaria en búsquedas', included: false },
    { label: 'Branding personalizado', included: false },
  ],
  pro: [
    { label: 'Página web profesional con mapa y reseñas', included: true },
    { label: 'Hasta 5 negocios', included: true },
    { label: 'Hasta 10 servicios por negocio', included: true },
    { label: '5 imágenes por servicio', included: true },
    { label: 'Reservas online y gestión de citas', included: true },
    { label: 'Widget embebible + Código QR', included: true },
    { label: 'Lealtad y referidos con badges', included: true },
    { label: 'Notificaciones por email y WhatsApp', included: true },
    { label: 'Analytics básicos (ingresos, clientes, citas)', included: true },
    { label: 'Badge "Pro" en tu perfil', included: true },
    { label: 'Posición prioritaria en búsquedas', included: true },
    { label: 'Branding personalizado', included: true },
  ],
  premium: [
    { label: 'Página web avanzada con asistencia IA', included: true },
    { label: 'Negocios ilimitados', included: true },
    { label: 'Servicios ilimitados', included: true },
    { label: 'Galerías ilimitadas', included: true },
    { label: 'Reservas online y gestión de citas', included: true },
    { label: 'Widget embebible + Código QR', included: true },
    { label: 'Lealtad y referidos con badges', included: true },
    { label: 'Notificaciones por email y WhatsApp', included: true },
    { label: 'Analytics avanzados (tendencias, retención, LTV)', included: true },
    { label: 'Badge "Premium" en tu perfil', included: true },
    { label: 'Posición destacada en búsquedas', included: true },
    { label: 'Branding personalizado (logo/banner)', included: true },
  ],
};

export const PLAN_BADGE = {
  starter: null,
  pro: { text: 'Pro', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  premium: { text: 'Premium', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
} as const;

export const PLAN_SCORE: Record<Plan, number> = {
  starter: 0,
  pro: 2,
  premium: 3,
};

// Helpers

export function isSelfAssignable(role: string): boolean {
  return (SELF_ASSIGNABLE_ROLES as readonly string[]).includes(role);
}

export function getPlanScore(plan: string): number {
  return PLAN_SCORE[plan as Plan] ?? 0;
}

export function canAccessDashboard(role: string): boolean {
  return role === 'business_owner' || role === 'admin' || role === 'moderator';
}

export function canManageBusiness(role: string): boolean {
  return role === 'business_owner' || role === 'admin';
}

export function canBook(role: string): boolean {
  const bookable: readonly string[] = ['client', 'business_owner', 'moderator', 'admin'];
  return (bookable as readonly string[]).includes(role);
}

export function isStaff(role: string): boolean {
  return role === 'admin' || role === 'moderator';
}

// ─── Plan-based helpers ───

export function getMaxBusinesses(plan: Plan): number {
  if (plan === 'premium') return Infinity;
  if (plan === 'pro') return 5;
  return 1;
}

export function getMaxServices(plan: Plan): number {
  if (plan === 'starter') return 5;
  if (plan === 'pro') return 10;
  return Infinity;
}

export function getMaxImages(plan: Plan): number {
  if (plan === 'starter') return 1;
  if (plan === 'pro') return 5;
  return Infinity;
}

export function canUseEmailNotifications(plan: Plan | string): boolean {
  return (plan as Plan) !== 'starter';
}

export function hasFeature(plan: Plan | string, featureLabel: string): boolean {
  const features = PLAN_FEATURES[plan as Plan];
  if (!features) return false;
  return features.some(f => f.label === featureLabel && f.included);
}

export function canAccessAnalytics(plan: Plan | string): boolean {
  const p = plan as Plan;
  return p === 'pro' || p === 'premium';
}

export function canAccessAdvancedAnalytics(plan: Plan | string): boolean {
  return (plan as Plan) === 'premium';
}

export function canUseWhatsApp(plan: Plan | string): boolean {
  return (plan as Plan) !== 'starter';
}

export function canCustomBranding(plan: Plan | string): boolean {
  return (plan as Plan) === 'pro' || (plan as Plan) === 'premium';
}
