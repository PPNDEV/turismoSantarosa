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
  FaFileAlt,
  FaPenNib,
  FaUmbrellaBeach,
} from "react-icons/fa";
import { getDestinoIconComponent } from "./utils/destinoIcons";

const InformacionTuristica = lazy(() => import("./pages/InformacionTuristica"));
const ActividadesPage = lazy(() => import("./pages/Actividades"));
const GastronomiaPage = lazy(() => import("./pages/Gastronomia"));
const HospedajePage = lazy(() => import("./pages/Hospedaje"));
const TransportePage = lazy(() => import("./pages/Transporte"));
const FloraFaunaPage = lazy(() => import("./pages/FloraFauna"));
const EventosPage = lazy(() => import("./pages/Eventos"));
const GaleriaPage = lazy(() => import("./pages/Galeria"));
const AdminLayout = lazy(() => import("./admin/AdminLayout"));

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

// Pagina de Blog
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
        <Route path="/gastronomia" element={<GastronomiaPage />} />
        <Route path="/hospedaje" element={<HospedajePage />} />
        <Route path="/transporte" element={<TransportePage />} />
        <Route path="/flora-fauna" element={<FloraFaunaPage />} />
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
