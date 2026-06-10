import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaBinoculars,
  FaCamera,
  FaFish,
  FaLeaf,
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
  eyebrow: "Bienvenidos a Santa Rosa",
  title: "¡Santa Rosa, te enamora!",
  subtitle:
    "Santa Rosa, ciudad Benemérita del Ecuador, perteneciente a la provincia de El Oro, es reconocida a nivel nacional e internacional por ser pionera en el cultivo del camarón en cautiverio.",
  intro: `Tierra de encantos naturales y culturales que invita a propios y extraños a adentrarse en un sinfín de emociones: descubrir la calidad y calidez de su gente, perdiéndose entre ríos, cascadas, playas, mares y atardeceres deslumbrantes.

Puerto Jelí, parroquia urbana y emblema turístico del cantón, cosecha y prepara el marisco más fresco y delicioso —del mar a su mesa—, lo que le ha valido el reconocimiento como Destino Gastronómico del Sur del Ecuador.

Nuestras parroquias rurales, como La Avanzada, tierra productiva poseedora de un mágico encanto, bordeada de ríos y cascadas, invitan a deleitarse con la más exquisita comida criolla; mientras las islas del Archipiélago de Jambelí, rinconcitos mágicos, reciben a sus visitantes con turismo de sol y playa, ecoturismo, aventura, turismo comunitario, gastronómico y cultural.

Porque donde llueve turismo, llueven oportunidades, te invitamos a descubrir Santa Rosa.`,
};

function getIntroParagraphs(intro) {
  return String(intro || "")
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function buildFallbackActivities(t) {
  return [
    {
      icon: FaUmbrellaBeach,
      nombre: t("queHacer.activities.beach.name"),
      descripcion: t("queHacer.activities.beach.desc"),
      isla: "Jambeli",
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
  const Icon = typeof activity.icon === "function" ? activity.icon : FaCamera;

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
  const content = useContent() || {};
  const actividades = Array.isArray(content.actividades)
    ? content.actividades
    : [];
  const actividadesEditorial = Array.isArray(content.actividadesEditorial)
    ? content.actividadesEditorial
    : [];

  const editorial = {
    ...DEFAULT_EDITORIAL,
    ...(actividadesEditorial[0] || {}),
  };
  const fallbackActivities = buildFallbackActivities(t);
  const visibleActivities =
    actividades.length > 0 ? actividades : fallbackActivities;
  const teaserActivities = visibleActivities.slice(0, 4);
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

        {!isPage && (
          <div className="activities-teaser-intro reveal">
            {getIntroParagraphs(editorial.intro).map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
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

        {!isPage && (
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
