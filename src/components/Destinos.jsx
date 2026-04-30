import { Link } from "react-router-dom";
import { useContent } from "../context/useContent";
import { getDestinoIconComponent } from "../utils/destinoIcons";
import { useLanguage } from "../context/useLanguage";

export default function Destinos() {
  const { destinos } = useContent();
  const { t } = useLanguage();

  const getLocalizedValue = (key, fallback) => {
    const translated = t(key);
    return translated === key ? fallback : translated;
  };

  return (
    <section>
      <div className="container">
        <div className="section-header reveal">
          <h2 className="section-title">
            {t("destinosSection.titleStart")}{" "}
            <span className="accent">{t("destinosSection.titleAccent")}</span>
          </h2>
          <p className="section-subtitle">{t("destinosSection.subtitle")}</p>
        </div>
        <div className="destinos-grid">
          {destinos.map((d) => {
            const translatedName = getLocalizedValue(
              `content.destinations.${d.id}.name`,
              d.nombre,
            );
            const translatedDescription = getLocalizedValue(
              `content.destinations.${d.id}.description`,
              d.descripcion,
            );
            const translatedCategory = getLocalizedValue(
              `content.destinations.${d.id}.category`,
              d.categoria,
            );
            const translatedIsland = getLocalizedValue(
              `content.destinations.${d.id}.island`,
              d.isla || "Archipiélago de Jambelí",
            );
            const DestinoIcon = getDestinoIconComponent(d.icono);

            return (
              <div key={d.id} className="destino-card reveal">
                <div className="media-crop">
                  <img
                    src={d.imagen}
                    alt={translatedName}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="destino-info">
                  <div className="destino-cat">
                    <DestinoIcon className="inline-icon" aria-hidden="true" />
                    {translatedCategory}
                  </div>
                  <div className="destino-island">Isla: {translatedIsland}</div>
                  <h3>{translatedName}</h3>
                  <p>{translatedDescription}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="cta-center">
          <Link to="/destinos" className="btn btn-primary">
            {t("destinosSection.cta")} →
          </Link>
        </div>
      </div>
    </section>
  );
}
