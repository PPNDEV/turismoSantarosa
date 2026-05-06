import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaBinoculars,
  FaCamera,
  FaFish,
  FaLeaf,
  FaQuoteLeft,
  FaTheaterMasks,
  FaTree,
  FaUmbrellaBeach,
  FaUtensils,
} from "react-icons/fa";
import { useContent } from "../context/useContent";
import { useLanguage } from "../context/useLanguage";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200";

const DEFAULT_EDITORIAL = {
  eyebrow: "Editorial turístico",
  title: "Actividades que se viven, se cuentan y se recuerdan",
  subtitle:
    "Una lectura más pausada del territorio, con experiencias que puedes editar y publicar desde el panel.",
  intro:
    "Desde la costa hasta el humedal, Santa Rosa se recorre con calma. Esta página reúne experiencias turísticas para descubrir, promover y actualizar sin tocar el código.",
  quote: "Cada actividad suma una historia distinta al viaje.",
  quoteAuthor: "Dirección de Turismo",
  ctaLabel: "Explorar destinos",
  ctaTo: "/destinos",
  heroImage: FALLBACK_IMAGE,
};

function buildFallbackActivities(t) {
  return [
    {
      icon: FaUmbrellaBeach,
      nombre: t("queHacer.activities.beach.name"),
      descripcion: t("queHacer.activities.beach.desc"),
      isla: "Jambelí",
    },
    {
      icon: FaBinoculars,
      nombre: t("queHacer.activities.nature.name"),
      descripcion: t("queHacer.activities.nature.desc"),
      isla: "Costa Rica",
    },
    {
      icon: FaUtensils,
      nombre: t("queHacer.activities.gastronomy.name"),
      descripcion: t("queHacer.activities.gastronomy.desc"),
      isla: "San Gregorio",
    },
    {
      icon: FaFish,
      nombre: t("queHacer.activities.fishing.name"),
      descripcion: t("queHacer.activities.fishing.desc"),
      isla: "Mar abierto",
    },
    {
      icon: FaLeaf,
      nombre: t("queHacer.activities.ecotourism.name"),
      descripcion: t("queHacer.activities.ecotourism.desc"),
      isla: "La Tembladera",
    },
    {
      icon: FaTheaterMasks,
      nombre: t("queHacer.activities.culture.name"),
      descripcion: t("queHacer.activities.culture.desc"),
      isla: "Santa Rosa",
    },
    {
      icon: FaTree,
      nombre: t("queHacer.activities.mangrove.name"),
      descripcion: t("queHacer.activities.mangrove.desc"),
      isla: "Manglares",
    },
    {
      icon: FaCamera,
      nombre: t("queHacer.activities.photo.name"),
      descripcion: t("queHacer.activities.photo.desc"),
      isla: "Paisajes",
    },
  ];
}

function ActivityCard({ activity, index }) {
  const Icon = activity.icon || FaCamera;

  return (
    <article className="activity-card reveal">
      <div className="activity-card-media">
        <img
          src={activity.imagen || FALLBACK_IMAGE}
          alt={activity.nombre}
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="activity-card-body">
        <div className="activity-card-meta">
          <span className="badge badge-ocean">
            {activity.isla || "Santa Rosa"}
          </span>
          <span className="activity-card-index">
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>
        <h3>
          <Icon className="inline-icon" aria-hidden="true" /> {activity.nombre}
        </h3>
        <p>{activity.descripcion}</p>
      </div>
    </article>
  );
}

export default function QueHacer({ mode = "teaser" }) {
  const { t } = useLanguage();
  const { actividades, actividadesEditorial } = useContent();

  const editorial = {
    ...DEFAULT_EDITORIAL,
    ...(actividadesEditorial[0] || {}),
  };
  const fallbackActivities = buildFallbackActivities(t);
  const visibleActivities =
    actividades.length > 0 ? actividades : fallbackActivities;
  const teaserActivities = visibleActivities.slice(0, 4);
  const heroImage =
    editorial.heroImage || visibleActivities[0]?.imagen || FALLBACK_IMAGE;
  const isPage = mode === "page";

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
          <>
            <div className="activities-hero reveal">
              <div className="activities-hero-copy">
                <span className="badge badge-gold">{editorial.eyebrow}</span>
                <h1 className="activities-hero-title">{editorial.title}</h1>
                <p className="activities-hero-subtitle">{editorial.subtitle}</p>
                <p className="activities-hero-intro">{editorial.intro}</p>
                <div className="activities-hero-actions">
                  <Link
                    className="btn btn-primary"
                    to={editorial.ctaTo || "/destinos"}
                  >
                    {editorial.ctaLabel}
                    <FaArrowRight className="inline-icon" aria-hidden="true" />
                  </Link>
                  <Link className="btn btn-outline" to="/informacion">
                    {t("pages.touristInfo")}
                  </Link>
                </div>
              </div>

              <div className="activities-hero-media">
                <img
                  src={heroImage}
                  alt={editorial.title}
                  loading="lazy"
                  decoding="async"
                />
                <div className="activities-quote-card">
                  <FaQuoteLeft
                    className="activities-quote-icon"
                    aria-hidden="true"
                  />
                  <p>{editorial.quote}</p>
                  <strong>{editorial.quoteAuthor}</strong>
                </div>
              </div>
            </div>

            <div className="activities-highlights reveal">
              <div className="activities-highlight-card">
                <span>Publicadas</span>
                <strong>{visibleActivities.length}</strong>
              </div>
              <div className="activities-highlight-card">
                <span>Experiencias editables</span>
                <strong>
                  {
                    new Set(
                      visibleActivities.map(
                        (item) => item.isla || "Santa Rosa",
                      ),
                    ).size
                  }
                </strong>
              </div>
              <div className="activities-highlight-card">
                <span>Portada editorial</span>
                <strong>CMS</strong>
              </div>
            </div>

            <div className="section-header reveal activities-section-header">
              <h2 className="section-title">
                <span className="accent">{t("pages.activities")}</span>
              </h2>
              <p className="section-subtitle">
                Todo lo que aparece aquí se administra desde el panel y se
                publica sin tocar el código.
              </p>
            </div>
          </>
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

        {!isPage && (
          <p className="activities-teaser-intro reveal">{editorial.intro}</p>
        )}

        <div
          className={
            isPage
              ? "activities-grid"
              : "activities-grid activities-grid-teaser"
          }
        >
          {(isPage ? visibleActivities : teaserActivities).map(
            (activity, index) => (
              <ActivityCard
                key={activity.id || `${activity.nombre}-${index}`}
                activity={activity}
                index={index}
              />
            ),
          )}
        </div>

        {isPage ? (
          <div className="activities-editorial-footer reveal">
            <p>
              La portada, el texto de apertura y cada tarjeta son editables
              desde el módulo de Actividades.
            </p>
            <Link className="btn btn-outline" to="/informacion">
              {t("footer.links.touristInfo")}
              <FaArrowRight className="inline-icon" aria-hidden="true" />
            </Link>
          </div>
        ) : (
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
