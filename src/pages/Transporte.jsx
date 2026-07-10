import { FaRoute, FaShip } from "react-icons/fa";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useContent } from "../context/useContent";
import { buildDetailHref } from "../utils/contentDetails";

const ISLANDS = [
  { key: "jambeli", label: "Ruta a Jambelí" },
  { key: "sanGregorio", label: "Ruta a San Gregorio / Costa Rica" },
];

function CooperativaCard({ item, routeKey }) {
  return (
    <Link
      className="content-card-link"
      to={buildDetailHref(
        "transporte",
        item,
        item.nombre,
        `transporte-${routeKey}`,
      )}
      aria-label={`Ver información completa de ${item.nombre}`}
    >
    <article className="cooperativa-card">
      <h3>{item.nombre}</h3>
      {item.ruta && (
        <div className="info-meta">
          <FaRoute className="inline-icon" aria-hidden="true" />
          {item.ruta}
        </div>
      )}
      {item.procedencia && (
        <div className="info-meta">
          <strong>Procedencia:</strong> {item.procedencia}
        </div>
      )}
    </article>
    </Link>
  );
}

export default function TransportePage() {
  const { sections } = useContent();
  const cooperativas = sections?.cooperativas || {};

  return (
    <>
      <Header />
      <div className="page-shell">
        <div className="page-banner">
          <h1 className="page-banner-title">
            <FaShip className="inline-icon" aria-hidden="true" />
            Transporte fluvial
          </h1>
        </div>

        <main className="container info-page-content">
          <section className="info-section-card">
            <header className="info-section-header">
              <h2>Operadoras de transporte fluvial</h2>
              <p>
                Cooperativas y rutas fluviales habilitadas para movilizacion
                entre muelles, islas y zonas de embarcacion.
              </p>
            </header>

            {ISLANDS.map(({ key, label }) => {
              const items = Array.isArray(cooperativas[key])
                ? cooperativas[key]
                : [];
              if (items.length === 0) return null;

              return (
                <div key={key} className="info-subsection">
                  <h3 className="info-subsection-title">{label}</h3>
                  <div className="cooperativas-grid">
                    {items.map((item, index) => (
                      <CooperativaCard
                        key={`${key}-${item.nombre || index}`}
                        item={item}
                        routeKey={key}
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
