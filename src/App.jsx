import { lazy, Suspense, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/useAuth";
import { ContentProvider } from "./context/ContentContext";
import { LanguageProvider } from "./context/LanguageContext";
import { recordVisit } from "./services/visitCounter";
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const RegistroEditor = lazy(() => import("./pages/RegistroEditor"));
import Header from "./components/Header";
import Footer from "./components/Footer";


const InformacionTuristica = lazy(() => import("./pages/InformacionTuristica"));
const ActividadesPage = lazy(() => import("./pages/Actividades"));
const GastronomiaPage = lazy(() => import("./pages/Gastronomia"));
const HospedajePage = lazy(() => import("./pages/Hospedaje"));
const TransportePage = lazy(() => import("./pages/Transporte"));
const FloraFaunaPage = lazy(() => import("./pages/FloraFauna"));
const EventosPage = lazy(() => import("./pages/Eventos"));
const ContentDetailPage = lazy(() => import("./pages/ContentDetail"));
const GaleriaPage = lazy(() => import("./pages/Galeria"));
const ResenasPage = lazy(() => import("./pages/Resenas"));
const AdminLayout = lazy(() => import("./admin/AdminLayout"));
const loadingCrestSrc = `${import.meta.env.BASE_URL}escudo-vector-02-247x300.png`;

function AppLoading({ label = "Preparando tu visita a Santa Rosa..." }) {
  return (
    <div className="app-loading-screen" role="status" aria-live="polite">
      <div className="app-loading-card">
        <div className="app-loading-logo">
          <img
            src={loadingCrestSrc}
            alt="Escudo de Santa Rosa"
            width="72"
            height="88"
          />
        </div>
        <div className="app-loading-copy">
          <span>Visit Santa Rosa</span>
          <strong>{label}</strong>
        </div>
        <div className="app-loading-bar" aria-hidden="true">
          <span />
        </div>
      </div>
    </div>
  );
}

// Página genérica para subpáginas
function PageWrapper({ title, children }) {
  return (
    <>
      <Header />
      <div className="page-shell">
        <div className="page-banner">
          <h1 className="page-banner-title">{title}</h1>
        </div>
        <div className="container page-container">
          {children}
        </div>
      </div>
      <Footer />
    </>
  );
}


// Pantalla para cuentas autenticadas sin acceso al panel (p. ej. un editor
// cuya solicitud sigue pendiente de aprobación por el administrador).
function CuentaEnRevision() {
  const { user, logout } = useAuth();

  return (
    <div className="app-loading-screen" role="status" aria-live="polite">
      <div
        className="app-loading-card"
        style={{
          flexDirection: "column",
          textAlign: "center",
          gap: "1.1rem",
          maxWidth: "460px",
        }}
      >
        <div className="app-loading-logo">
          <img
            src={loadingCrestSrc}
            alt="Escudo de Santa Rosa"
            width="72"
            height="88"
          />
        </div>
        <div className="app-loading-copy" style={{ textAlign: "center" }}>
          <span>Visit Santa Rosa</span>
          <strong>Cuenta en revisión</strong>
        </div>
        <p style={{ color: "#475569", fontSize: "0.95rem", lineHeight: 1.55 }}>
          Hola{user?.displayName ? ` ${user.displayName}` : ""}, tu cuenta aún no
          tiene acceso al panel. Si te registraste como editor, podrás ingresar
          cuando el administrador valide tu RUC y apruebe tu solicitud.
        </p>
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <Link to="/" className="btn btn-outline">
            Volver al inicio
          </Link>
          <button type="button" className="btn btn-primary" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}

// Ruta protegida: solo admin/editor acceden al panel. Las cuentas sin permisos
// (visualizador / editor pendiente) inician sesión pero ven "Cuenta en revisión".
function PrivateRoute({ children }) {
  const { user, authReady, profileReady, canEditContent } = useAuth();

  if (!authReady || (user && !profileReady)) {
    return <AppLoading label="Verificando acceso al panel..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!canEditContent) {
    return <CuentaEnRevision />;
  }

  return children;
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

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return null;
}

function RevealObserver() {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      document
        .querySelectorAll(".reveal")
        .forEach((el) => el.classList.add("visible"));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
    );

    const observed = new WeakSet();
    const observeRevealElements = (root = document) => {
      root.querySelectorAll(".reveal").forEach((el) => {
        if (!observed.has(el)) {
          observed.add(el);
          observer.observe(el);
        }
      });
    };

    observeRevealElements();

    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;

          if (node.matches(".reveal") && !observed.has(node)) {
            observed.add(node);
            observer.observe(node);
          }

          observeRevealElements(node);
        });
      });
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      mutationObserver.disconnect();
      observer.disconnect();
    };
  }, []);

  return null;
}

function AppRoutes() {
  return (
    <Suspense
      fallback={<AppLoading />}
    >
      <ScrollToTop />
      <VisitTracker />
      <RevealObserver />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/gastronomia" element={<GastronomiaPage />} />
        <Route
          path="/gastronomia/:slug"
          element={<ContentDetailPage type="gastronomia" />}
        />
        <Route path="/hospedaje" element={<HospedajePage />} />
        <Route
          path="/hospedaje/:slug"
          element={<ContentDetailPage type="hospedaje" />}
        />
        <Route path="/transporte" element={<TransportePage />} />
        <Route
          path="/transporte/:slug"
          element={<ContentDetailPage type="transporte" />}
        />
        <Route path="/flora-fauna" element={<FloraFaunaPage />} />
        <Route
          path="/flora-fauna/:slug"
          element={<ContentDetailPage type="flora-fauna" />}
        />
        <Route path="/actividades" element={<ActividadesPage />} />
        <Route
          path="/actividades/:slug"
          element={<ContentDetailPage type="actividades" />}
        />
        <Route path="/eventos" element={<EventosPage />} />
        <Route
          path="/eventos/:slug"
          element={<ContentDetailPage type="eventos" />}
        />
        <Route path="/informacion" element={<InformacionTuristica />} />
        <Route path="/galeria" element={<GaleriaPage />} />
        <Route path="/resenas" element={<ResenasPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro-editor" element={<RegistroEditor />} />
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
