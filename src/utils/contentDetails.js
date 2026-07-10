const DETAIL_BASE_PATHS = {
  actividades: "/actividades",
  eventos: "/eventos",
  gastronomia: "/gastronomia",
  hospedaje: "/hospedaje",
  transporte: "/transporte",
  "flora-fauna": "/flora-fauna",
};

const FALLBACK_IMAGES = {
  actividades:
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400",
  eventos:
    "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1400",
  gastronomia:
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1400",
  hospedaje:
    "https://images.unsplash.com/photo-1455587734955-081b22074882?w=1400",
  "flora-fauna":
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1400",
};

function slugify(value) {
  return String(value || "contenido")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 56);
}

function shortHash(value) {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index);
  }
  return (hash >>> 0).toString(36).slice(0, 6);
}

export function createContentSlug(item, title, scope = "") {
  const fingerprint = `${scope}|${JSON.stringify(item || {})}`;
  return `${slugify(title)}-${shortHash(fingerprint)}`;
}

export function buildDetailHref(type, item, title, scope = "") {
  return `${DETAIL_BASE_PATHS[type]}/${createContentSlug(item, title, scope)}`;
}

function compactFacts(facts) {
  return facts.filter((fact) => fact.value);
}

function getActividades(sections) {
  const section = sections?.actividades || {};
  const items = Array.isArray(section.listado) ? section.listado : [];

  return items.map((item) => ({
    type: "actividades",
    sectionLabel: "Actividades turísticas",
    backLabel: "Volver a Actividades",
    title: item.nombre || "Actividad turística",
    badge: "Experiencia",
    description: item.descripcion || section.descripcion || "",
    image: item.imagen || FALLBACK_IMAGES.actividades,
    facts: compactFacts([
      { label: "Categoría", value: item.icono },
      { label: "Ubicación", value: item.isla || "Archipiélago de Jambelí" },
    ]),
    item,
    scope: "actividades",
  }));
}

function getEventos(sections) {
  const section = sections?.eventos || {};
  const items = Array.isArray(section.manifestaciones)
    ? section.manifestaciones
    : [];

  return items.map((item) => ({
    type: "eventos",
    sectionLabel: "Cultura y Patrimonio",
    backLabel: "Volver a Eventos",
    title: item.subtipo || item.tipo || "Manifestación cultural",
    badge: item.tipo || "Cultura",
    description: item.descripcion || section.descripcionGeneral || "",
    image: item.imagen || FALLBACK_IMAGES.eventos,
    facts: compactFacts([
      { label: "Tipo de manifestación", value: item.tipo },
      { label: "Territorio", value: "Archipiélago de Jambelí" },
    ]),
    item,
    scope: "eventos",
  }));
}

function getGastronomia(sections) {
  const section = sections?.gastronomia || {};
  const islands = [
    ["jambeli", "Jambelí"],
    ["sanGregorio", "San Gregorio"],
  ];

  return islands.flatMap(([key, label]) => {
    const items = Array.isArray(section[key]) ? section[key] : [];
    return items.map((item) => ({
      type: "gastronomia",
      sectionLabel: "Gastronomía",
      backLabel: "Volver a Gastronomía",
      title: item.nombre || "Establecimiento gastronómico",
      badge: label,
      description: item.descripcion || "",
      image: item.imagen || FALLBACK_IMAGES.gastronomia,
      facts: compactFacts([
        { label: "Servicio", value: item.actividad },
        { label: "Contacto", value: item.contacto },
        { label: "Isla", value: label },
      ]),
      item,
      scope: `gastronomia-${key}`,
    }));
  });
}

