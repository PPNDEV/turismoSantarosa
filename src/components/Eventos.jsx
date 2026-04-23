import { useMemo } from "react";
import { Link } from "react-router-dom";
import { FaCalendarAlt, FaMapMarkerAlt } from "react-icons/fa";
import { useContent } from "../context/useContent";
import { useLanguage } from "../context/useLanguage";

const FALLBACK_EVENT_IMAGE =
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=900";

function getEventTimestamp(fecha) {
  const parsedDate = new Date(`${fecha || ""}T12:00:00`);
  const timestamp = parsedDate.getTime();
  return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp;
}

function formatFecha(fecha, locale, t) {
  const parsedDate = new Date(`${fecha || ""}T12:00:00`);
  if (Number.isNaN(parsedDate.getTime())) {
    return t("eventosSection.dateToConfirm");
  }

  return parsedDate.toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getVisibleEvents(eventos) {
  return [...eventos]
    .filter((evento) => evento.activo !== false)
    .sort((a, b) => getEventTimestamp(a.fecha) - getEventTimestamp(b.fecha));
}

function getEventImage(imagen) {
  return imagen && imagen.trim() ? imagen : FALLBACK_EVENT_IMAGE;
}

export default function Eventos() {
  const { eventos } = useContent();
  const { locale, t } = useLanguage();
  const proximos = useMemo(
    () => getVisibleEvents(eventos).slice(0, 4),
    [eventos],
  );

  const getLocalizedValue = (key, fallback) => {
    const translated = t(key);
    return translated === key ? fallback : translated;
  };

  return (
    <section style={{ background: "var(--gray-50)" }}>
      <div className="container">
        <div className="section-header reveal">
          <h2 className="section-title">
            {t("eventosSection.titleStart")}{" "}
            <span className="accent">{t("eventosSection.titleAccent")}</span>
          </h2>
          <p className="section-subtitle">{t("eventosSection.subtitle")}</p>
        </div>

        {proximos.length === 0 ? (
          <div className="eventos-empty">{t("eventosSection.emptyState")}</div>
        ) : (
          <div className="eventos-grid">
            {proximos.map((ev) =>
              (() => {
                const translatedType = getLocalizedValue(
                  `content.events.${ev.id}.type`,
                  ev.tipo,
                );
                const translatedName = getLocalizedValue(
                  `content.events.${ev.id}.name`,
                  ev.nombre,
                );
                const translatedDescription = getLocalizedValue(
                  `content.events.${ev.id}.description`,
                  ev.descripcion,
                );
                const translatedPlace = getLocalizedValue(
                  `content.events.${ev.id}.place`,
                  ev.lugar,
                );

                return (
                  <div key={ev.id} className="evento-card reveal">
                    <img
                      src={getEventImage(ev.imagen)}
                      alt={translatedName}
                      onError={(e) => {
                        if (e.currentTarget.src !== FALLBACK_EVENT_IMAGE) {
                          e.currentTarget.src = FALLBACK_EVENT_IMAGE;
                        }
                      }}
                    />
                    <div className="evento-body">
                      <div className="evento-chip">
                        {translatedType || t("eventosSection.defaultType")}
                      </div>
                      <div className="evento-fecha">
                        <FaCalendarAlt
                          className="inline-icon"
                          aria-hidden="true"
                        />
                        {formatFecha(ev.fecha, locale, t)}
                      </div>
                      <h3>{translatedName}</h3>
                      <p>{translatedDescription}</p>
                      <div className="evento-lugar">
                        <FaMapMarkerAlt
                          className="inline-icon"
                          aria-hidden="true"
                        />
                        {translatedPlace}
                      </div>
                    </div>
                  </div>
                );
              })(),
            )}
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
          <Link to="/eventos" className="btn btn-primary">
            {t("eventosSection.cta")} →
          </Link>
        </div>
      </div>
    </section>
  );
}
