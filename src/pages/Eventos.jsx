import { useMemo, useState } from "react";
import { FaLandmark, FaTag } from "react-icons/fa";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useContent } from "../context/useContent";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=900";

function getImage(imagen) {
  return imagen && imagen.trim() ? imagen : FALLBACK_IMAGE;
}

export default function EventosPage() {
  const { sections } = useContent();
  const eventos = sections?.eventos || {};
  const manifestaciones = useMemo(
    () =>
      Array.isArray(eventos.manifestaciones) ? eventos.manifestaciones : [],
    [eventos.manifestaciones],
  );
  const patrimonio = eventos.patrimonio || {};
  const [tipo, setTipo] = useState("todos");

  const tipos = useMemo(
    () =>
      [
        ...new Set(
          manifestaciones.map((item) => item.tipo).filter(Boolean),
        ),
      ].sort((a, b) => a.localeCompare(b)),
    [manifestaciones],
  );

  const visibles = useMemo(
    () =>
      tipo === "todos"
        ? manifestaciones
        : manifestaciones.filter((item) => item.tipo === tipo),
    [manifestaciones, tipo],
  );

  return (
    <>
      <Header />
      <div className="page-shell">
        <div className="page-banner">
          <h1 className="page-banner-title">
            <FaLandmark className="inline-icon" aria-hidden="true" />
            Cultura y Patrimonio
          </h1>
        </div>

        <main className="container info-page-content">
          <section className="info-section-card">
            <header className="info-section-header">
              <h2>Manifestaciones culturales</h2>
              <p>
                Riqueza biocultural y manifestaciones del Archipielago de
                Jambeli.
              </p>
            </header>

            {eventos.descripcionGeneral && (
              <p className="info-lead">{eventos.descripcionGeneral}</p>
            )}

            {tipos.length > 0 && (
              <div className="eventos-filter-chips">
                <button
                  type="button"
                  className={`filter-chip ${tipo === "todos" ? "active" : ""}`}
                  onClick={() => setTipo("todos")}
                >
                  Todos
                </button>
                {tipos.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`filter-chip ${tipo === item ? "active" : ""}`}
                    onClick={() => setTipo(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}

            {visibles.length > 0 && (
              <div className="eventos-grid eventos-grid-page">
                {visibles.map((item, index) => (
                  <div key={`manifestacion-${index}`} className="evento-card">
                    <img
                      src={getImage(item.imagen)}
                      alt={item.subtipo || item.tipo}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        if (e.currentTarget.src !== FALLBACK_IMAGE) {
                          e.currentTarget.src = FALLBACK_IMAGE;
                        }
                      }}
                    />
                    <div className="evento-body">
                      <div className="evento-chip">
                        <FaTag className="inline-icon" aria-hidden="true" />
                        {item.tipo}
                      </div>
                      <h3>{item.subtipo}</h3>
                      <p>{item.descripcion}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {(patrimonio.tangible || patrimonio.intangible) && (
            <section className="info-section-card">
              <header className="info-section-header">
                <h2>Patrimonio</h2>
                <p>Patrimonio tangible e intangible del Archipielago.</p>
              </header>
              <div className="info-grid">
                {patrimonio.tangible && (
                  <article className="info-card info-card-text">
                    <div className="info-card-body">
                      <span className="badge badge-ocean">Tangible</span>
                      <p>{patrimonio.tangible}</p>
                    </div>
                  </article>
                )}
                {patrimonio.intangible && (
                  <article className="info-card info-card-text">
                    <div className="info-card-body">
                      <span className="badge badge-gold">Intangible</span>
                      <p>{patrimonio.intangible}</p>
                    </div>
                  </article>
                )}
              </div>
            </section>
          )}
        </main>
      </div>
      <Footer />
    </>
  );
}
