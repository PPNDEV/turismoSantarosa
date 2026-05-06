import { useState } from "react";
import { FaCamera, FaFilm, FaVideo } from "react-icons/fa";
import { useContent } from "../context/useContent";
import { useLanguage } from "../context/useLanguage";
import GalleryLightbox from "./GalleryLightbox";

export default function Galeria() {
  const [tab, setTab] = useState("foto");
  const [selectedItem, setSelectedItem] = useState(null);
  const { galeria } = useContent();
  const { t } = useLanguage();
  const filtered = galeria.filter((g) => g.tipo === tab);

  const getLocalizedValue = (key, fallback) => {
    const translated = t(key);
    return translated === key ? fallback : translated;
  };

  return (
    <section>
      <div className="container">
        <div className="section-header reveal">
          <h2 className="section-title">
            {t("galeriaSection.titleStart")}{" "}
            <span className="accent">{t("galeriaSection.titleAccent")}</span>
          </h2>
          <p className="section-subtitle">{t("galeriaSection.subtitle")}</p>
        </div>
        <div className="galeria-tabs">
          <button
            type="button"
            className={`tab-btn ${tab === "foto" ? "active" : ""}`}
            onClick={() => setTab("foto")}
          >
            <FaCamera className="inline-icon" aria-hidden="true" />
            {t("galeriaSection.photos")}
          </button>
          <button
            type="button"
            className={`tab-btn ${tab === "video" ? "active" : ""}`}
            onClick={() => setTab("video")}
          >
            <FaVideo className="inline-icon" aria-hidden="true" />
            {t("galeriaSection.videos")}
          </button>
        </div>
        <div className="galeria-grid">
          {filtered.length === 0 && tab === "video" ? (
            <div className="galeria-empty">
              <div className="galeria-empty-icon">
                <FaFilm aria-hidden="true" />
              </div>
              <p>{t("galeriaSection.emptyVideos")}</p>
            </div>
          ) : (
            filtered.map((g) =>
              (() => {
                const translatedTitle = getLocalizedValue(
                  `content.gallery.${g.id}.title`,
                  g.titulo,
                );

                return (
                  <button
                    key={g.id}
                    type="button"
                    className="galeria-item reveal"
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
              })(),
            )
          )}
        </div>
      </div>
      <GalleryLightbox
        item={selectedItem}
        title={selectedItem?.translatedTitle}
        onClose={() => setSelectedItem(null)}
      />
    </section>
  );
}
