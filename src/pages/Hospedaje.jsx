import { FaBed, FaMapMarkerAlt, FaPhoneAlt } from "react-icons/fa";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useContent } from "../context/useContent";

function splitServices(services) {
  return String(services || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export default function HospedajePage() {
  const { hospedajes } = useContent();

  return (
    <>
      <Header />
      <div style={{ paddingTop: "clamp(68px, 7vw, 80px)" }}>
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
                Opciones de alojamiento con ubicacion, servicios y contacto para
                cada isla.
              </p>
            </header>

            <div className="info-grid">
              {hospedajes.map((hospedaje) => (
                <article key={hospedaje.id} className="info-card">
                  <img src={hospedaje.imagen} alt={hospedaje.nombre} />
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
        </main>
      </div>
      <Footer />
    </>
  );
}