function getHospedajes(sections) {
  const section = sections?.hospedajes || {};
  const items = Array.isArray(section.jambeli) ? section.jambeli : [];

  return items.map((item) => ({
    type: "hospedaje",
    sectionLabel: "Hospedaje",
    backLabel: "Volver a Hospedaje",
    title: item.nombre || "Hospedaje",
    badge: "Jambelí",
    description: item.descripcion || section.descripcion || "",
    image: item.imagen || FALLBACK_IMAGES.hospedaje,
    facts: compactFacts([
      { label: "Servicio", value: item.actividad },
      { label: "Contacto", value: item.contacto },
      { label: "Ubicación", value: "Jambelí" },
    ]),
    item,
    scope: "hospedaje-jambeli",
  }));
}

function getTransporte(sections) {
  const section = sections?.cooperativas || {};
  const routes = [
    ["jambeli", "Ruta a Jambelí"],
    ["sanGregorio", "Ruta a San Gregorio / Costa Rica"],
  ];

  return routes.flatMap(([key, label]) => {
    const items = Array.isArray(section[key]) ? section[key] : [];
    return items.map((item) => ({
      type: "transporte",
      sectionLabel: "Transporte fluvial",
      backLabel: "Volver a Transporte",
      title: item.nombre || "Cooperativa de transporte",
      badge: label,
      description:
        item.descripcion ||
        "Información de la operadora y su ruta de transporte fluvial.",
      image: "",
      facts: compactFacts([
        { label: "Ruta", value: item.ruta },
        { label: "Procedencia", value: item.procedencia },
        { label: "Destino", value: label },
      ]),
      item,
      scope: `transporte-${key}`,
    }));
  });
}

function getFloraFauna(sections) {
  const section = sections?.floraFauna || {};
  const fauna = section.fauna || {};
  const flora = section.flora || {};
  const faunaItems = Array.isArray(fauna.especies) ? fauna.especies : [];
  const floraItems = Array.isArray(flora.especies) ? flora.especies : [];

  const faunaDetails = faunaItems.map((item) => ({
    type: "flora-fauna",
    sectionLabel: "Flora y Fauna",
    backLabel: "Volver a Flora y Fauna",
    title: item.nombre || "Especie de fauna",
    badge: item.grupo || "Fauna",
    description: fauna.descripcion || section.descripcionGeneral || "",
    image: item.imagen || FALLBACK_IMAGES["flora-fauna"],
    facts: compactFacts([
      { label: "Nombre científico", value: item.nombreCientifico },
      { label: "Grupo", value: item.grupo },
      { label: "Clasificación", value: "Fauna" },
    ]),
    item,
    scope: "flora-fauna-fauna",
  }));

  const floraDetails = floraItems.map((item) => ({
    type: "flora-fauna",
    sectionLabel: "Flora y Fauna",
    backLabel: "Volver a Flora y Fauna",
    title: item.nombreComun || "Especie de flora",
    badge: "Flora",
    description: flora.descripcion || section.descripcionGeneral || "",
    image: item.imagen || FALLBACK_IMAGES["flora-fauna"],
    facts: compactFacts([
      { label: "Nombre científico", value: item.nombreCientifico },
      { label: "Clasificación", value: "Flora" },
    ]),
    item,
    scope: "flora-fauna-flora",
  }));

  return [...faunaDetails, ...floraDetails];
}

const DETAIL_BUILDERS = {
  actividades: getActividades,
  eventos: getEventos,
  gastronomia: getGastronomia,
  hospedaje: getHospedajes,
  transporte: getTransporte,
  "flora-fauna": getFloraFauna,
};

export function getContentDetails(type, sections) {
  const details = DETAIL_BUILDERS[type]?.(sections) || [];
  return details.map((detail) => ({
    ...detail,
    slug: createContentSlug(detail.item, detail.title, detail.scope),
    href: buildDetailHref(type, detail.item, detail.title, detail.scope),
  }));
}

export function getContentDetail(type, slug, sections) {
  return getContentDetails(type, sections).find((detail) => detail.slug === slug);
}

export function getSectionBasePath(type) {
  return DETAIL_BASE_PATHS[type] || "/";
}
