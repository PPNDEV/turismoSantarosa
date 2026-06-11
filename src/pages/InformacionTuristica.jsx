import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  FaBed,
  FaLeaf,
  FaMapMarkedAlt,
  FaPaw,
  FaPhoneAlt,
  FaRoute,
  FaShip,
  FaUtensils,
} from "react-icons/fa";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useContent } from "../context/useContent";

const GASTRO_FALLBACK =
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=900";
const HOSPEDAJE_FALLBACK =
  "https://images.unsplash.com/photo-1455587734955-081b22074882?w=900";
const SPECIES_FALLBACK =
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=900";

function SpeciesCard({ especie, showGrupo }) {
  const nombre = especie.nombre || especie.nombreComun;
  return (
    <article className="info-card species-card">
      <img
        src={especie.imagen || SPECIES_FALLBACK}
        alt={nombre}
        loading="lazy"
        decoding="async"
        onError={(e) => {
          if (e.currentTarget.src !== SPECIES_FALLBACK) {
            e.currentTarget.src = SPECIES_FALLBACK;
          }
        }}
      />
      <div className="info-card-body">
        {showGrupo && especie.grupo && (
          <span className="badge badge-ocean">{especie.grupo}</span>
        )}
        <h3>{nombre}</h3>
        {especie.nombreCientifico && (
          <p className="species-scientific">
            <em>{especie.nombreCientifico}</em>
          </p>
        )}
      </div>
    </article>
  );
}

const ISLANDS = [
  { key: "jambeli", label: "Jambelí" },
  { key: "sanGregorio", label: "San Gregorio" },
];

function EstablecimientoCard({ item, isla, badgeClass, fallback }) {
  return (
    <article className="info-card">
      <img
        src={item.imagen || fallback}
        alt={item.nombre}
        loading="lazy"
        decoding="async"
        onError={(e) => {
          if (e.currentTarget.src !== fallback) {
            e.currentTarget.src = fallback;
          }
        }}
      />
      <div className="info-card-body">
        <span className={`badge ${badgeClass}`}>{isla}</span>
        <h3>{item.nombre}</h3>
        {item.actividad && (
          <div className="info-meta">
            <strong>Servicio:</strong> {item.actividad}
          </div>
        )}
        {item.descripcion && <p>{item.descripcion}</p>}
        {item.contacto && (
          <div className="info-meta">
            <FaPhoneAlt className="inline-icon" aria-hidden="true" />
            {item.contacto}
          </div>
        )}
      </div>
    </article>
  );
}

