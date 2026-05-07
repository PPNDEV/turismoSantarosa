import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  FaBed,
  FaLeaf,
  FaMapMarkedAlt,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaShip,
  FaUtensils,
} from "react-icons/fa";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useContent } from "../context/useContent";

function splitServices(services) {
  return String(services || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export default function InformacionTuristica() {
  const { gastronomia, hospedajes, floraFauna, cooperativas } = useContent();
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;

    window.requestAnimationFrame(() => {
      document
        .getElementById(hash.slice(1))
        ?.scrollIntoView({ block: "start", behavior: "smooth" });
    });
  }, [hash]);

  return (
    <>
      <Header />
      <div className="page-shell">
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
                  <img
                    src={restaurante.imagen}
                    alt={restaurante.nombre}
                    loading="lazy"
                    decoding="async"
                  />
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
                  <img
                    src={hospedaje.imagen}
                    alt={hospedaje.nombre}
                    loading="lazy"
                    decoding="async"
                  />
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

          <section className="info-section-card flora-fauna-section" id="flora-fauna">
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
                  <img
                    src={registro.imagen}
                    alt={registro.nombre}
                    loading="lazy"
                    decoding="async"
                  />
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
                <FaShip className="inline-icon" aria-hidden="true" />
                Transporte fluvial
              </h2>
              <p>
                Rutas fluviales habilitadas para movilizacion entre muelles,
                islas y zonas de embarcacion.
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
                    <strong>Muelle de salida:</strong>{" "}
                    {cooperativa.puntoSalida}
                  </div>
                  <div className="info-meta">
                    <strong>Muelle o isla de llegada:</strong>{" "}
                    {cooperativa.puntoLlegada}
                  </div>
                  <div className="info-meta">
                    <FaPhoneAlt className="inline-icon" aria-hidden="true" />
                    {cooperativa.contacto}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </main>
      </div>
      <Footer />
    </>
  );
}
