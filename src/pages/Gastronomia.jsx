import { FaMapMarkerAlt, FaPhoneAlt, FaUtensils } from "react-icons/fa";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useContent } from "../context/useContent";

export default function GastronomiaPage() {
  const { gastronomia } = useContent();

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
          <section className="info-section-card">
            <header className="info-section-header">
              <h2>Gastronomia local</h2>
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
        </main>
      </div>
      <Footer />
    </>
  );
}
