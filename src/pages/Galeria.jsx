import { FaCamera } from "react-icons/fa";
import Header from "../components/Header";
import Footer from "../components/Footer";
import GalleryLightbox from "../components/GalleryLightbox";
import { useContent } from "../context/useContent";
import { useLanguage } from "../context/useLanguage";
import { useState } from "react";

function getLocalizedValue(t, key, fallback) {
  const translated = t(key);
  return translated === key ? fallback : translated;
}

export default function GaleriaPage() {
  const [selectedItem, setSelectedItem] = useState(null);
  const { galeria } = useContent();
  const { t } = useLanguage();

  return (
    <>
      <Header />
      <div className="page-shell">
        <div className="page-banner">
          <h1 className="page-banner-title">
            <FaCamera className="inline-icon" aria-hidden="true" />
            {t("pages.gallery")}
          </h1>
        </div>

        <main className="container page-container">
          <div className="galeria-grid">
            {galeria.map((g) => {
              const translatedTitle = getLocalizedValue(
                t,
                `content.gallery.${g.id}.title`,
                g.titulo,
              );

              return (
                <button
                  key={g.id}
                  type="button"
                  className="galeria-item"
                  onClick={() => setSelectedItem({ ...g, translatedTitle })}
                >
                  <img
                    src={g.url}
                    alt={translatedTitle}
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="galeria-overlay">
                    <span>{translatedTitle}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </main>
      </div>
      <GalleryLightbox
        item={selectedItem}
        title={selectedItem?.translatedTitle}
        onClose={() => setSelectedItem(null)}
      />
      <Footer />
    </>
  );
}
