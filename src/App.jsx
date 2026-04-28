import { lazy, Suspense, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/useAuth";
import { ContentProvider } from "./context/ContentContext";
import { useContent } from "./context/useContent";
import { LanguageProvider } from "./context/LanguageContext";
import { useLanguage } from "./context/useLanguage";
import { recordVisit } from "./services/visitCounter";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Header from "./components/Header";
import Footer from "./components/Footer";
import {
  FaCalendarAlt,
  FaCamera,
  FaClock,
  FaFileAlt,
  FaMapMarkerAlt,
  FaPenNib,
  FaUmbrellaBeach,
} from "react-icons/fa";
import { getDestinoIconComponent } from "./utils/destinoIcons";

const InformacionTuristica = lazy(() => import("./pages/InformacionTuristica"));
const ActividadesPage = lazy(() => import("./pages/Actividades"));
const AdminLayout = lazy(() => import("./admin/AdminLayout"));

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

function formatBlogDate(fecha, locale) {
  const parsedDate = new Date(`${fecha || ""}T12:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return "-";
  }

  return parsedDate.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
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

// Página genérica para subpáginas
function PageWrapper({ title, children }) {
  return (
    <>
      <Header />
      <div style={{ paddingTop: "clamp(68px, 7vw, 80px)" }}>
        <div className="page-banner">
          <h1 className="page-banner-title">{title}</h1>
        </div>
        <div className="container" style={{ padding: "3rem 1.5rem" }}>
          {children}
        </div>
      </div>
      <Footer />
    </>
  );
}

// Página de Destinos
function DestinosPage() {
  const { destinos } = useContent();
  const { t } = useLanguage();

  return (
    <PageWrapper
      title={
        <>
          <FaUmbrellaBeach className="inline-icon" aria-hidden="true" />
          {t("pages.destinations")}
        </>
      }
    >
      <div className="destinos-grid">
        {destinos.map((d) => {
          const translatedName = getLocalizedValue(
            t,
            `content.destinations.${d.id}.name`,
            d.nombre,
          );
          const translatedDescription = getLocalizedValue(
            t,
            `content.destinations.${d.id}.description`,
            d.descripcion,
          );
          const translatedCategory = getLocalizedValue(
            t,
            `content.destinations.${d.id}.category`,
            d.categoria,
          );
          const translatedIsland = getLocalizedValue(
            t,
            `content.destinations.${d.id}.island`,
            d.isla || "Archipiélago de Jambelí",
          );
          const DestinoIcon = getDestinoIconComponent(d.icono);

          return (
            <div key={d.id} className="destino-card">
              <div style={{ overflow: "hidden" }}>
                <img src={d.imagen} alt={translatedName} />
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
    </PageWrapper>
  );
}

// Página de Eventos
function EventosPage() {
  const { eventos } = useContent();
  const { locale, t } = useLanguage();
  const eventosActivos = getVisibleEvents(eventos);
  const eventosConHorario = eventosActivos.filter(
    (evento) => evento.hora,
  ).length;

  return (
    <PageWrapper
      title={
        <>
          <FaCalendarAlt className="inline-icon" aria-hidden="true" />
          {t("pages.events")}
        </>
      }
    >
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
          {eventosActivos.map((ev) =>
            (() => {
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
                        {t("eventsPage.organizerLabel")}: {translatedOrganizer}
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
            })(),
          )}
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
    </PageWrapper>
  );
}

// Página de Galería
function GaleriaPage() {
  const { galeria } = useContent();
  const { t } = useLanguage();

  return (
    <PageWrapper
      title={
        <>
          <FaCamera className="inline-icon" aria-hidden="true" />
          {t("pages.gallery")}
        </>
      }
    >
      <div className="galeria-grid">
        {galeria.map((g) =>
          (() => {
            const translatedTitle = getLocalizedValue(
              t,
              `content.gallery.${g.id}.title`,
              g.titulo,
            );

            return (
              <div key={g.id} className="galeria-item">
                <img src={g.url} alt={translatedTitle} loading="lazy" />
                <div className="galeria-overlay">
                  <span>{translatedTitle}</span>
                </div>
              </div>
            );
          })(),
        )}
      </div>
    </PageWrapper>
  );
}

// Página de Blog
function BlogPage() {
  const { blog } = useContent();
  const { locale, t } = useLanguage();

  return (
    <PageWrapper
      title={
        <>
          <FaFileAlt className="inline-icon" aria-hidden="true" />
          {t("pages.blog")}
        </>
      }
    >
      <div className="blog-grid">
        {blog.map((art) =>
          (() => {
            const translatedTitle = getLocalizedValue(
              t,
              `content.blog.${art.id}.title`,
              art.titulo,
            );
            const translatedSummary = getLocalizedValue(
              t,
              `content.blog.${art.id}.summary`,
              art.resumen,
            );
            const translatedCategory = getLocalizedValue(
              t,
              `content.blog.${art.id}.category`,
              art.categoria,
            );
            const translatedAuthor = getLocalizedValue(
              t,
              `content.blog.${art.id}.author`,
              art.autor,
            );

            return (
              <div key={art.id} className="blog-card">
                <img src={art.imagen} alt={translatedTitle} />
                <div className="blog-body">
                  <div className="blog-meta">
                    <span className="badge badge-ocean">
                      {translatedCategory}
                    </span>
                    <span
                      style={{ fontSize: "0.78rem", color: "var(--gray-400)" }}
                    >
                      {formatBlogDate(art.fecha, locale)}
                    </span>
                  </div>
                  <h3>{translatedTitle}</h3>
                  <p>{translatedSummary}</p>
                </div>
                <div className="blog-footer">
                  <span
                    style={{ fontSize: "0.82rem", color: "var(--gray-400)" }}
                  >
                    <FaPenNib className="inline-icon" aria-hidden="true" />
                    {translatedAuthor}
                  </span>
                </div>
              </div>
            );
          })(),
        )}
      </div>
    </PageWrapper>
  );
}

// Ruta protegida
function PrivateRoute({ children }) {
  const { user, authReady } = useAuth();

  if (!authReady) {
    return (
      <div className="container" style={{ padding: "4rem 1.5rem" }}>
        Verificando acceso...
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}

function VisitTracker() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.startsWith("/admin")) {
      return;
    }

    void recordVisit(location.pathname).catch(() => {
      // Si falla el contador, no bloqueamos la navegación.
    });
  }, [location.pathname]);

  return null;
}

function AppRoutes() {
  return (
    <Suspense
      fallback={
        <div className="container" style={{ padding: "4rem 1.5rem" }}>
          Cargando contenido...
        </div>
      }
    >
      <VisitTracker />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/destinos" element={<DestinosPage />} />
        <Route path="/actividades" element={<ActividadesPage />} />
        <Route path="/eventos" element={<EventosPage />} />
        <Route path="/informacion" element={<InformacionTuristica />} />
        <Route path="/galeria" element={<GaleriaPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/admin/*"
          element={
            <PrivateRoute>
              <AdminLayout />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <ContentProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </ContentProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
