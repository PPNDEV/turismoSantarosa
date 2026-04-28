import { FaCamera } from "react-icons/fa";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useContent } from "../context/useContent";
import { useLanguage } from "../context/useLanguage";

function getLocalizedValue(t, key, fallback) {
  const translated = t(key);
  return translated === key ? fallback : translated;
}

export default function GaleriaPage() {
  const { galeria } = useContent();
  const { t } = useLanguage();

  return (
    <>
      <Header />
      <div style={{ paddingTop: "clamp(68px, 7vw, 80px)" }}>
        <div className="page-banner">
          <h1 className="page-banner-title">
            <FaCamera className="inline-icon" aria-hidden="true" />
            {t("pages.gallery")}
          </h1>
        </div>

        <main className="container" style={{ padding: "3rem 1.5rem" }}>
          <div className="galeria-grid">
            {galeria.map((g) => {
              const translatedTitle = getLocalizedValue(
                t,
                `content.gallery.${g.id}.title`,
                g.titulo,
              );

              return (
                <div key={g.id} className="galeria-item">
                  <img src={g.url} alt={translatedTitle} loading="lazy" />
                  <div className="galeria-overlay">
                    <span>{translatedTitle}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}
