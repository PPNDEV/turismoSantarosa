import { FaLeaf, FaPaw } from "react-icons/fa";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useContent } from "../context/useContent";
import { buildDetailHref } from "../utils/contentDetails";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=900";

function SpeciesCard({ especie, showGrupo, category }) {
  const nombre = especie.nombre || especie.nombreComun;
  return (
    <Link
      className="content-card-link"
      to={buildDetailHref(
        "flora-fauna",
        especie,
        nombre,
        `flora-fauna-${category}`,
      )}
      aria-label={`Ver información completa de ${nombre}`}
    >
    <article className="info-card species-card">
      <img
        src={especie.imagen || FALLBACK_IMAGE}
        alt={nombre}
        loading="lazy"
        decoding="async"
        onError={(e) => {
          if (e.currentTarget.src !== FALLBACK_IMAGE) {
            e.currentTarget.src = FALLBACK_IMAGE;
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
    </Link>
  );
}

export default function FloraFaunaPage() {
  const { sections } = useContent();
  const floraFauna = sections?.floraFauna || {};
  const fauna = floraFauna.fauna || {};
  const flora = floraFauna.flora || {};
  const faunaEspecies = Array.isArray(fauna.especies) ? fauna.especies : [];
  const floraEspecies = Array.isArray(flora.especies) ? flora.especies : [];

  return (
    <>
      <Header />
      <div className="page-shell">
        <div className="page-banner">
          <h1 className="page-banner-title">
            <FaLeaf className="inline-icon" aria-hidden="true" />
            Flora y Fauna
          </h1>
        </div>

        <main className="container info-page-content">
          <section className="info-section-card flora-fauna-section">
            <header className="info-section-header">
              <h2>Biodiversidad local</h2>
              <p>
                Biodiversidad representativa del Archipielago de Jambeli y la
                Region de endemismo tumbesino.
              </p>
            </header>

            {floraFauna.descripcionGeneral && (
              <p className="info-lead">{floraFauna.descripcionGeneral}</p>
            )}

            {faunaEspecies.length > 0 && (
              <div className="info-subsection">
                <h3 className="info-subsection-title">
                  <FaPaw className="inline-icon" aria-hidden="true" /> Fauna
                </h3>
                {fauna.descripcion && <p className="info-lead">{fauna.descripcion}</p>}
                <div className="info-grid">
                  {faunaEspecies.map((especie, index) => (
                    <SpeciesCard
                      key={`fauna-${index}`}
                      especie={especie}
                      showGrupo
                      category="fauna"
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
                {flora.descripcion && <p className="info-lead">{flora.descripcion}</p>}
                <div className="info-grid">
                  {floraEspecies.map((especie, index) => (
                    <SpeciesCard
                      key={`flora-${index}`}
                      especie={especie}
                      category="flora"
                    />
                  ))}
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
      <Footer />
    </>
  );
}
