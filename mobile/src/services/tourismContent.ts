export type TourismModuleKey =
  | 'actividades'
  | 'gastronomia'
  | 'hospedajes'
  | 'eventos'
  | 'floraFauna'
  | 'cooperativas';

export type TourismItem = {
  id: string;
  type: TourismModuleKey;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  location: string;
  contact: string;
  schedule: string;
  price: string;
  category: string;
  island: string;
  latitude: number;
  longitude: number;
  details: Array<{ label: string; value: string }>;
  raw: Record<string, unknown>;
};

export type HeroSlide = {
  id: string;
  bg: string;
  tag: string;
  title: string;
  sub: string;
  cta: string;
  ctaTo: string;
  order: number;
};

export type TourismModuleConfig = {
  key: TourismModuleKey;
  label: string;
  pluralLabel: string;
  icon: string;
  color: string;
  description: string;
  coordinates: Array<[number, number]>;
};

export const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900';

export const scenicHeroSlides: HeroSlide[] = [
  {
    id: 'mobile-jambeli-playa',
    bg: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600',
    tag: 'Archipielago de Jambeli',
    title: 'Explora el Archipielago de Jambeli',
    sub: 'Playas, manglares, gastronomia y rutas fluviales para planificar tu visita.',
    cta: 'Buscar lugares',
    ctaTo: 'catalog',
    order: 0,
  },
  {
    id: 'mobile-manglares',
    bg: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1600',
    tag: 'Naturaleza costera',
    title: 'Recorre manglares y paisajes insulares',
    sub: 'Encuentra actividades, biodiversidad y puntos cercanos desde el mapa.',
    cta: 'Ver mapa',
    ctaTo: 'map',
    order: 1,
  },
  {
    id: 'mobile-gastronomia',
    bg: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1600',
    tag: 'Sabores locales',
    title: 'Gastronomia y servicios para tu estadia',
    sub: 'Consulta restaurantes, hospedajes, transporte y contactos utiles.',
    cta: 'Planificar visita',
    ctaTo: 'catalog',
    order: 2,
  },
];

export const MAP_CENTER = {
  latitude: -3.255,
  longitude: -80.118,
  latitudeDelta: 0.26,
  longitudeDelta: 0.34,
};

export const moduleConfigs: Record<TourismModuleKey, TourismModuleConfig> = {
  actividades: {
    key: 'actividades',
    label: 'Actividad',
    pluralLabel: 'Actividades',
    icon: 'compass-outline',
    color: '#0891b2',
    description: 'Experiencias, playas, manglares y recorridos del archipielago.',
    coordinates: [
      [-3.314, -80.082],
      [-3.173, -80.435],
      [-3.255, -80.119],
      [-3.315, -80.08],
    ],
  },
  gastronomia: {
    key: 'gastronomia',
    label: 'Gastronomia',
    pluralLabel: 'Gastronomia',
    icon: 'restaurant-outline',
    color: '#d97706',
    description: 'Platos tipicos y establecimientos recomendados.',
    coordinates: [
      [-3.311, -80.084],
      [-3.256, -80.118],
      [-3.354, -80.108],
      [-3.314, -80.079],
    ],
  },
  hospedajes: {
    key: 'hospedajes',
    label: 'Hospedaje',
    pluralLabel: 'Hospedajes',
    icon: 'bed-outline',
    color: '#16a34a',
    description: 'Alojamiento, servicios, contacto y ubicacion por isla.',
    coordinates: [
      [-3.313, -80.085],
      [-3.254, -80.116],
      [-3.356, -80.108],
      [-3.318, -80.08],
    ],
  },
  eventos: {
    key: 'eventos',
    label: 'Evento',
    pluralLabel: 'Eventos',
    icon: 'calendar-outline',
    color: '#dc2626',
    description: 'Agenda cultural, comunitaria y turistica.',
    coordinates: [
      [-3.31, -80.086],
      [-3.257, -80.119],
      [-3.354, -80.107],
      [-3.174, -80.435],
    ],
  },
  floraFauna: {
    key: 'floraFauna',
    label: 'Naturaleza',
    pluralLabel: 'Flora y fauna',
    icon: 'leaf-outline',
    color: '#65a30d',
    description: 'Biodiversidad y zonas de observacion ecologica.',
    coordinates: [
      [-3.174, -80.433],
      [-3.315, -80.097],
      [-3.23, -80.31],
      [-3.356, -80.109],
    ],
  },
  cooperativas: {
    key: 'cooperativas',
    label: 'Transporte',
    pluralLabel: 'Transporte',
    icon: 'boat-outline',
    color: '#6d28d9',
    description: 'Rutas fluviales, frecuencias, muelles y contactos.',
    coordinates: [
      [-3.309, -80.087],
      [-3.254, -80.115],
      [-3.354, -80.109],
      [-3.318, -80.082],
    ],
  },
};

