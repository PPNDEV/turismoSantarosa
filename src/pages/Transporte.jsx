import { FaBus, FaPhoneAlt } from "react-icons/fa";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useContent } from "../context/useContent";

export default function TransportePage() {
  const { cooperativas } = useContent();

  return (
    <>
      <Header />
      <div className="page-shell">
        <div className="page-banner">
          <h1 className="page-banner-title">
            <FaBus className="inline-icon" aria-hidden="true" />
            Transporte
          </h1>
        </div>

        <main className="container info-page-content">
          <section className="info-section-card">
            <header className="info-section-header">
              <h2>Cooperativas de transporte</h2>
              <p>
                Cooperativas habilitadas para movilizacion hacia los muelles de
                embarcacion.
              </p>
            </header>

            <div className="cooperativas-grid">
              {cooperativas.map((cooperativa) => (
                <article key={cooperativa.id} className="cooperativa-card">
                  <h3>{cooperativa.nombre}</h3>
                  <p>{cooperativa.ruta}</p>
                  <div className="info-meta">
                    <strong>Frecuencia:</strong> {cooperativa.frecuencia}
                  </div>
                  <div className="info-meta">
                    <strong>Salida:</strong> {cooperativa.puntoSalida}
                  </div>
                  <div className="info-meta">
                    <strong>Llegada:</strong> {cooperativa.puntoLlegada}
                  </div>
                  <div className="info-meta">
                    <FaPhoneAlt className="inline-icon" aria-hidden="true" />
                    {cooperativa.contacto}
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
