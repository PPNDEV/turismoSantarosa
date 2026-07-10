import { FaBed, FaPhoneAlt } from "react-icons/fa";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useContent } from "../context/useContent";
import { buildDetailHref } from "../utils/contentDetails";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1455587734955-081b22074882?w=900";

function HospedajeCard({ item }) {
  return (
    <Link
      className="content-card-link"
      to={buildDetailHref(
        "hospedaje",
        item,
        item.nombre,
        "hospedaje-jambeli",
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
        <span className="badge badge-ocean">Jambelí</span>
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

export default function HospedajePage() {
  const { sections } = useContent();
  const hospedajes = sections?.hospedajes || {};
  const jambeli = Array.isArray(hospedajes.jambeli) ? hospedajes.jambeli : [];
  const tarifas = Array.isArray(hospedajes.tarifas) ? hospedajes.tarifas : [];

  return (
    <>
      <Header />
      <div className="page-shell">
        <div className="page-banner">
          <h1 className="page-banner-title">
            <FaBed className="inline-icon" aria-hidden="true" />
            Hospedaje
          </h1>
        </div>

        <main className="container info-page-content">
          <section className="info-section-card">
            <header className="info-section-header">
              <h2>Hospedajes disponibles</h2>
              <p>
                Opciones de alojamiento con servicios y contacto en las islas
                del Archipielago de Jambeli.
              </p>
            </header>

            {hospedajes.descripcion && (
              <p className="info-lead">{hospedajes.descripcion}</p>
            )}

            {jambeli.length > 0 && (
              <div className="info-subsection">
                <h3 className="info-subsection-title">Jambelí</h3>
                <div className="info-grid">
                  {jambeli.map((item, index) => (
                    <HospedajeCard
                      key={`hospedaje-${item.nombre || index}`}
                      item={item}
                    />
                  ))}
                </div>
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
        </main>
      </div>
      <Footer />
    </>
  );
}
