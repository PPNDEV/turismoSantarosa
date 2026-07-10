import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaCamera,
  FaCocktail,
  FaFish,
  FaTree,
  FaUmbrellaBeach,
  FaWalking,
  FaWater,
} from "react-icons/fa";
import { useContent } from "../context/useContent";
import { useLanguage } from "../context/useLanguage";
import { buildDetailHref } from "../utils/contentDetails";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200";

const DEFAULT_EDITORIAL = {
  eyebrow: "Bienvenidos a Santa Rosa",
  title: "¡Santa Rosa, te enamora!",
  subtitle:
    "Santa Rosa, ciudad Benemérita del Ecuador, perteneciente a la provincia de El Oro, es reconocida a nivel nacional e internacional por ser pionera en el cultivo del camarón en cautiverio.",
  intro: "",
};

// Mapea el campo `icono` del contenido a un icono visual.
function ActivityIcon({ icono }) {
  const props = { className: "inline-icon", "aria-hidden": true };
  switch (String(icono || "").toLowerCase()) {
    case "water":
      return <FaWater {...props} />;
    case "walk":
      return <FaWalking {...props} />;
    case "tree":
      return <FaTree {...props} />;
    case "glass":
      return <FaCocktail {...props} />;
    case "fish":
      return <FaFish {...props} />;
    default:
      return <FaUmbrellaBeach {...props} />;
  }
}

function getIntroParagraphs(intro) {
  return String(intro || "")
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function ActivityCard({ activity, index }) {
  return (
    <Link
      className="content-card-link"
      to={buildDetailHref(
        "actividades",
        activity,
        activity.nombre,
        "actividades",
      )}
      aria-label={`Ver información completa de ${activity.nombre}`}
    >
    <article className="activity-card reveal">
      <div className="activity-card-media">
        <img
          src={activity.imagen || FALLBACK_IMAGE}
          alt={activity.nombre}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            if (e.currentTarget.src !== FALLBACK_IMAGE) {
              e.currentTarget.src = FALLBACK_IMAGE;
            }
          }}
        />
      </div>
      <div className="activity-card-body">
        <div className="activity-card-meta">
          <span className="badge badge-ocean">{activity.isla || "Jambelí"}</span>
          <span className="activity-card-index">
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>
        <h3>
          <ActivityIcon icono={activity.icono} /> {activity.nombre}
        </h3>
        <p>{activity.descripcion}</p>
      </div>
    </article>
    </Link>
  );
}

export default function QueHacer({ mode = "teaser" }) {
  const { t } = useLanguage();
  const content = useContent() || {};
  const actividadesData = content.sections?.actividades || {};
  const actividadesEditorial = Array.isArray(content.actividadesEditorial)
    ? content.actividadesEditorial
    : [];

  const editorial = {
    ...DEFAULT_EDITORIAL,
    ...(actividadesEditorial[0] || {}),
  };
  const leadText = actividadesData.descripcion || editorial.intro;
  const activities = Array.isArray(actividadesData.listado)
    ? actividadesData.listado
    : [];
  const teaserActivities = activities.slice(0, 4);
  const isPage = mode === "page";
  const visibleActivities = isPage ? activities : teaserActivities;

  return (
    <section
      id={isPage ? undefined : "que-hacer"}
      className={
        isPage
          ? "activities-section activities-page"
          : "activities-section activities-teaser"
      }
    >
      <div className="container">
        {isPage ? (
          <div className="section-header reveal activities-section-header">
            <h1 className="section-title">
              <span className="accent">{t("pages.activities")}</span>
            </h1>
            <p className="section-subtitle">
              Experiencias turisticas para disfrutar Santa Rosa.
            </p>
          </div>
        ) : (
          <div className="activities-teaser-header reveal">
            <div>
              <span className="activities-kicker">{editorial.eyebrow}</span>
              <h2 className="section-title">{editorial.title}</h2>
              <p className="section-subtitle">{editorial.subtitle}</p>
            </div>
            <Link className="btn btn-outline" to="/actividades">
              {t("footer.links.activities")}
              <FaArrowRight className="inline-icon" aria-hidden="true" />
            </Link>
          </div>
        )}

        {leadText && (
          <div className="activities-teaser-intro reveal">
            {getIntroParagraphs(leadText).map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        )}

        {visibleActivities.length > 0 && (
          <div
            className={
              isPage
                ? "activities-grid"
                : "activities-grid activities-grid-teaser"
            }
          >
            {visibleActivities.map((activity, index) => (
              <ActivityCard
                key={activity.id || `${activity.nombre}-${index}`}
                activity={activity}
                index={index}
              />
            ))}
          </div>
        )}

        {!isPage && activities.length > 0 && (
          <div className="activities-teaser-footer reveal">
            <Link className="btn btn-primary" to="/actividades">
              Explorar editorial completa
              <FaArrowRight className="inline-icon" aria-hidden="true" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
