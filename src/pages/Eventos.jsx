import { FaCalendarAlt, FaClock, FaMapMarkerAlt } from "react-icons/fa";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useContent } from "../context/useContent";
import { useLanguage } from "../context/useLanguage";

const FALLBACK_EVENT_IMAGE =
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=900";

function getEventTimestamp(fecha) {
  const parsedDate = new Date(`${fecha || ""}T12:00:00`);
  const timestamp = parsedDate.getTime();
  return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp;
}

function formatEventDate(fecha, locale, t) {
  const parsedDate = new Date(`${fecha || ""}T12:00:00`);
  if (Number.isNaN(parsedDate.getTime())) {
    return t("eventsPage.dateToConfirm");
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

function getLocalizedValue(t, key, fallback) {
  const translated = t(key);
  return translated === key ? fallback : translated;
}

export default function EventosPage() {
  const { eventos } = useContent();
  const { locale, t } = useLanguage();
  const eventosActivos = getVisibleEvents(eventos);
  const eventosConHorario = eventosActivos.filter(
    (evento) => evento.hora,
  ).length;

  return (
    <>
      <Header />
      <div className="page-shell">
        <div className="page-banner">
          <h1 className="page-banner-title">
            <FaCalendarAlt className="inline-icon" aria-hidden="true" />
            {t("pages.events")}
          </h1>
        </div>

        <main className="container page-container">
          <div className="eventos-info-intro">
            <h2>{t("eventsPage.planningTitle")}</h2>
            <p>{t("eventsPage.planningDescription")}</p>
            <div className="eventos-info-pills">
              <div className="eventos-info-pill">
                <strong>{eventosActivos.length}</strong>
                <span>{t("eventsPage.publishedEvents")}</span>
              </div>
              <div className="eventos-info-pill">
                <strong>{eventosConHorario}</strong>
                <span>{t("eventsPage.withConfirmedTime")}</span>
              </div>
              <div className="eventos-info-pill">
                <strong>
                  {new Set(eventosActivos.map((evento) => evento.lugar)).size}
                </strong>
                <span>{t("eventsPage.registeredPlaces")}</span>
              </div>
            </div>
          </div>

          {eventosActivos.length === 0 ? (
            <div className="eventos-empty">{t("eventsPage.emptyState")}</div>
          ) : (
            <div className="eventos-grid eventos-grid-page">
              {eventosActivos.map((ev) => {
                const translatedType = getLocalizedValue(
                  t,
                  `content.events.${ev.id}.type`,
                  ev.tipo,
                );
                const translatedName = getLocalizedValue(
                  t,
                  `content.events.${ev.id}.name`,
                  ev.nombre,
                );
                const translatedDescription = getLocalizedValue(
                  t,
                  `content.events.${ev.id}.description`,
                  ev.descripcion,
                );
                const translatedPlace = getLocalizedValue(
                  t,
                  `content.events.${ev.id}.place`,
                  ev.lugar,
                );
                const translatedOrganizer = getLocalizedValue(
                  t,
                  `content.events.${ev.id}.organizer`,
                  ev.organizador,
                );

                return (
                  <div key={ev.id} className="evento-card">
                    <img
                      src={getEventImage(ev.imagen)}
                      alt={translatedName}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        if (e.currentTarget.src !== FALLBACK_EVENT_IMAGE) {
                          e.currentTarget.src = FALLBACK_EVENT_IMAGE;
                        }
                      }}
                    />
                    <div className="evento-body">
                      <div className="evento-chip">
                        {translatedType || t("eventsPage.defaultType")}
                      </div>
                      <div className="evento-fecha">
                        <FaCalendarAlt
                          className="inline-icon"
                          aria-hidden="true"
                        />
                        {formatEventDate(ev.fecha, locale, t)}
                      </div>
                      <h3>{translatedName}</h3>
                      <p>{translatedDescription}</p>
                      <div className="evento-meta-grid">
                        <div className="evento-lugar">
                          <FaMapMarkerAlt
                            className="inline-icon"
                            aria-hidden="true"
                          />
                          {translatedPlace || t("eventsPage.placeToConfirm")}
                        </div>
                        <div className="evento-lugar">
                          <FaClock className="inline-icon" aria-hidden="true" />
                          {ev.hora || t("eventsPage.timeToConfirm")}
                        </div>
                      </div>
                      {translatedOrganizer && (
                        <div className="evento-extra">
                          {t("eventsPage.organizerLabel")}:{" "}
                          {translatedOrganizer}
                        </div>
                      )}
                      {ev.contacto && (
                        <div className="evento-extra">
                          {t("eventsPage.contactLabel")}: {ev.contacto}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="eventos-note-card">
            <h3>{t("eventsPage.noteTitle")}</h3>
            <ul>
              <li>{t("eventsPage.noteItem1")}</li>
              <li>{t("eventsPage.noteItem2")}</li>
              <li>{t("eventsPage.noteItem3")}</li>
            </ul>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}
