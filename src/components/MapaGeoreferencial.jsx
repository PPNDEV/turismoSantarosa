import { useMemo } from "react";
import { Link } from "react-router-dom";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import { FaArrowRight, FaMapMarkedAlt } from "react-icons/fa";
import "leaflet/dist/leaflet.css";
import { useContent } from "../context/useContent";

const MAP_CENTER = [-3.43, -80.12];
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900";

const demoContent = {
  destinos: [
    {
      id: "destino-jambeli",
      nombre: "Isla Jambeli",
      categoria: "Playa",
      descripcion: "Balneario insular con playa, muelle turistico y mariscos.",
      imagen:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900",
    },
    {
      id: "destino-tembladera",
      nombre: "Laguna La Tembladera",
      categoria: "Ecoturismo",
      descripcion: "Humedal para kayak, fotografia y observacion de aves.",
      imagen:
        "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=900",
    },
  ],
  gastronomia: [
    {
      id: "restaurante-perla",
      nombre: "Comedor La Perla del Mar",
      ubicacion: "Malecon principal de Isla Jambeli",
      descripcion: "Ceviches, parihuela y platos tradicionales de mariscos.",
      imagen:
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=900",
    },
    {
      id: "restaurante-puerto-jeli",
      nombre: "Marisqueria Puerto Jeli",
      ubicacion: "Zona gastronomica de Puerto Jeli",
      descripcion: "Especialidad en arroz marinero y pescado fresco.",
      imagen:
        "https://images.unsplash.com/photo-1559847844-5315695dadae?w=900",
    },
  ],
  hospedajes: [
    {
      id: "hosteria-jambeli",
      nombre: "Hosteria Brisa Jambeli",
      ubicacion: "Frente al malecon de Isla Jambeli",
      servicios: "Wifi, restaurante, tours y habitaciones familiares",
      imagen:
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900",
    },
  ],
  eventos: [
    {
      id: "festival-langostino",
      nombre: "Festival del Rey Langostino",
      tipo: "Festival",
      lugar: "Malecon de Santa Rosa",
      descripcion: "Agenda cultural y gastronomica para visitantes.",
      imagen:
        "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=900",
    },
  ],
  actividades: [
    {
      id: "actividad-manglar",
      nombre: "Paseo en lancha por manglares",
      categoria: "Aventura",
      descripcion: "Ruta guiada por canales naturales del archipielago.",
      imagen:
        "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=900",
    },
    {
      id: "actividad-kayak",
      nombre: "Kayak en La Tembladera",
      categoria: "Naturaleza",
      descripcion: "Actividad recreativa en el humedal continental.",
      imagen:
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=900",
    },
  ],
  floraFauna: [
    {
      id: "fauna-piqueros",
      nombre: "Piqueros de patas azules",
      tipo: "Fauna",
      zona: "Isla Santa Clara y areas marinas cercanas",
      descripcion: "Especie representativa de los recorridos de naturaleza.",
      imagen:
        "https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=900",
    },
  ],
  cooperativas: [
    {
      id: "coop-rutas-orenses",
      nombre: "Cooperativa Rutas Orenses",
      ruta: "Machala - Santa Rosa - Puerto Hualtaco",
      frecuencia: "Cada 30 minutos",
    },
  ],
};

const moduleConfig = {
  destinos: {
    label: "Destinos",
    singular: "Destino",
    color: "#0a7ea4",
    path: "/destinos",
    demo: demoContent.destinos,
    coordinates: [
      [-3.312, -80.083],
      [-3.173, -80.435],
      [-3.468, -80.052],
      [-3.595, -79.971],
    ],
  },
  gastronomia: {
    label: "Gastronomia",
    singular: "Restaurante",
    color: "#e8a733",
    path: "/gastronomia",
    demo: demoContent.gastronomia,
    coordinates: [
      [-3.311, -80.084],
      [-3.256, -80.118],
      [-3.355, -80.109],
      [-3.456, -80.054],
    ],
  },
  hospedajes: {
    label: "Hospedaje",
    singular: "Hospedaje",
    color: "#16a34a",
    path: "/hospedaje",
    demo: demoContent.hospedajes,
    coordinates: [
      [-3.313, -80.085],
      [-3.254, -80.116],
      [-3.356, -80.108],
      [-3.447, -79.964],
    ],
  },
  eventos: {
    label: "Eventos",
    singular: "Evento",
    color: "#dc2626",
    path: "/eventos",
    demo: demoContent.eventos,
    coordinates: [
      [-3.448, -79.959],
      [-3.456, -80.054],
      [-3.258, -80.015],
      [-3.446, -79.963],
    ],
  },
  actividades: {
    label: "Actividades",
    singular: "Actividad",
    color: "#0891b2",
    path: "/actividades",
    demo: demoContent.actividades,
    coordinates: [
      [-3.314, -80.082],
      [-3.173, -80.435],
      [-3.595, -79.971],
      [-3.315, -80.08],
    ],
  },
  floraFauna: {
    label: "Naturaleza",
    singular: "Registro natural",
    color: "#65a30d",
    path: "/flora-fauna",
    demo: demoContent.floraFauna,
    coordinates: [
      [-3.174, -80.433],
      [-3.471, -80.051],
      [-3.23, -80.31],
      [-3.59, -79.974],
    ],
  },
  cooperativas: {
    label: "Transporte",
    singular: "Cooperativa",
    color: "#6d28d9",
    path: "/transporte",
    demo: demoContent.cooperativas,
    coordinates: [
      [-3.258, -79.967],
      [-3.468, -80.052],
      [-3.458, -80.048],
      [-3.449, -79.959],
    ],
  },
};

