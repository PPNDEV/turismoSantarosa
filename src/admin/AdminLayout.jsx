import { lazy, Suspense, useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaBed,
  FaCalendarAlt,
  FaCamera,
  FaChartBar,
  FaChartPie,
  FaClipboardCheck,
  FaCommentDots,
  FaEnvelope,
  FaGlobe,
  FaHiking,
  FaImage,
  FaInbox,
  FaLeaf,
  FaShip,
  FaStore,
  FaUserShield,
  FaUtensils,
} from "react-icons/fa";
import { useAuth } from "../context/useAuth";
const AdminPortada = lazy(() => import("../admin/AdminPortada"));
const AdminDashboard = lazy(() => import("../admin/AdminDashboard"));
const AdminEventos = lazy(() => import("../admin/AdminEventos"));
const AdminGaleria = lazy(() => import("../admin/AdminGaleria"));
const AdminGastronomia = lazy(() => import("../admin/AdminGastronomia"));
const AdminHospedajes = lazy(() => import("../admin/AdminHospedajes"));
const AdminFloraFauna = lazy(() => import("../admin/AdminFloraFauna"));
const AdminUsuarios = lazy(() => import("../admin/AdminUsuarios"));
const AdminActividades = lazy(() => import("../admin/AdminActividades"));
const AdminTransporte = lazy(() => import("../admin/AdminTransporte"));
const AdminMensajes = lazy(() => import("../admin/AdminMensajes"));
const AdminEncuestas = lazy(() => import("../admin/AdminEncuestas"));
const AdminResenas = lazy(() => import("../admin/AdminResenas"));
const AdminSolicitudes = lazy(() => import("../admin/AdminSolicitudes"));
const AdminEditores = lazy(() => import("../admin/AdminEditores"));
const AdminModeracion = lazy(() => import("../admin/AdminModeracion"));

const RECENT_SIDEBAR_SECTIONS_KEY = "adminRecentSidebarSections";
const MAX_RECENT_SIDEBAR_SECTIONS = 5;
const adminCrestSrc = `${import.meta.env.BASE_URL}escudo-santa-rosa.png`;

const menuItems = [
  {
    key: "dashboard",
    icon: FaChartBar,
    label: "Dashboard",
    title: "Dashboard",
    previewPath: "/",
    description: "Resumen general del contenido y accesos rápidos.",
  },
  {
    key: "portada",
    icon: FaImage,
    label: "Portada",
    title: "Portada",
    previewPath: "/",
    description: "Edita hero slides, orden y llamados a la acción.",
  },
  {
    key: "actividades",
    icon: FaHiking,
    label: "Actividades",
    title: "Actividades Turísticas",
    previewPath: "/actividades",
    description:
      "Edita la portada editorial y el listado de actividades turísticas.",
  },
  {
    key: "eventos",
    icon: FaCalendarAlt,
    label: "Eventos",
    title: "Gestión de Eventos",
    previewPath: "/eventos",
    description: "Publica, oculta y actualiza eventos informativos.",
  },
  {
    key: "gastronomia",
    icon: FaUtensils,
    label: "Gastronomía",
    title: "Restaurantes y Gastronomía",
    previewPath: "/informacion#gastronomia",
    description:
      "Registra platos típicos y restaurantes en las islas del archipiélago.",
  },
  {
    key: "hospedajes",
    icon: FaBed,
    label: "Hospedajes",
    title: "Hospedajes",
    previewPath: "/informacion#hospedajes",
    description: "Administra alojamientos con ubicación, servicios y contacto.",
  },
  {
    key: "floraFauna",
    icon: FaLeaf,
    label: "Flora y Fauna",
    title: "Flora y Fauna",
    previewPath: "/informacion#flora-fauna",
    description:
      "Publica especies, zonas de observación y estado de conservación.",
  },
  {
    key: "transporte",
    icon: FaShip,
    label: "Transporte",
    title: "Transporte Fluvial",
    previewPath: "/informacion#transporte",
    description:
      "Administra rutas fluviales, frecuencias y muelles de salida/llegada.",
  },
  {
    key: "galeria",
    icon: FaCamera,
    label: "Galería",
    title: "Galería",
    previewPath: "/galeria",
    description: "Carga imágenes y actualiza la galería visual pública.",
  },
  {
    key: "mensajes",
    icon: FaEnvelope,
    label: "Mensajes",
    title: "Mensajes de Contacto",
    previewPath: "/admin",
    description: "Consulta mensajes enviados por los visitantes del sitio.",
  },
  {
    key: "encuestas",
    icon: FaChartPie,
    label: "Encuestas",
    title: "Encuestas de Satisfacción",
    previewPath: "/admin",
    description: "Visualiza puntuaciones y comentarios de los visitantes.",
  },
  {
    key: "resenas",
    icon: FaCommentDots,
    label: "Reseñas",
    title: "Moderacion de Reseñas",
    previewPath: "/resenas",
    description:
      "Aprueba o rechaza opiniones publicas de islas, establecimientos y atractivos.",
  },
  {
    key: "moderacion",
    icon: FaClipboardCheck,
    label: "Moderación",
    title: "Moderación de Publicaciones",
    previewPath: "/admin",
    description:
      "Aprueba o rechaza las publicaciones enviadas por los editores.",
    requiresEditor: true,
  },
  {
    key: "usuarios",
    icon: FaUserShield,
    label: "Usuarios",
    title: "Usuarios y Roles",
    previewPath: "/admin",
    description:
      "Crea usuarios y asigna permisos: administrador, editor y visualizador.",
    requiresAdmin: true,
  },
  {
    key: "solicitudes",
    icon: FaInbox,
    label: "Solicitudes",
    title: "Bandeja de Entrada",
    previewPath: "/admin",
    description:
      "Modera y aprueba las solicitudes de nuevos negocios turísticos.",
    requiresAdmin: true,
  },
  {
    key: "editores",
    icon: FaStore,
    label: "Editores",
    title: "Solicitudes de Editor",
    previewPath: "/admin",
    description:
      "Valida el RUC de comerciantes y activa sus cuentas de editor.",
    requiresAdmin: true,
  },
];

