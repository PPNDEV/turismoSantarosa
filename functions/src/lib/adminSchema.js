const { HttpsError } = require("firebase-functions/v2/https");

const NODE_FIELDS = {
  actividades: ["nombre", "isla", "descripcion", "imagen", "lat", "lng"],
  actividadesEditorial: ["titulo", "descripcion", "imagen", "icono", "orden"],
  gastronomia: [
    "nombre",
    "isla",
    "descripcion",
    "platoTipico",
    "ubicacion",
    "contacto",
    "imagen",
    "lat",
    "lng",
  ],
  hospedajes: [
    "nombre",
    "isla",
    "ubicacion",
    "servicios",
    "contacto",
    "imagen",
    "lat",
    "lng",
  ],
  eventos: [
    "nombre",
    "tipo",
    "descripcion",
    "lugar",
    "fecha",
    "hora",
    "organizador",
    "contacto",
    "imagen",
    "activo",
    "lat",
    "lng",
  ],
  floraFauna: ["nombre", "tipo", "descripcion", "zona", "estado", "imagen"],
  galeria: ["titulo", "tipo", "url"],
  destinos: [
    "nombre",
    "categoria",
    "descripcion",
    "isla",
    "imagen",
    "icono",
    "lat",
    "lng",
  ],
  blog: [
    "titulo",
    "resumen",
    "contenido",
    "categoria",
    "autor",
    "fecha",
    "imagen",
    "publicado",
  ],
  heroSlides: ["tag", "title", "sub", "cta", "ctaTo", "bg", "order"],
  cooperativas: [
    "nombre",
    "cooperativa",
    "ruta",
    "frecuencia",
    "puntoSalida",
    "puntoLlegada",
    "contacto",
    "lat",
    "lng",
  ],
};

const REQUIRED_FIELDS = {
  actividades: ["nombre"],
  gastronomia: ["nombre"],
  hospedajes: ["nombre"],
  eventos: ["nombre"],
  floraFauna: ["nombre"],
  galeria: ["url"],
  destinos: ["nombre"],
  blog: ["titulo"],
  heroSlides: ["title"],
  cooperativas: ["nombre"],
};

function sanitizeString(value, maxLength) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function sanitizeNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function sanitizeBoolean(value) {
  return value === true || value === false ? value : null;
}

function sanitizeItemData(nodeKey, itemData) {
  const allowedFields = NODE_FIELDS[nodeKey] || [];
  const sanitized = {};

  for (const field of allowedFields) {
    if (!(field in itemData)) {
      continue;
    }

    const value = itemData[field];
    if (typeof value === "string") {
      sanitized[field] = sanitizeString(value, 1000);
    } else if (typeof value === "number") {
      const numeric = sanitizeNumber(value);
      if (numeric !== null) {
        sanitized[field] = numeric;
      }
    } else if (typeof value === "boolean") {
      const boolValue = sanitizeBoolean(value);
      if (boolValue !== null) {
        sanitized[field] = boolValue;
      }
    }
  }

  const required = REQUIRED_FIELDS[nodeKey] || [];
  for (const field of required) {
    const current = sanitized[field];
    if (typeof current !== "string" || !current.trim()) {
      throw new HttpsError(
        "invalid-argument",
        `Campo requerido faltante: ${field}.`,
      );
    }
  }

  if (Object.keys(sanitized).length === 0) {
    throw new HttpsError("invalid-argument", "Payload vacio.");
  }

  return sanitized;
}

module.exports = {
  NODE_FIELDS,
  REQUIRED_FIELDS,
  sanitizeItemData,
};
