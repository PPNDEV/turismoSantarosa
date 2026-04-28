import { useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import {
  FaBed,
  FaBus,
  FaLeaf,
  FaMapMarkedAlt,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaUtensils,
} from "react-icons/fa";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useContent } from "../context/useContent";

const MAP_CENTER = [-3.43, -80.12];

const markerColors = {
  Destino: "#0a7ea4",
  Gastronomia: "#e8a733",
  Hospedaje: "#16a34a",
  Cooperativa: "#6d28d9",
};

function getMapPoint({ idPrefix, id, nombre, detalle, isla, lat, lng, tipo }) {
  const latitude = Number(lat);
  const longitude = Number(lng);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return {
    id: `${idPrefix}-${id}`,
    nombre,
    detalle,
    isla,
    tipo,
    lat: latitude,
    lng: longitude,
  };
}

function splitServices(services) {
  return String(services || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export default function InformacionTuristica() {
  const { destinos, gastronomia, hospedajes, floraFauna, cooperativas } =
    useContent();
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;

    window.requestAnimationFrame(() => {
      document
        .getElementById(hash.slice(1))
        ?.scrollIntoView({ block: "start", behavior: "smooth" });
    });
  }, [hash]);

  const mapPoints = useMemo(() => {
    const points = [
      ...destinos.map((destino) =>
        getMapPoint({
          idPrefix: "destino",
          id: destino.id,
          nombre: destino.nombre,
          detalle: destino.categoria,
          isla: destino.isla || "No especificada",
          lat: destino.lat,
          lng: destino.lng,
          tipo: "Destino",
        }),
      ),
      ...gastronomia.map((restaurante) =>
        getMapPoint({
          idPrefix: "gastronomia",
          id: restaurante.id,
          nombre: restaurante.nombre,
          detalle: restaurante.platoTipico,
          isla: restaurante.isla,
          lat: restaurante.lat,
          lng: restaurante.lng,
          tipo: "Gastronomia",
        }),
      ),
      ...hospedajes.map((hospedaje) =>
        getMapPoint({
          idPrefix: "hospedaje",
          id: hospedaje.id,
          nombre: hospedaje.nombre,
          detalle: hospedaje.ubicacion,
          isla: hospedaje.isla,
          lat: hospedaje.lat,
          lng: hospedaje.lng,
          tipo: "Hospedaje",
        }),
      ),
      ...cooperativas.map((cooperativa) =>
        getMapPoint({
          idPrefix: "cooperativa",
          id: cooperativa.id,
          nombre: cooperativa.nombre,
          detalle: cooperativa.ruta,
          isla: "Acceso al muelle",
          lat: cooperativa.lat,
          lng: cooperativa.lng,
          tipo: "Cooperativa",
        }),
      ),
    ];

    return points.filter(Boolean);
  }, [destinos, gastronomia, hospedajes, cooperativas]);

  return (
    <>
      <Header />
      <div style={{ paddingTop: "clamp(68px, 7vw, 80px)" }}>
        <div className="page-banner">
          <h1 className="page-banner-title">
            <FaMapMarkedAlt className="inline-icon" aria-hidden="true" />
            Informacion Turistica Integral
          </h1>
        </div>

        <main className="container info-page-content">
          <section className="info-section-card" id="gastronomia">
            <header className="info-section-header">
              <h2>
                <FaUtensils className="inline-icon" aria-hidden="true" />
                Gastronomia local
              </h2>
              <p>
                Platos tipicos y lugares recomendados en las islas del
                Archipielago de Jambeli.
              </p>
            </header>
            <div className="info-grid">
              {gastronomia.map((restaurante) => (
                <article key={restaurante.id} className="info-card">
                  <img src={restaurante.imagen} alt={restaurante.nombre} />
                  <div className="info-card-body">
                    <span className="badge badge-gold">{restaurante.isla}</span>
                    <h3>{restaurante.nombre}</h3>
                    <p>{restaurante.descripcion}</p>
                    <div className="info-meta">
                      <strong>Plato tipico:</strong> {restaurante.platoTipico}
                    </div>
                    <div className="info-meta">
                      <FaMapMarkerAlt
                        className="inline-icon"
                        aria-hidden="true"
                      />
                      {restaurante.ubicacion}
                    </div>
                    <div className="info-meta">
                      <FaPhoneAlt className="inline-icon" aria-hidden="true" />
                      {restaurante.contacto}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="info-section-card" id="hospedajes">
            <header className="info-section-header">
              <h2>
                <FaBed className="inline-icon" aria-hidden="true" />
                Hospedajes disponibles
              </h2>
              <p>
                Opciones de alojamiento con ubicacion, servicios y contacto para
                cada isla.
              </p>
            </header>
            <div className="info-grid">
              {hospedajes.map((hospedaje) => (
                <article key={hospedaje.id} className="info-card">
                  <img src={hospedaje.imagen} alt={hospedaje.nombre} />
                  <div className="info-card-body">
                    <span className="badge badge-ocean">{hospedaje.isla}</span>
                    <h3>{hospedaje.nombre}</h3>
                    <div className="info-meta">
                      <FaMapMarkerAlt
                        className="inline-icon"
                        aria-hidden="true"
                      />
                      {hospedaje.ubicacion}
                    </div>
                    <div className="info-meta">
                      <strong>Servicios:</strong>
                    </div>
                    <ul className="info-list">
                      {splitServices(hospedaje.servicios).map((servicio) => (
                        <li key={`${hospedaje.id}-${servicio}`}>{servicio}</li>
                      ))}
                    </ul>
                    <div className="info-meta">
                      <FaPhoneAlt className="inline-icon" aria-hidden="true" />
                      {hospedaje.contacto}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="info-section-card" id="flora-fauna">
            <header className="info-section-header">
              <h2>
                <FaLeaf className="inline-icon" aria-hidden="true" />
                Flora y fauna
              </h2>
              <p>
                Biodiversidad representativa del canton y zonas turisticas de
                observacion.
              </p>
            </header>
            <div className="info-grid">
              {floraFauna.map((registro) => (
                <article key={registro.id} className="info-card">
                  <img src={registro.imagen} alt={registro.nombre} />
                  <div className="info-card-body">
                    <span className="badge badge-ocean">{registro.tipo}</span>
                    <h3>{registro.nombre}</h3>
                    <p>{registro.descripcion}</p>
                    <div className="info-meta">
                      <strong>Zona:</strong> {registro.zona}
                    </div>
                    <div className="info-meta">
                      <strong>Estado:</strong> {registro.estado}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="info-section-card" id="transporte">
            <header className="info-section-header">
              <h2>
                <FaBus className="inline-icon" aria-hidden="true" />
                Cooperativas de transporte
              </h2>
              <p>
                Cooperativas habilitadas para movilizacion hacia los muelles de
                embarcacion.
              </p>
            </header>
            <div className="cooperativas-grid">
              {cooperativas.map((cooperativa) => (
                <article key={cooperativa.id} className="cooperativa-card">
                  <h3>{cooperativa.nombre}</h3>
                  <p>{cooperativa.ruta}</p>
                  <div className="info-meta">
                    <strong>Frecuencia:</strong> {cooperativa.frecuencia}
                  </div>
                  <div className="info-meta">
                    <strong>Salida:</strong> {cooperativa.puntoSalida}
                  </div>
                  <div className="info-meta">
                    <strong>Llegada:</strong> {cooperativa.puntoLlegada}
                  </div>
                  <div className="info-meta">
                    <FaPhoneAlt className="inline-icon" aria-hidden="true" />
                    {cooperativa.contacto}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="info-section-card" id="mapa">
            <header className="info-section-header">
              <h2>
                <FaMapMarkedAlt className="inline-icon" aria-hidden="true" />
                Mapa georreferenciado
              </h2>
              <p>
                Visualizacion de atractivos, gastronomia, hospedajes y
                cooperativas con coordenadas geograficas.
              </p>
            </header>
            <div className="map-layout">
              <MapContainer
                center={MAP_CENTER}
                zoom={10}
                scrollWheelZoom
                className="tourism-map"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {mapPoints.map((point) => (
                  <CircleMarker
                    key={point.id}
                    center={[point.lat, point.lng]}
                    radius={8}
                    pathOptions={{
                      color: markerColors[point.tipo] || markerColors.Destino,
                      fillOpacity: 0.75,
                      weight: 2,
                    }}
                  >
                    <Popup>
                      <strong>{point.nombre}</strong>
                      <br />
                      {point.tipo} - {point.isla}
                      <br />
                      {point.detalle}
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>

              <div className="map-legend">
                {Object.entries(markerColors).map(([key, color]) => (
                  <div key={key} className="map-legend-item">
                    <span style={{ background: color }} />
                    <p>{key}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>
      <Footer />
    </>
  );
}