export const moduleOrder: TourismModuleKey[] = [
  'actividades',
  'gastronomia',
  'hospedajes',
  'eventos',
  'floraFauna',
  'cooperativas',
];

const demoContent: Record<TourismModuleKey, Array<Record<string, unknown>>> = {
  actividades: [
    {
      id: 'actividad-manglar',
      nombre: 'Paseo en lancha por manglares',
      descripcion: 'Ruta guiada por canales naturales del archipielago.',
      isla: 'Jambeli',
      categoria: 'Naturaleza',
      imagen: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=900',
    },
    {
      id: 'actividad-playa',
      nombre: 'Dia de playa en Jambeli',
      descripcion: 'Balneario, gastronomia local y caminatas junto al malecon.',
      isla: 'Jambeli',
      categoria: 'Playa',
      imagen: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900',
    },
  ],
  gastronomia: [
    {
      id: 'restaurante-perla',
      nombre: 'Comedor La Perla del Mar',
      ubicacion: 'Malecon principal de Isla Jambeli',
      descripcion: 'Ceviches, parihuela y platos tradicionales de mariscos.',
      platoTipico: 'Ceviche mixto',
      contacto: 'Por confirmar',
      isla: 'Jambeli',
      imagen: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=900',
    },
  ],
  hospedajes: [
    {
      id: 'hosteria-jambeli',
      nombre: 'Hosteria Brisa Jambeli',
      ubicacion: 'Frente al malecon de Isla Jambeli',
      servicios: 'Wifi, restaurante, tours y habitaciones familiares',
      contacto: 'Por confirmar',
      isla: 'Jambeli',
      imagen: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900',
    },
  ],
  eventos: [
    {
      id: 'festival-jambeli',
      nombre: 'Festival playero de Jambeli',
      tipo: 'Festival',
      lugar: 'Malecon de Isla Jambeli',
      descripcion: 'Agenda cultural y gastronomica en zona insular.',
      fecha: '2026-07-20',
      hora: '10:00',
      imagen: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=900',
    },
  ],
  floraFauna: [
    {
      id: 'fauna-piqueros',
      nombre: 'Piqueros de patas azules',
      tipo: 'Fauna',
      zona: 'Isla Santa Clara y areas marinas cercanas',
      estado: 'Protegido',
      descripcion: 'Especie representativa de los recorridos de naturaleza.',
      imagen: 'https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=900',
    },
  ],
  cooperativas: [
    {
      id: 'ruta-fluvial-jambeli',
      nombre: 'Ruta fluvial Jambeli',
      ruta: 'Muelle insular - recorridos internos del archipielago',
      frecuencia: 'Salidas segun disponibilidad turistica',
      puntoSalida: 'Muelle Puerto Jeli',
      puntoLlegada: 'Isla Jambeli',
      contacto: 'Por confirmar',
    },
  ],
};

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function firstText(item: Record<string, unknown>, keys: string[], fallback = '') {
  for (const key of keys) {
    const value = text(item[key]);
    if (value) return value;
  }
  return fallback;
}

function isArchipelagoCoordinate(latitude: number, longitude: number) {
  return latitude >= -3.46 && latitude <= -3.08 && longitude >= -80.56 && longitude <= -79.98;
}

