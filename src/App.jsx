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
import { LanguageProvider } from "./context/LanguageContext";
import { recordVisit } from "./services/visitCounter";
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
import Header from "./components/Header";
import Footer from "./components/Footer";


const InformacionTuristica = lazy(() => import("./pages/InformacionTuristica"));
const ActividadesPage = lazy(() => import("./pages/Actividades"));
const GastronomiaPage = lazy(() => import("./pages/Gastronomia"));
const HospedajePage = lazy(() => import("./pages/Hospedaje"));
const TransportePage = lazy(() => import("./pages/Transporte"));
const FloraFaunaPage = lazy(() => import("./pages/FloraFauna"));
const EventosPage = lazy(() => import("./pages/Eventos"));
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


// Ruta protegida
function PrivateRoute({ children }) {
  const { user, authReady } = useAuth();

  if (!authReady) {
    return <AppLoading label="Verificando acceso al panel..." />;
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
      <VisitTracker />
      <RevealObserver />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/gastronomia" element={<GastronomiaPage />} />
        <Route path="/hospedaje" element={<HospedajePage />} />
        <Route path="/transporte" element={<TransportePage />} />
        <Route path="/flora-fauna" element={<FloraFaunaPage />} />
        <Route path="/actividades" element={<ActividadesPage />} />
        <Route path="/eventos" element={<EventosPage />} />
        <Route path="/informacion" element={<InformacionTuristica />} />
        <Route path="/galeria" element={<GaleriaPage />} />
        <Route path="/resenas" element={<ResenasPage />} />
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
