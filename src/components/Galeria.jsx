import { useState } from "react";
import { FaCamera, FaFilm, FaVideo } from "react-icons/fa";
import { useContent } from "../context/useContent";
import { useLanguage } from "../context/useLanguage";

export default function Galeria() {
  const [tab, setTab] = useState("foto");
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
            <div
              style={{
                gridColumn: "1/-1",
                textAlign: "center",
                padding: "3rem",
                color: "var(--gray-400)",
              }}
            >
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>
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
                  <div key={g.id} className="galeria-item reveal">
                    <img src={g.url} alt={translatedTitle} loading="lazy" />
                    <div className="galeria-overlay">
                      <span>{translatedTitle}</span>
                    </div>
                  </div>
                );
              })(),
            )
          )}
        </div>
      </div>
    </section>
  );
}
