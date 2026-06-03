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
    { label: '1 negocio', included: true },
    { label: 'Hasta 5 servicios', included: true },
    { label: 'Gestión manual de citas', included: true },
    { label: 'Perfil público básico', included: true },
    { label: 'Notificaciones por email', included: true },
    { label: 'Integración WhatsApp', included: false },
    { label: 'Analytics básicos', included: false },
    { label: 'Badge "Pro"', included: false },
    { label: 'Posición prioritaria en búsquedas', included: false },
    { label: 'Múltiples negocios', included: false },
    { label: 'Branding personalizado', included: false },
    { label: 'Insights de clientes', included: false },
  ],
  pro: [
    { label: '1 negocio', included: true },
    { label: 'Servicios ilimitados', included: true },
    { label: 'Gestión manual de citas', included: true },
    { label: 'Perfil público básico', included: true },
    { label: 'Notificaciones por email', included: true },
    { label: 'Integración WhatsApp', included: true },
    { label: 'Analytics básicos (ingresos, citas, clientes)', included: true },
    { label: 'Badge "Pro"', included: true },
    { label: 'Posición prioritaria en búsquedas', included: true },
    { label: 'Múltiples negocios', included: false },
    { label: 'Branding personalizado', included: false },
    { label: 'Insights de clientes', included: false },
  ],
  premium: [
    { label: '1 negocio', included: true },
    { label: 'Hasta 3 negocios', included: true },
    { label: 'Servicios ilimitados', included: true },
    { label: 'Gestión manual de citas', included: true },
    { label: 'Perfil público básico', included: true },
    { label: 'Notificaciones por email', included: true },
    { label: 'Integración WhatsApp', included: true },
    { label: 'Analytics avanzados (servicio top, hora pico, tendencias, retención)', included: true },
    { label: 'Badge "Premium"', included: true },
    { label: 'Posición destacada en búsquedas', included: true },
    { label: 'Branding personalizado (logo/banner custom)', included: true },
    { label: 'Insights de retención de clientes', included: true },
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

// ─── Plan-based helpers ───

export function getMaxBusinesses(plan: Plan): number {
  if (plan === 'premium') return 3;
  return 1;
}

export function getMaxServices(plan: Plan): number {
  if (plan === 'starter') return 5;
  return Infinity;
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
  return (plan as Plan) === 'premium';
}
