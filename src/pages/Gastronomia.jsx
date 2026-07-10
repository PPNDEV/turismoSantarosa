import { FaPhoneAlt, FaUtensils } from "react-icons/fa";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useContent } from "../context/useContent";
import { buildDetailHref } from "../utils/contentDetails";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=900";

const ISLANDS = [
  { key: "jambeli", label: "Jambelí" },
  { key: "sanGregorio", label: "San Gregorio" },
];

function EstablecimientoCard({ item, isla, islandKey }) {
  return (
    <Link
      className="content-card-link"
      to={buildDetailHref(
        "gastronomia",
        item,
        item.nombre,
        `gastronomia-${islandKey}`,
      )}
      aria-label={`Ver información completa de ${item.nombre}`}
    >
    <article className="info-card">
      <img
        src={item.imagen || FALLBACK_IMAGE}
        alt={item.nombre}
        loading="lazy"
        decoding="async"
        onError={(e) => {
          if (e.currentTarget.src !== FALLBACK_IMAGE) {
            e.currentTarget.src = FALLBACK_IMAGE;
          }
        }}
      />
      <div className="info-card-body">
        <span className="badge badge-gold">{isla}</span>
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
    </Link>
  );
}

export default function GastronomiaPage() {
  const { sections } = useContent();
  const gastronomia = sections?.gastronomia || {};

  return (
    <>
      <Header />
      <div className="page-shell">
        <div className="page-banner">
          <h1 className="page-banner-title">
            <FaUtensils className="inline-icon" aria-hidden="true" />
            Gastronomia
          </h1>
        </div>

        <main className="container info-page-content">
          <section className="info-section-card gastronomia-section">
            <header className="info-section-header">
              <h2>Gastronomia local</h2>
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
                        key={`${key}-${item.nombre || index}`}
                        item={item}
                        isla={label}
                        islandKey={key}
                      />
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
