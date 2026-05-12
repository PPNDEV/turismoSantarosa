import { useMemo, useState } from "react";
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaSearch } from "react-icons/fa";
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
  const [filters, setFilters] = useState({
    search: "",
    tipo: "todos",
    lugar: "todos",
    fecha: "todos",
  });

  const filterOptions = useMemo(() => {
    const tipos = [
      ...new Set(
        eventosActivos
          .map((evento) => evento.tipo)
          .filter(Boolean)
          .map((tipo) => tipo.trim()),
      ),
    ].sort((a, b) => a.localeCompare(b));
    const lugares = [
      ...new Set(
        eventosActivos
          .map((evento) => evento.lugar)
          .filter(Boolean)
          .map((lugar) => lugar.trim()),
      ),
    ].sort((a, b) => a.localeCompare(b));

    return { tipos, lugares };
  }, [eventosActivos]);

  const eventosFiltrados = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const search = filters.search.trim().toLowerCase();

    return eventosActivos.filter((evento) => {
      const matchesSearch =
        !search ||
        [evento.nombre, evento.descripcion, evento.tipo, evento.lugar]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(search);
      const matchesTipo =
        filters.tipo === "todos" || evento.tipo === filters.tipo;
      const matchesLugar =
        filters.lugar === "todos" || evento.lugar === filters.lugar;
      const timestamp = getEventTimestamp(evento.fecha);
      const matchesFecha =
        filters.fecha === "todos" ||
        (filters.fecha === "proximos" && timestamp >= today.getTime()) ||
        (filters.fecha === "pasados" && timestamp < today.getTime());

      return matchesSearch && matchesTipo && matchesLugar && matchesFecha;
    });
  }, [eventosActivos, filters]);

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      tipo: "todos",
      lugar: "todos",
      fecha: "todos",
    });
  };

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
          <section className="eventos-filter-panel" aria-label="Filtrar eventos">
            <div className="eventos-filter-header">
              <div>
                <h2>Filtrar eventos</h2>
                <p>Encuentra actividades por nombre, tipo, lugar o fecha.</p>
              </div>
              <button
                type="button"
                className="eventos-filter-clear"
                onClick={clearFilters}
              >
                Limpiar
              </button>
            </div>

            <div className="eventos-filter-grid">
              <label className="eventos-filter-field eventos-filter-search">
                <span>Buscar</span>
                <div className="eventos-search-box">
                  <FaSearch className="inline-icon" aria-hidden="true" />
                  <input
                    type="search"
                    value={filters.search}
                    onChange={(event) =>
                      updateFilter("search", event.target.value)
                    }
                    placeholder="Nombre, descripcion o lugar"
                  />
                </div>
              </label>

              <label className="eventos-filter-field">
                <span>Tipo</span>
                <select
                  value={filters.tipo}
                  onChange={(event) => updateFilter("tipo", event.target.value)}
                >
                  <option value="todos">Todos</option>
                  {filterOptions.tipos.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
              </label>

              <label className="eventos-filter-field">
                <span>Lugar</span>
                <select
                  value={filters.lugar}
                  onChange={(event) =>
                    updateFilter("lugar", event.target.value)
                  }
                >
                  <option value="todos">Todos</option>
                  {filterOptions.lugares.map((lugar) => (
                    <option key={lugar} value={lugar}>
                      {lugar}
                    </option>
                  ))}
                </select>
              </label>

              <label className="eventos-filter-field">
                <span>Fecha</span>
                <select
                  value={filters.fecha}
                  onChange={(event) =>
                    updateFilter("fecha", event.target.value)
                  }
                >
                  <option value="todos">Todas</option>
                  <option value="proximos">Proximos</option>
                  <option value="pasados">Pasados</option>
                </select>
              </label>
            </div>

            <p className="eventos-filter-count">
              {eventosFiltrados.length} de {eventosActivos.length} eventos
            </p>
          </section>

          {eventosActivos.length === 0 ? (
            <div className="eventos-empty">{t("eventsPage.emptyState")}</div>
          ) : eventosFiltrados.length === 0 ? (
            <div className="eventos-empty">
              No hay eventos que coincidan con los filtros seleccionados.
            </div>
          ) : (
            <div className="eventos-grid eventos-grid-page">
              {eventosFiltrados.map((ev) => {
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
