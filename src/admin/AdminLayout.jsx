import { lazy, Suspense, useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaBed,
  FaCalendarAlt,
  FaCamera,
  FaChartBar,
  FaChartPie,
  FaEnvelope,
  FaGlobe,
  FaHiking,
  FaImage,
  FaInbox,
  FaLeaf,
  FaMapMarkerAlt,
  FaRoute,
  FaShip,
  FaUser,
  FaUserShield,
  FaUtensils,
} from "react-icons/fa";
import { useAuth } from "../context/useAuth";
const AdminPortada = lazy(() => import("../admin/AdminPortada"));
const AdminDashboard = lazy(() => import("../admin/AdminDashboard"));
const AdminEventos = lazy(() => import("../admin/AdminEventos"));
const AdminDestinos = lazy(() => import("../admin/AdminDestinos"));
const AdminGaleria = lazy(() => import("../admin/AdminGaleria"));
const AdminGastronomia = lazy(() => import("../admin/AdminGastronomia"));
const AdminHospedajes = lazy(() => import("../admin/AdminHospedajes"));
const AdminFloraFauna = lazy(() => import("../admin/AdminFloraFauna"));
const AdminUsuarios = lazy(() => import("../admin/AdminUsuarios"));
const AdminActividades = lazy(() => import("../admin/AdminActividades"));
const AdminTransporte = lazy(() => import("../admin/AdminTransporte"));
const AdminComoLlegar = lazy(() => import("../admin/AdminComoLlegar"));
const AdminMensajes = lazy(() => import("../admin/AdminMensajes"));
const AdminEncuestas = lazy(() => import("../admin/AdminEncuestas"));
const AdminSolicitudes = lazy(() => import("../admin/AdminSolicitudes"));

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
    key: "destinos",
    icon: FaMapMarkerAlt,
    label: "Destinos",
    title: "Destinos Turísticos",
    previewPath: "/destinos",
    description: "Gestiona destinos, categorías y textos de promoción.",
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
    key: "comoLlegar",
    icon: FaRoute,
    label: "Como Llegar",
    title: "Como Llegar",
    previewPath: "/#como-llegar",
    description:
      "Edita las tres tarjetas de conectividad de la pagina principal.",
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
];

function openSite(path) {
  if (typeof window === "undefined") {
    return;
  }
  window.open(path, "_blank", "noopener,noreferrer");
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
  const { user, logout, canEditContent, canManageUsers } = useAuth();
  const navigate = useNavigate();

  const activeItem = useMemo(
    () => menuItems.find((item) => item.key === active) || menuItems[0],
    [active],
  );

  const handleSelectSection = (nextSection) => {
    const nextItem = menuItems.find((item) => item.key === nextSection);
    if (nextItem?.requiresAdmin && !canManageUsers) {
      return;
    }

    if (nextSection === active) {
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
      destinos: (isDirty) => handleDirtySectionChange("destinos", isDirty),
      gastronomia: (isDirty) =>
        handleDirtySectionChange("gastronomia", isDirty),
      hospedajes: (isDirty) => handleDirtySectionChange("hospedajes", isDirty),
      floraFauna: (isDirty) => handleDirtySectionChange("floraFauna", isDirty),
      transporte: (isDirty) => handleDirtySectionChange("transporte", isDirty),
      comoLlegar: (isDirty) =>
        handleDirtySectionChange("comoLlegar", isDirty),
      galeria: (isDirty) => handleDirtySectionChange("galeria", isDirty),
      mensajes: (isDirty) => handleDirtySectionChange("mensajes", isDirty),
      encuestas: (isDirty) => handleDirtySectionChange("encuestas", isDirty),
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
          />
        );
      case "portada":
        return (
          <AdminPortada
            canEdit={canEditContent}
            onLivePreviewChange={handleLivePreviewChange}
            onDirtyChange={dirtyChangeHandlers.portada}
          />
        );
      case "actividades":
        return (
          <AdminActividades
            canEdit={canEditContent}
            onLivePreviewChange={handleLivePreviewChange}
            onDirtyChange={dirtyChangeHandlers.actividades}
          />
        );
      case "eventos":
        return (
          <AdminEventos
            canEdit={canEditContent}
            onLivePreviewChange={handleLivePreviewChange}
            onDirtyChange={dirtyChangeHandlers.eventos}
          />
        );
      case "destinos":
        return (
          <AdminDestinos
            canEdit={canEditContent}
            onLivePreviewChange={handleLivePreviewChange}
            onDirtyChange={dirtyChangeHandlers.destinos}
          />
        );
      case "gastronomia":
        return (
          <AdminGastronomia
            canEdit={canEditContent}
            onLivePreviewChange={handleLivePreviewChange}
            onDirtyChange={dirtyChangeHandlers.gastronomia}
          />
        );
      case "hospedajes":
        return (
          <AdminHospedajes
            canEdit={canEditContent}
            onLivePreviewChange={handleLivePreviewChange}
            onDirtyChange={dirtyChangeHandlers.hospedajes}
          />
        );
      case "floraFauna":
        return (
          <AdminFloraFauna
            canEdit={canEditContent}
            onLivePreviewChange={handleLivePreviewChange}
            onDirtyChange={dirtyChangeHandlers.floraFauna}
          />
        );
      case "transporte":
        return (
          <AdminTransporte
            canEdit={canEditContent}
            onLivePreviewChange={handleLivePreviewChange}
            onDirtyChange={dirtyChangeHandlers.transporte}
          />
        );
      case "comoLlegar":
        return (
          <AdminComoLlegar
            canEdit={canEditContent}
            onLivePreviewChange={handleLivePreviewChange}
            onDirtyChange={dirtyChangeHandlers.comoLlegar}
          />
        );
      case "galeria":
        return (
          <AdminGaleria
            canEdit={canEditContent}
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
      default:
        return (
          <AdminDashboard
            onNavigateSection={handleSelectSection}
            canEditContent={canEditContent}
            canManageUsers={canManageUsers}
          />
        );
    }
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h2>Santa Rosa</h2>
          <p>Panel de Administración</p>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const isLocked = item.requiresAdmin && !canManageUsers;

            return (
              <button
                key={item.key}
                className={`sidebar-nav-item ${active === item.key ? "active" : ""} ${isLocked ? "is-disabled" : ""}`}
                onClick={() => handleSelectSection(item.key)}
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
          <div className="admin-user-meta">
            <FaUser className="inline-icon" aria-hidden="true" />
            {user?.displayName || user?.email}
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
          <div>
            <h1>{activeItem.title}</h1>
            <p className="admin-topbar-subtext">
              {canEditContent
                ? "Editor CMS con guardado automático para el contenido del sitio."
                : "Modo visualizador: puedes navegar el panel sin permisos de edición."}
            </p>
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

          <div className="admin-topbar-actions">
            <button
              className="btn btn-primary admin-topbar-btn"
              onClick={() => openSite("/")}
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