function getItems(items, fallbackItems) {
  return Array.isArray(items) && items.length > 0 ? items : fallbackItems;
}

function getCoordinate(item, config, index) {
  const lat = Number(item.lat ?? item.latitude);
  const lng = Number(item.lng ?? item.longitude);

  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return { lat, lng };
  }

  const fallback =
    config.coordinates[index % config.coordinates.length] ||
    config.coordinates[0];

  return { lat: fallback[0], lng: fallback[1] };
}

function getImage(item) {
  return (
    item.imagen ||
    item.heroImage ||
    item.url_archivo ||
    item.url ||
    FALLBACK_IMAGE
  );
}

function getTitle(item) {
  return (
    item.nombre ||
    item.nombre_local ||
    item.nombre_especie ||
    item.cooperativa ||
    item.titulo ||
    "Registro turistico"
  );
}

function getCategory(item, config) {
  return item.categoria || item.tipo || config.singular;
}

function getDetail(item, config) {
  return (
    item.ubicacion ||
    item.lugar ||
    item.zona ||
    item.ruta ||
    item.ruta_hacia_muelle ||
    item.descripcion ||
    item.servicios ||
    config.label
  );
}

function buildPoints(sourceItems, configKey) {
  const config = moduleConfig[configKey];
  return getItems(sourceItems, config.demo)
    .filter((item) => item && item.activo !== false)
    .map((item, index) => {
      const coordinates = getCoordinate(item, config, index);

      return {
        id: `${configKey}-${item.id || index}`,
        title: getTitle(item),
        category: getCategory(item, config),
        detail: getDetail(item, config),
        image: getImage(item),
        label: config.label,
        path: config.path,
        color: config.color,
        lat: coordinates.lat,
        lng: coordinates.lng,
      };
    });
}

export default function MapaGeoreferencial() {
  const {
    actividades,
    cooperativas,
    destinos,
    eventos,
    floraFauna,
    gastronomia,
    hospedajes,
  } = useContent();

  const mapPoints = useMemo(
    () => [
      ...buildPoints(destinos, "destinos"),
      ...buildPoints(gastronomia, "gastronomia"),
      ...buildPoints(hospedajes, "hospedajes"),
      ...buildPoints(eventos, "eventos"),
      ...buildPoints(actividades, "actividades"),
      ...buildPoints(floraFauna, "floraFauna"),
      ...buildPoints(cooperativas, "cooperativas"),
    ],
    [
      actividades,
      cooperativas,
      destinos,
      eventos,
      floraFauna,
      gastronomia,
      hospedajes,
    ],
  );

  return (
    <section className="geo-map-section" id="mapa-georeferencial">
      <div className="container">
        <div className="section-header reveal">
          <h2 className="section-title">
            Mapa <span className="accent">Georeferenciado</span>
          </h2>
          <p className="section-subtitle">
            Atractivos, establecimientos, eventos y actividades del canton
            Santa Rosa.
          </p>
        </div>
      </div>

      <div className="geo-map-fullbleed reveal">
        <MapContainer
          center={MAP_CENTER}
          zoom={10}
          scrollWheelZoom
          className="home-tourism-map"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {mapPoints.map((point) => (
            <CircleMarker
              key={point.id}
              center={[point.lat, point.lng]}
              radius={9}
              pathOptions={{
                color: "#ffffff",
                fillColor: point.color,
                fillOpacity: 0.9,
                opacity: 1,
                weight: 2,
              }}
            >
              <Popup minWidth={240} maxWidth={270}>
                <article className="geo-popup">
                  <img
                    src={point.image}
                    alt={point.title}
                    onError={(event) => {
                      if (event.currentTarget.src !== FALLBACK_IMAGE) {
                        event.currentTarget.src = FALLBACK_IMAGE;
                      }
                    }}
                  />
                  <div className="geo-popup-body">
                    <span className="geo-popup-chip">{point.label}</span>
                    <h3>{point.title}</h3>
                    <p className="geo-popup-category">{point.category}</p>
                    <p>{point.detail}</p>
                    <Link className="geo-popup-link" to={point.path}>
                      Ver modulo
                      <FaArrowRight
                        className="inline-icon"
                        aria-hidden="true"
                      />
                    </Link>
                  </div>
                </article>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        <div className="geo-map-legend" aria-label="Categorias del mapa">
          <div className="geo-map-legend-title">
            <FaMapMarkedAlt className="inline-icon" aria-hidden="true" />
            Capas
          </div>
          <div className="geo-map-legend-grid">
            {Object.entries(moduleConfig).map(([key, config]) => (
              <div className="geo-map-legend-item" key={key}>
                <span style={{ background: config.color }} />
                <p>{config.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
