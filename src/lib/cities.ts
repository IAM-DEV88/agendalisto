export interface CityConfig {
  slug: string;
  name: string;
  department: string;
  country: string;
  description: string;
  keywords: string[];
  heroTagline: string;
  heroSubtitle: string;
  priorityCategories: string[];
  hasAgriculture: boolean;
  agricultureTitle?: string;
  agricultureDescription?: string;
  agricultureValueProps?: string[];
  isActive: boolean;
}

export const CITIES: Record<string, CityConfig> = {
  pitalito: {
    slug: 'pitalito',
    name: 'Pitalito',
    department: 'Huila',
    country: 'Colombia',
    description:
      'Encuentra y agenda servicios profesionales, bodegas y productores de café, aguacate y pitaya en Pitalito, Huila. Conectamos compradores con el Valle de Laboyos.',
    keywords: [
      'Pitalito',
      'café Huila',
      'aguacate Hass',
      'pitaya',
      'bodegas Pitalito',
      'exportadores Huila',
      'servicios Pitalito',
      'Valle de Laboyos',
    ],
    heroTagline: 'El directorio comercial del Valle de Laboyos',
    heroSubtitle:
      'Encuentra servicios, productores y bodegas en Pitalito. Conectamos tu negocio con compradores de toda Colombia.',
    priorityCategories: [
      'Agroindustria',
      'Comercio Exterior',
      'Logística',
      'Grandes Superficies',
      'Belleza',
      'Restaurantes',
      'Cafetería',
    ],
    hasAgriculture: true,
    agricultureTitle: '¿Eres productor o exportador de café, aguacate o pitaya?',
    agricultureDescription:
      'Publica tu bodega o finca gratis en AgendaYa y recibe solicitudes de cotización directo a tu WhatsApp. Conectamos compradores de toda Colombia con el campo del Huila.',
    agricultureValueProps: [
      'Aparece en Google cuando buscan tus productos',
      'Recibe solicitudes de cotización por WhatsApp',
      'Muestra tus certificaciones y volúmenes disponibles',
      'Sin instalaciones complicadas — gratis por tiempo limitado',
    ],
    isActive: true,
  },
};

export function getCityConfig(slug: string): CityConfig | null {
  return CITIES[slug.toLowerCase()] ?? null;
}

export function getActiveCities(): CityConfig[] {
  return Object.values(CITIES).filter((c) => c.isActive);
}
