import { useMemo } from "react";
import { Link } from "react-router-dom";
import { FaLandmark, FaTag } from "react-icons/fa";
import { useContent } from "../context/useContent";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=900";

function getImage(imagen) {
  return imagen && imagen.trim() ? imagen : FALLBACK_IMAGE;
}

export default function Eventos() {
  const { sections } = useContent();
  const eventos = sections?.eventos || {};
  const manifestaciones = useMemo(
    () =>
      (Array.isArray(eventos.manifestaciones) ? eventos.manifestaciones : [])
        .slice(0, 3),
    [eventos.manifestaciones],
  );

  if (manifestaciones.length === 0) {
    return null;
  }

  return (
    <section className="section-gray">
      <div className="container">
        <div className="section-header reveal">
          <h2 className="section-title">
            Cultura y <span className="accent">Patrimonio</span>
          </h2>
          <p className="section-subtitle">
            Manifestaciones culturales y riqueza biocultural del Archipielago de
            Jambeli.
          </p>
        </div>

        <div className="eventos-grid">
          {manifestaciones.map((item, index) => (
            <div key={`manifestacion-${index}`} className="evento-card reveal">
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

        <div className="cta-center">
          <Link to="/eventos" className="btn btn-primary">
            <FaLandmark className="inline-icon" aria-hidden="true" />
            Ver cultura y patrimonio →
          </Link>
        </div>
      </div>
    </section>
  );
}