export default function InformacionTuristica() {
  const { sections } = useContent();
  const gastronomia = sections?.gastronomia || {};
  const hospedajes = sections?.hospedajes || {};
  const floraFauna = sections?.floraFauna || {};
  const cooperativas = sections?.cooperativas || {};
  const { hash } = useLocation();

  const fauna = floraFauna.fauna || {};
  const flora = floraFauna.flora || {};
  const faunaEspecies = Array.isArray(fauna.especies) ? fauna.especies : [];
  const floraEspecies = Array.isArray(flora.especies) ? flora.especies : [];
  const hospedajeJambeli = Array.isArray(hospedajes.jambeli)
    ? hospedajes.jambeli
    : [];
  const tarifas = Array.isArray(hospedajes.tarifas) ? hospedajes.tarifas : [];

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
            {ISLANDS.map(({ key, label }) => {
              const items = Array.isArray(gastronomia[key])
                ? gastronomia[key]
                : [];
              if (items.length === 0) return null;
              return (
                <div key={key} className="info-subsection">
                  <h3 className="info-subsection-title">{label}</h3>
                  <div className="info-grid">
                    {items.map((item, index) => (
                      <EstablecimientoCard
                        key={`gastro-${key}-${item.nombre || index}`}
                        item={item}
                        isla={label}
                        badgeClass="badge-gold"
                        fallback={GASTRO_FALLBACK}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </section>

          <section className="info-section-card" id="hospedajes">
            <header className="info-section-header">
              <h2>
                <FaBed className="inline-icon" aria-hidden="true" />
                Hospedajes disponibles
              </h2>
              <p>Opciones de alojamiento con servicios y contacto.</p>
            </header>
            {hospedajes.descripcion && (
              <p className="info-lead">{hospedajes.descripcion}</p>
            )}
            {hospedajeJambeli.length > 0 && (
              <div className="info-grid">
                {hospedajeJambeli.map((item, index) => (
                  <EstablecimientoCard
                    key={`hosp-${item.nombre || index}`}
                    item={item}
                    isla="Jambelí"
                    badgeClass="badge-ocean"
                    fallback={HOSPEDAJE_FALLBACK}
                  />
                ))}
              </div>
            )}
            {tarifas.length > 0 && (
              <div className="info-subsection">
                <h3 className="info-subsection-title">Tarifas referenciales</h3>
                <div className="info-table-wrapper">
                  <table className="info-table">
                    <thead>
                      <tr>
                        <th>Tipo</th>
                        <th>Tarifa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tarifas.map((tarifa, index) => (
                        <tr key={`tarifa-${index}`}>
                          <td>{tarifa.tipo}</td>
                          <td>{tarifa.tarifa}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          <section
            className="info-section-card flora-fauna-section"
            id="flora-fauna"
          >
            <header className="info-section-header">
              <h2>
                <FaLeaf className="inline-icon" aria-hidden="true" />
                Flora y fauna
              </h2>
              <p>Biodiversidad representativa del canton.</p>
            </header>
            {floraFauna.descripcionGeneral && (
              <p className="info-lead">{floraFauna.descripcionGeneral}</p>
            )}
            {faunaEspecies.length > 0 && (
              <div className="info-subsection">
                <h3 className="info-subsection-title">
                  <FaPaw className="inline-icon" aria-hidden="true" /> Fauna
                </h3>
                <div className="info-grid">
                  {faunaEspecies.map((especie, index) => (
                    <SpeciesCard
                      key={`fauna-${index}`}
                      especie={especie}
                      showGrupo
                    />
                  ))}
                </div>
              </div>
            )}
            {floraEspecies.length > 0 && (
              <div className="info-subsection">
                <h3 className="info-subsection-title">
                  <FaLeaf className="inline-icon" aria-hidden="true" /> Flora
                </h3>
                <div className="info-grid">
                  {floraEspecies.map((especie, index) => (
                    <SpeciesCard key={`flora-${index}`} especie={especie} />
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="info-section-card" id="transporte">
            <header className="info-section-header">
              <h2>
                <FaShip className="inline-icon" aria-hidden="true" />
                Transporte fluvial
              </h2>
              <p>Cooperativas y rutas fluviales habilitadas.</p>
            </header>
            {ISLANDS.map(({ key, label }) => {
              const items = Array.isArray(cooperativas[key])
                ? cooperativas[key]
                : [];
              if (items.length === 0) return null;
              return (
                <div key={key} className="info-subsection">
                  <h3 className="info-subsection-title">
                    {key === "jambeli"
                      ? "Ruta a Jambelí"
                      : "Ruta a San Gregorio / Costa Rica"}
                  </h3>
                  <div className="cooperativas-grid">
                    {items.map((item, index) => (
                      <article
                        key={`coop-${key}-${item.nombre || index}`}
                        className="cooperativa-card"
                      >
                        <h3>{item.nombre}</h3>
                        {item.ruta && (
                          <div className="info-meta">
                            <FaRoute
                              className="inline-icon"
                              aria-hidden="true"
                            />
                            {item.ruta}
                          </div>
                        )}
                        {item.procedencia && (
                          <div className="info-meta">
                            <strong>Procedencia:</strong> {item.procedencia}
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                </div>
              );
            })}
          </section>
        </main>
      </div>
      <Footer />
    </>
  );
}