function getCoordinate(item: Record<string, unknown>, config: TourismModuleConfig, index: number) {
  const latitude = Number(item.lat ?? item.latitude ?? item.latitud);
  const longitude = Number(item.lng ?? item.longitude ?? item.longitud);

  if (Number.isFinite(latitude) && Number.isFinite(longitude) && isArchipelagoCoordinate(latitude, longitude)) {
    return { latitude, longitude };
  }

  const fallback = config.coordinates[index % config.coordinates.length] ?? config.coordinates[0];
  return { latitude: fallback[0], longitude: fallback[1] };
}

function detail(label: string, value: string) {
  return value ? { label, value } : null;
}

export function normalizeTourismItem(
  type: TourismModuleKey,
  rawItem: Record<string, unknown>,
  index: number,
): TourismItem {
  const config = moduleConfigs[type];
  const id = firstText(rawItem, ['id', 'uid', 'slug'], `${type}-${index}`);
  const title = firstText(
    rawItem,
    ['nombre', 'titulo', 'nombre_local', 'nombre_especie', 'cooperativa'],
    config.label,
  );
  const description = firstText(rawItem, ['descripcion', 'resumen', 'detalle', 'ruta'], config.description);
  const location = firstText(rawItem, ['ubicacion', 'lugar', 'zona', 'puntoSalida', 'ruta']);
  const contact = firstText(rawItem, ['contacto', 'telefono', 'celular', 'email']);
  const schedule = firstText(rawItem, ['horario', 'hora', 'frecuencia', 'fecha']);
  const price = firstText(rawItem, ['tarifa', 'precio', 'costo', 'tarifas']);
  const category = firstText(rawItem, ['categoria', 'tipo', 'platoTipico'], config.label);
  const island = firstText(rawItem, ['isla', 'sector', 'comunidad'], 'Santa Rosa');
  const image = firstText(rawItem, ['imagen', 'heroImage', 'url_archivo', 'url'], FALLBACK_IMAGE);
  const coordinates = getCoordinate(rawItem, config, index);

  const details = [
    detail('Categoria', category),
    detail('Isla/Zona', island),
    detail('Ubicacion', location),
    detail('Contacto', contact),
    detail('Horario/Frecuencia', schedule),
    detail('Tarifa referencial', price),
    detail('Plato tipico', firstText(rawItem, ['platoTipico'])),
    detail('Servicios', firstText(rawItem, ['servicios'])),
    detail('Ruta', firstText(rawItem, ['ruta'])),
    detail('Salida', firstText(rawItem, ['puntoSalida'])),
    detail('Llegada', firstText(rawItem, ['puntoLlegada'])),
    detail('Estado', firstText(rawItem, ['estado'])),
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  return {
    id,
    type,
    title,
    subtitle: location || category || island,
    description,
    image,
    location,
    contact,
    schedule,
    price,
    category,
    island,
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    details,
    raw: rawItem,
  };
}

export function snapshotObjectToArray(value: unknown): Array<Record<string, unknown>> {
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value as Record<string, unknown>).map(([id, data]) => ({
    ...(typeof data === 'object' && data ? (data as Record<string, unknown>) : {}),
    id,
  }));
}

export function normalizeHeroSlide(rawSlide: Record<string, unknown>, index: number): HeroSlide {
  return {
    id: firstText(rawSlide, ['id', 'uid', 'slug'], `hero-${index}`),
    bg: firstText(rawSlide, ['bg', 'imagen', 'image', 'url'], scenicHeroSlides[index % scenicHeroSlides.length].bg),
    tag: firstText(rawSlide, ['tag', 'eyebrow'], 'Visit Santa Rosa'),
    title: firstText(rawSlide, ['title', 'titulo'], 'Explora el Archipielago de Jambeli'),
    sub: firstText(rawSlide, ['sub', 'subtitle', 'descripcion'], 'Informacion turistica para recorrer Santa Rosa.'),
    cta: firstText(rawSlide, ['cta'], 'Buscar lugares'),
    ctaTo: firstText(rawSlide, ['ctaTo'], 'catalog'),
    order: Number(rawSlide.order ?? index),
  };
}

export function getFallbackItems(type: TourismModuleKey) {
  return demoContent[type].map((item, index) => normalizeTourismItem(type, item, index));
}

export function buildAllFallbackItems() {
  return moduleOrder.flatMap((type) => getFallbackItems(type));
}
