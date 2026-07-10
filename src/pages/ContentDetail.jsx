import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaArrowRight,
  FaInfoCircle,
  FaMapMarkerAlt,
} from "react-icons/fa";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useContent } from "../context/useContent";
import {
  getContentDetail,
  getContentDetails,
  getSectionBasePath,
} from "../utils/contentDetails";

export default function ContentDetailPage({ type }) {
  const { slug } = useParams();
  const { sections, loading } = useContent();
  const detail = useMemo(
    () => getContentDetail(type, slug, sections),
    [type, slug, sections],
  );
  const related = useMemo(
    () =>
      getContentDetails(type, sections)
        .filter((item) => item.slug !== slug)
        .slice(0, 3),
    [type, slug, sections],
  );
  const backPath = getSectionBasePath(type);

  if (loading) {
    return (
      <>
        <Header />
        <main className="content-detail-shell">
          <div className="content-detail-loading" role="status">
            Preparando el contenido...
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!detail) {
    return (
      <>
        <Header />
        <main className="content-detail-shell">
          <section className="content-detail-not-found">
            <FaInfoCircle aria-hidden="true" />
            <h1>Contenido no disponible</h1>
            <p>Este contenido pudo cambiar o ya no está publicado.</p>
            <Link className="btn btn-primary" to={backPath}>
              <FaArrowLeft aria-hidden="true" /> Volver a la sección
            </Link>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="content-detail-shell">
        <article className="content-detail-article">
          <Link className="content-detail-back" to={backPath}>
            <FaArrowLeft aria-hidden="true" /> {detail.backLabel}
          </Link>

          <header className="content-detail-header">
            <span className="content-detail-kicker">{detail.sectionLabel}</span>
            <span className="badge badge-ocean">{detail.badge}</span>
            <h1>{detail.title}</h1>
            {detail.description && (
              <p className="content-detail-lead">{detail.description}</p>
            )}
          </header>

          {detail.image ? (
            <figure className="content-detail-hero">
              <img src={detail.image} alt={detail.title} />
            </figure>
          ) : (
            <div className="content-detail-route-hero" aria-hidden="true">
              <FaMapMarkerAlt />
            </div>
          )}

          {detail.facts.length > 0 && (
            <section className="content-detail-facts" aria-label="Información">
              {detail.facts.map((fact) => (
                <div className="content-detail-fact" key={fact.label}>
                  <span>{fact.label}</span>
                  <strong>{fact.value}</strong>
                </div>
              ))}
            </section>
          )}
        </article>

        {related.length > 0 && (
          <section className="content-detail-related">
            <div className="content-detail-related-heading">
              <span>Seguir explorando</span>
              <h2>También puede interesarte</h2>
            </div>
            <div className="content-detail-related-grid">
              {related.map((item) => (
                <Link
                  className="content-related-card"
                  to={item.href}
                  key={item.slug}
                  aria-label={`Ver información de ${item.title}`}
                >
                  {item.image && <img src={item.image} alt="" loading="lazy" />}
                  <div>
                    <span>{item.badge}</span>
                    <h3>{item.title}</h3>
                    <p>
                      Ver información <FaArrowRight aria-hidden="true" />
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
