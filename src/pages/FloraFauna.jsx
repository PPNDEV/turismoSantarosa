import { FaLeaf } from "react-icons/fa";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useContent } from "../context/useContent";

export default function FloraFaunaPage() {
  const { floraFauna } = useContent();

  return (
    <>
      <Header />
      <div style={{ paddingTop: "clamp(68px, 7vw, 80px)" }}>
        <div className="page-banner">
          <h1 className="page-banner-title">
            <FaLeaf className="inline-icon" aria-hidden="true" />
            Flora y Fauna
          </h1>
        </div>

        <main className="container info-page-content">
          <section className="info-section-card">
            <header className="info-section-header">
              <h2>Biodiversidad local</h2>
              <p>
                Biodiversidad representativa del canton y zonas turisticas de
                observacion.
              </p>
            </header>

            <div className="info-grid">
              {floraFauna.map((registro) => (
                <article key={registro.id} className="info-card">
                  <img src={registro.imagen} alt={registro.nombre} />
                  <div className="info-card-body">
                    <span className="badge badge-ocean">{registro.tipo}</span>
                    <h3>{registro.nombre}</h3>
                    <p>{registro.descripcion}</p>
                    <div className="info-meta">
                      <strong>Zona:</strong> {registro.zona}
                    </div>
                    <div className="info-meta">
                      <strong>Estado:</strong> {registro.estado}
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