function getStoredRecentSidebarSections() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedSections = JSON.parse(
      window.localStorage.getItem(RECENT_SIDEBAR_SECTIONS_KEY) || "[]",
    );
    if (!Array.isArray(storedSections)) {
      return [];
    }

    const validKeys = new Set(menuItems.map((item) => item.key));
    return storedSections
      .filter((sectionKey) => validKeys.has(sectionKey) && sectionKey !== "dashboard")
      .slice(0, MAX_RECENT_SIDEBAR_SECTIONS);
  } catch {
    return [];
  }
}

function persistRecentSidebarSections(sectionKeys) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      RECENT_SIDEBAR_SECTIONS_KEY,
      JSON.stringify(sectionKeys),
    );
  } catch {
    // localStorage puede estar bloqueado en algunos navegadores.
  }
}

function getRoleLabel(role) {
  switch (role) {
    case "administrador":
      return "Administrador";
    case "editor":
      return "Editor";
    case "visualizador":
      return "Visualizador";
    default:
      return "Sin rol";
  }
}

export default function AdminLayout() {
  const [active, setActive] = useState("dashboard");
  const [, setLivePreview] = useState(null);
  const [dirtySections, setDirtySections] = useState({});
  const [recentSidebarSections, setRecentSidebarSections] = useState(
    getStoredRecentSidebarSections,
  );
  const { user, logout, canEditContent, canManageUsers } = useAuth();
  const navigate = useNavigate();

  const activeItem = useMemo(
    () => menuItems.find((item) => item.key === active) || menuItems[0],
    [active],
  );

  const rememberSidebarSection = (sectionKey) => {
    if (sectionKey === "dashboard") {
      return;
    }

    setRecentSidebarSections((previousSections) => {
      const nextSections = [
        sectionKey,
        ...previousSections.filter((key) => key !== sectionKey),
      ].slice(0, MAX_RECENT_SIDEBAR_SECTIONS);

      persistRecentSidebarSections(nextSections);
      return nextSections;
    });
  };

  const handleSelectSection = (nextSection, options = {}) => {
    const nextItem = menuItems.find((item) => item.key === nextSection);
    if (nextItem?.requiresAdmin && !canManageUsers) {
      return;
    }
    if (nextItem?.requiresEditor && !canEditContent) {
      return;
    }

    if (nextSection === active) {
      if (options.trackRecent) {
        rememberSidebarSection(nextSection);
      }
      return;
    }

    if (hasDirtyChanges) {
      const targetLabel = nextItem?.label || nextSection;
      const dirtyLabels = dirtyModules.map((item) => item.label).join(", ");
      const shouldContinue = confirm(
        `Tienes cambios sin guardar en: ${dirtyLabels}. ¿Deseas salir y abrir ${targetLabel}?`,
      );

      if (!shouldContinue) {
        return;
      }
    }

    setActive(nextSection);
    if (options.trackRecent) {
      rememberSidebarSection(nextSection);
    }
    setLivePreview(null);
  };

  const handleLivePreviewChange = useCallback((nextPreview) => {
    setLivePreview(nextPreview);
  }, []);

  const handleDirtySectionChange = useCallback((sectionKey, isDirty) => {
    setDirtySections((previous) => {
      if (previous[sectionKey] === isDirty) {
        return previous;
      }
      return { ...previous, [sectionKey]: isDirty };
    });
  }, []);

  const dirtyChangeHandlers = useMemo(
    () => ({
      portada: (isDirty) => handleDirtySectionChange("portada", isDirty),
      actividades: (isDirty) =>
        handleDirtySectionChange("actividades", isDirty),
      eventos: (isDirty) => handleDirtySectionChange("eventos", isDirty),
      gastronomia: (isDirty) =>
        handleDirtySectionChange("gastronomia", isDirty),
      hospedajes: (isDirty) => handleDirtySectionChange("hospedajes", isDirty),
      floraFauna: (isDirty) => handleDirtySectionChange("floraFauna", isDirty),
      transporte: (isDirty) => handleDirtySectionChange("transporte", isDirty),
      galeria: (isDirty) => handleDirtySectionChange("galeria", isDirty),
      mensajes: (isDirty) => handleDirtySectionChange("mensajes", isDirty),
      encuestas: (isDirty) => handleDirtySectionChange("encuestas", isDirty),
      resenas: (isDirty) => handleDirtySectionChange("resenas", isDirty),
      usuarios: (isDirty) => handleDirtySectionChange("usuarios", isDirty),
      solicitudes: (isDirty) => handleDirtySectionChange("solicitudes", isDirty),
    }),
    [handleDirtySectionChange],
  );

  const dirtyModules = menuItems.filter((item) =>
    Boolean(dirtySections[item.key]),
  );

  const hasDirtyChanges = dirtyModules.length > 0;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const renderContent = () => {
    switch (active) {
      case "dashboard":
        return (
          <AdminDashboard
            onNavigateSection={handleSelectSection}
            canEditContent={canEditContent}
            canManageUsers={canManageUsers}
            recentSectionKeys={recentSidebarSections}
            currentUser={user}
          />
        );
      case "portada":
        return (
          <AdminPortada
            canEdit={canEditContent}
            currentUser={user}
            onLivePreviewChange={handleLivePreviewChange}
            onDirtyChange={dirtyChangeHandlers.portada}
          />
        );
      case "actividades":
        return (
          <AdminActividades
            canEdit={canEditContent}
            currentUser={user}
            onLivePreviewChange={handleLivePreviewChange}
            onDirtyChange={dirtyChangeHandlers.actividades}
          />
        );
      case "eventos":
        return (
          <AdminEventos
            canEdit={canEditContent}
            currentUser={user}
            onLivePreviewChange={handleLivePreviewChange}
            onDirtyChange={dirtyChangeHandlers.eventos}
          />
        );
      case "gastronomia":
        return (
          <AdminGastronomia
            canEdit={canEditContent}
            currentUser={user}
            onLivePreviewChange={handleLivePreviewChange}
            onDirtyChange={dirtyChangeHandlers.gastronomia}
          />
        );
      case "hospedajes":
        return (
          <AdminHospedajes
            canEdit={canEditContent}
            currentUser={user}
            onLivePreviewChange={handleLivePreviewChange}
            onDirtyChange={dirtyChangeHandlers.hospedajes}
          />
        );
      case "floraFauna":
        return (
          <AdminFloraFauna
            canEdit={canEditContent}
            currentUser={user}
            onLivePreviewChange={handleLivePreviewChange}
            onDirtyChange={dirtyChangeHandlers.floraFauna}
          />
        );
      case "transporte":
        return (
          <AdminTransporte
            canEdit={canEditContent}
            currentUser={user}
            onLivePreviewChange={handleLivePreviewChange}
            onDirtyChange={dirtyChangeHandlers.transporte}
          />
        );
      case "galeria":
        return (
          <AdminGaleria
            canEdit={canEditContent}
            currentUser={user}
            onLivePreviewChange={handleLivePreviewChange}
            onDirtyChange={dirtyChangeHandlers.galeria}
          />
        );
      case "mensajes":
        return (
          <AdminMensajes
            onLivePreviewChange={handleLivePreviewChange}
            onDirtyChange={dirtyChangeHandlers.mensajes}
          />
        );
      case "encuestas":
        return (
          <AdminEncuestas
            onLivePreviewChange={handleLivePreviewChange}
            onDirtyChange={dirtyChangeHandlers.encuestas}
          />
        );
      case "resenas":
        return (
          <AdminResenas
            onLivePreviewChange={handleLivePreviewChange}
            onDirtyChange={dirtyChangeHandlers.resenas}
          />
        );
      case "usuarios":
        return (
          <AdminUsuarios
            onLivePreviewChange={handleLivePreviewChange}
            onDirtyChange={dirtyChangeHandlers.usuarios}
          />
        );
      case "solicitudes":
        return (
          <AdminSolicitudes
            onLivePreviewChange={handleLivePreviewChange}
          />
        );
      case "editores":
        return (
          <AdminEditores onLivePreviewChange={handleLivePreviewChange} />
        );
      case "moderacion":
        return (
          <AdminModeracion
            currentUser={user}
            onLivePreviewChange={handleLivePreviewChange}
          />
        );
      default:
        return (
          <AdminDashboard
            onNavigateSection={handleSelectSection}
            canEditContent={canEditContent}
            canManageUsers={canManageUsers}
            recentSectionKeys={recentSidebarSections}
            currentUser={user}
          />
        );
    }
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <span className="sidebar-crest">
              <img src={adminCrestSrc} alt="Escudo de Santa Rosa" />
            </span>
            <div className="sidebar-brand-text">
              <h2>Visit Santa Rosa</h2>
              <p>Panel de Administración</p>
            </div>
          </div>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const isLocked =
              (item.requiresAdmin && !canManageUsers) ||
              (item.requiresEditor && !canEditContent);

            return (
              <button
                key={item.key}
                className={`sidebar-nav-item ${active === item.key ? "active" : ""} ${isLocked ? "is-disabled" : ""}`}
                onClick={() => handleSelectSection(item.key, { trackRecent: true })}
                disabled={isLocked}
                title={
                  isLocked ? "Solo disponible para administradores" : undefined
                }
              >
                <span>
                  <item.icon aria-hidden="true" />
                </span>
                <span className="sidebar-nav-label">{item.label}</span>
                {isLocked && <span className="admin-lock-label">Admin</span>}
                {dirtySections[item.key] && (
                  <span
                    className="admin-dirty-dot"
                    title="Cambios sin guardar"
                    aria-label="Cambios sin guardar"
                  />
                )}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <div className="admin-user-card">
            <span className="admin-user-avatar">
              {(user?.displayName || user?.email || "?")
                .charAt(0)
                .toUpperCase()}
            </span>
            <div className="admin-user-card-info">
              <strong>{user?.displayName || user?.email}</strong>
              <span>{getRoleLabel(user?.role)}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-outline admin-sidebar-btn"
          >
            Cerrar Sesión
          </button>
          <button
            onClick={() => navigate("/")}
            className="btn admin-sidebar-btn admin-sidebar-secondary"
          >
            <FaArrowLeft className="inline-icon" aria-hidden="true" />
            Ver Sitio
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="admin-main">
        <div className="admin-topbar">
          <div className="admin-topbar-heading">
            <span className="admin-topbar-icon" aria-hidden="true">
              <activeItem.icon />
            </span>
            <div className="admin-topbar-heading-text">
            <h1>{activeItem.title}</h1>
            {!canEditContent && (
              <p className="admin-topbar-subtext">
                Modo visualizador: puedes navegar el panel sin permisos de
                edición.
              </p>
            )}
            <p className="admin-role-pill">
              Rol activo: {getRoleLabel(user?.role)}
            </p>
            <p
              className={`admin-unsaved-status ${hasDirtyChanges ? "is-dirty" : "is-clean"}`}
            >
              {hasDirtyChanges
                ? `Cambios sin guardar en: ${dirtyModules.map((item) => item.label).join(", ")}.`
                : "No hay cambios sin guardar."}
            </p>
            </div>
          </div>

          <div className="admin-topbar-actions">
            <button
              className="btn btn-primary admin-topbar-btn"
              onClick={() => navigate("/")}
            >
              <FaGlobe className="inline-icon" aria-hidden="true" />
              Ver Sitio Completo
            </button>
          </div>
        </div>

        <div className="admin-workspace">
          <div className="admin-content">
            <Suspense
              fallback={
                <div className="admin-loading">Cargando modulo...</div>
              }
            >
              {renderContent()}
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
