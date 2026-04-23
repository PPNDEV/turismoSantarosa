import {
  FaBinoculars,
  FaLeaf,
  FaMapMarkerAlt,
  FaUmbrellaBeach,
  FaUtensils,
} from "react-icons/fa";

const DESTINO_ICON_COMPONENTS = {
  playa: FaUmbrellaBeach,
  naturaleza: FaBinoculars,
  gastronomia: FaUtensils,
  ecoturismo: FaLeaf,
  ubicacion: FaMapMarkerAlt,
};

const LEGACY_DESTINO_ICON_MAP = {
  "\u{1F3D6}\uFE0F": "playa",
  "\u{1F3DD}\uFE0F": "playa",
  "\u{1F40B}": "naturaleza",
  "\u{1F99E}": "gastronomia",
  "\u{1F985}": "ecoturismo",
};

export const destinoIconOptions = [
  { value: "playa", label: "Playa" },
  { value: "naturaleza", label: "Naturaleza" },
  { value: "gastronomia", label: "Gastronomía" },
  { value: "ecoturismo", label: "Ecoturismo" },
  { value: "ubicacion", label: "Ubicación" },
];

export function normalizeDestinoIcon(value) {
  const rawValue = String(value || "").trim();
  const normalizedValue = rawValue.toLowerCase();

  if (DESTINO_ICON_COMPONENTS[normalizedValue]) {
    return normalizedValue;
  }

  if (LEGACY_DESTINO_ICON_MAP[rawValue]) {
    return LEGACY_DESTINO_ICON_MAP[rawValue];
  }

  return "ubicacion";
}

export function getDestinoIconComponent(value) {
  return DESTINO_ICON_COMPONENTS[normalizeDestinoIcon(value)] || FaMapMarkerAlt;
}
