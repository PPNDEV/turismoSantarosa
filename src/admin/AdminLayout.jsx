import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaBed,
  FaBus,
  FaCalendarAlt,
  FaCamera,
  FaChartBar,
  FaChartPie,
  FaEnvelope,
  FaExternalLinkAlt,
  FaFileAlt,
  FaGlobe,
  FaHiking,
  FaImage,
  FaLeaf,
  FaMapMarkerAlt,
  FaRecycle,
  FaSyncAlt,
  FaUser,
  FaUserShield,
  FaUtensils,
} from "react-icons/fa";
import { useAuth } from "../context/useAuth";
import { useContent } from "../context/useContent";
import AdminPortada from "../admin/AdminPortada";
import AdminDashboard from "../admin/AdminDashboard";
import AdminEventos from "../admin/AdminEventos";
import AdminBlog from "../admin/AdminBlog";
import AdminDestinos from "../admin/AdminDestinos";
import AdminGaleria from "../admin/AdminGaleria";
import AdminGastronomia from "../admin/AdminGastronomia";
import AdminHospedajes from "../admin/AdminHospedajes";
import AdminFloraFauna from "../admin/AdminFloraFauna";
import AdminUsuarios from "../admin/AdminUsuarios";
import AdminActividades from "../admin/AdminActividades";
import AdminTransporte from "../admin/AdminTransporte";
import AdminMensajes from "../admin/AdminMensajes";
import AdminEncuestas from "../admin/AdminEncuestas";

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
    previewPath: "/informacion",
    description: "Gestiona actividades turísticas con isla y coordenadas.",
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
    key: "blog",
    icon: FaFileAlt,
    label: "Blog",
    title: "Blog & Noticias",
    previewPath: "/blog",
    description: "Administra artículos, autores, fechas e imagen destacada.",
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
    icon: FaBus,
    label: "Transporte",
    title: "Cooperativas de Transporte",
    previewPath: "/informacion#transporte",
    description:
      "Administra cooperativas, rutas, frecuencias y puntos de salida/llegada.",
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
];

const publicPages = [
  { label: "Inicio", path: "/" },
  { label: "Información", path: "/informacion" },
  { label: "Eventos", path: "/eventos" },
  { label: "Blog", path: "/blog" },
  { label: "Destinos", path: "/destinos" },
  { label: "Galería", path: "/galeria" },
];

function openSite(path) {
  if (typeof window === "undefined") {
    return;
  }
  window.open(path, "_blank", "noopener,noreferrer");
}

const INSPECTOR_FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=900";
const AUTO_PREVIEW_DEBOUNCE_MS = 700;
const AUTO_PREVIEW_STORAGE_KEY = "admin.autoPreviewEnabled";

function readAutoPreviewPreference() {
  if (typeof window === "undefined") {
    return true;
  }

  const storedValue = window.localStorage.getItem(AUTO_PREVIEW_STORAGE_KEY);
  if (storedValue === null) {
    return true;
  }

  return storedValue === "1" || storedValue === "true";
}

function writeAutoPreviewPreference(nextValue) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTO_PREVIEW_STORAGE_KEY, nextValue ? "1" : "0");
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
  const [previewPath, setPreviewPath] = useState("/");
  const [previewKey, setPreviewKey] = useState(0);
  const [autoPreviewEnabled, setAutoPreviewEnabled] = useState(
    readAutoPreviewPreference,
  );
  const [livePreview, setLivePreview] = useState(null);
  const [dirtySections, setDirtySections] = useState({});
  const { user, logout, canEditContent, canManageUsers } = useAuth();
  const {
    heroSlides,
    blog,
    eventos,
    destinos,
    galeria,
    gastronomia,
    hospedajes,
    floraFauna,
    actividades,
    cooperativas,
    resetContent,
  } = useContent();
  const navigate = useNavigate();

  const activeItem = useMemo(
    () => menuItems.find((item) => item.key === active) || menuItems[0],
    [active],
  );

  const contentStats = useMemo(
    () => [
      { label: "Slides", value: heroSlides.length },
      { label: "Actividades", value: actividades.length },
      { label: "Eventos", value: eventos.length },
      { label: "Artículos", value: blog.length },
      { label: "Destinos", value: destinos.length },
      { label: "Gastronomía", value: gastronomia.length },
      { label: "Hospedajes", value: hospedajes.length },
      { label: "Flora/Fauna", value: floraFauna.length },
      { label: "Transporte", value: cooperativas.length },
      { label: "Galería", value: galeria.length },
    ],
    [
      heroSlides.length,
      actividades.length,
      eventos.length,
      blog.length,
      destinos.length,
      gastronomia.length,
      hospedajes.length,
      floraFauna.length,
      cooperativas.length,
      galeria.length,
    ],
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
    const selectedItem = menuItems.find((item) => item.key === nextSection);
    if (selectedItem?.previewPath) {
      setPreviewPath(selectedItem.previewPath);
    }
  };

  const handleLivePreviewChange = useCallback((nextPreview) => {
    setLivePreview(nextPreview);
    if (nextPreview?.path) {
      setPreviewPath(nextPreview.path);
    }
  }, []);

  const handleDirtySectionChange = useCallback((sectionKey, isDirty) => {
    setDirtySections((previous) => {
      if (previous[sectionKey] === isDirty) {
        return previous;
      }
      return { ...previous, [sectionKey]: isDirty };
    });
  }, []);

  const dirtyModules = menuItems.filter((item) =>
    Boolean(dirtySections[item.key]),
  );

  const hasDirtyChanges = dirtyModules.length > 0;

  useEffect(() => {
    if (!autoPreviewEnabled || !livePreview?.path) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setPreviewKey((currentKey) => currentKey + 1);
    }, AUTO_PREVIEW_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [autoPreviewEnabled, livePreview]);

  useEffect(() => {
    writeAutoPreviewPreference(autoPreviewEnabled);
  }, [autoPreviewEnabled]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleResetContent = () => {
    if (!canManageUsers) {
      return;
    }

    if (
      confirm(
        "¿Deseas restablecer todo el contenido al demo inicial? Esta acción no se puede deshacer.",
      )
    ) {
      resetContent();
      setPreviewKey((currentKey) => currentKey + 1);
    }
  };

  const refreshPreview = () => {
    setPreviewKey((currentKey) => currentKey + 1);
  };

  const handleAutoPreviewToggle = (nextValue) => {
    setAutoPreviewEnabled(nextValue);
    if (nextValue) {
      refreshPreview();
    }
  };

  const renderContent = () => {
    switch (active) {
      case "dashboard":
        return (
          <AdminDashboard
            onNavigateSection={handleSelectSection}
            onPreviewPathChange={setPreviewPath}
            canEditContent={canEditContent}
            canManageUsers={canManageUsers}
          />
        );
      case "portada":
        return (
          <AdminPortada
            canEdit={canEditContent}
            onLivePreviewChange={handleLivePreviewChange}
            onDirtyChange={(isDirty) =>
              handleDirtySectionChange("portada", isDirty)
            }
          />
        );
      case "actividades":
        return (
          <AdminActividades
            canEdit={canEditContent}
            onLivePreviewChange={handleLivePreviewChange}
            onDirtyChange={(isDirty) =>
              handleDirtySectionChange("actividades", isDirty)
            }
          />
        );
      case "eventos":
        return (
          <AdminEventos
            canEdit={canEditContent}
            onLivePreviewChange={handleLivePreviewChange}
            onDirtyChange={(isDirty) =>
              handleDirtySectionChange("eventos", isDirty)
            }
          />
        );
      case "blog":
        return (
          <AdminBlog
            canEdit={canEditContent}
            onLivePreviewChange={handleLivePreviewChange}
            onDirtyChange={(isDirty) =>
              handleDirtySectionChange("blog", isDirty)
            }
          />
        );
      case "destinos":
        return (
          <AdminDestinos
            canEdit={canEditContent}
            onLivePreviewChange={handleLivePreviewChange}
            onDirtyChange={(isDirty) =>
              handleDirtySectionChange("destinos", isDirty)
            }
          />
        );
      case "gastronomia":
        return (
          <AdminGastronomia
            canEdit={canEditContent}
            onLivePreviewChange={handleLivePreviewChange}
            onDirtyChange={(isDirty) =>
              handleDirtySectionChange("gastronomia", isDirty)
            }
          />
        );
      case "hospedajes":
        return (
          <AdminHospedajes
            canEdit={canEditContent}
            onLivePreviewChange={handleLivePreviewChange}
            onDirtyChange={(isDirty) =>
              handleDirtySectionChange("hospedajes", isDirty)
            }
          />
        );
      case "floraFauna":
        return (
          <AdminFloraFauna
            canEdit={canEditContent}
            onLivePreviewChange={handleLivePreviewChange}
            onDirtyChange={(isDirty) =>
              handleDirtySectionChange("floraFauna", isDirty)
            }
          />
        );
      case "transporte":
        return (
          <AdminTransporte
            canEdit={canEditContent}
            onLivePreviewChange={handleLivePreviewChange}
            onDirtyChange={(isDirty) =>
              handleDirtySectionChange("transporte", isDirty)
            }
          />
        );
      case "galeria":
        return (
          <AdminGaleria
            canEdit={canEditContent}
            onLivePreviewChange={handleLivePreviewChange}
            onDirtyChange={(isDirty) =>
              handleDirtySectionChange("galeria", isDirty)
            }
          />
        );
      case "mensajes":
        return (
          <AdminMensajes
            onLivePreviewChange={handleLivePreviewChange}
            onDirtyChange={(isDirty) =>
              handleDirtySectionChange("mensajes", isDirty)
            }
          />
        );
      case "encuestas":
        return (
          <AdminEncuestas
            onLivePreviewChange={handleLivePreviewChange}
            onDirtyChange={(isDirty) =>
              handleDirtySectionChange("encuestas", isDirty)
            }
          />
        );
      case "usuarios":
        return (
          <AdminUsuarios
            onLivePreviewChange={handleLivePreviewChange}
            onDirtyChange={(isDirty) =>
              handleDirtySectionChange("usuarios", isDirty)
            }
          />
        );
      default:
        return (
          <AdminDashboard
            onNavigateSection={handleSelectSection}
            onPreviewPathChange={setPreviewPath}
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
          <div
            style={{
              fontSize: "0.78rem",
              opacity: 0.6,
              marginBottom: "0.75rem",
            }}
          >
            <FaUser className="inline-icon" aria-hidden="true" />
            {user?.displayName || user?.email}
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-outline"
            style={{
              color: "white",
              borderColor: "rgba(255,255,255,0.3)",
              width: "100%",
              justifyContent: "center",
              fontSize: "0.85rem",
            }}
          >
            Cerrar Sesión
          </button>
          <button
            onClick={() => navigate("/")}
            className="btn"
            style={{
              width: "100%",
              justifyContent: "center",
              marginTop: "0.5rem",
              fontSize: "0.85rem",
              background: "rgba(255,255,255,0.08)",
              color: "white",
            }}
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
                ? "Editor CMS con guardado automático y vista previa del sitio en tiempo real."
                : "Modo visualizador: puedes navegar y previsualizar, sin permisos de edición."}
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
              className="btn btn-outline admin-topbar-btn"
              onClick={refreshPreview}
            >
              <FaSyncAlt className="inline-icon" aria-hidden="true" />
              Actualizar Preview
            </button>
            <button
              className="btn admin-topbar-btn admin-topbar-soft"
              onClick={() => openSite(previewPath)}
            >
              <FaExternalLinkAlt className="inline-icon" aria-hidden="true" />
              Abrir Vista Actual
            </button>
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
          <div className="admin-content">{renderContent()}</div>

          <aside className="admin-inspector">
            <div className="admin-inspector-card">
              <h3>Sección Actual</h3>
              <p>{activeItem.description}</p>
              <div className="admin-context-path">
                Vista pública: <strong>{previewPath}</strong>
              </div>
            </div>

            <div className="admin-inspector-card">
              <h3>Acciones Rápidas</h3>
              <div className="admin-quick-links">
                {menuItems
                  .filter((item) => item.key !== "dashboard")
                  .map((item) => {
                    const isLocked = item.requiresAdmin && !canManageUsers;

                    return (
                      <button
                        key={item.key}
                        type="button"
                        className={`sidebar-nav-item ${isLocked ? "is-disabled" : ""}`}
                        onClick={() => handleSelectSection(item.key)}
                        disabled={isLocked}
                      >
                        <span>
                          <item.icon aria-hidden="true" />
                        </span>
                        <span>{item.label}</span>
                        {isLocked && (
                          <span className="admin-lock-label">Admin</span>
                        )}
                      </button>
                    );
                  })}
              </div>

              <div className="admin-mini-stats">
                {contentStats.map((stat) => (
                  <div key={stat.label} className="admin-mini-stat">
                    <strong>{stat.value}</strong>
                    <span>{stat.label}</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="btn admin-destructive-btn"
                onClick={handleResetContent}
                disabled={!canManageUsers}
              >
                <FaRecycle className="inline-icon" aria-hidden="true" />
                Restablecer Contenido Demo
              </button>
            </div>

            <div className="admin-inspector-card">
              <h3>Cambios Sin Guardar</h3>
              {hasDirtyChanges ? (
                <div className="admin-dirty-list">
                  {dirtyModules.map((item) => (
                    <span
                      key={item.key}
                      className="badge badge-gold admin-dirty-chip"
                    >
                      {item.label}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="admin-inspector-muted">
                  Todo guardado en el editor.
                </p>
              )}
            </div>

            <div className="admin-inspector-card">
              <h3>Vista en Vivo del Editor</h3>
              {livePreview ? (
                <article className="admin-inspector-live-card">
                  <img
                    src={livePreview.image || INSPECTOR_FALLBACK_IMAGE}
                    alt={livePreview.title || "Preview en vivo"}
                    onError={(e) => {
                      if (e.currentTarget.src !== INSPECTOR_FALLBACK_IMAGE) {
                        e.currentTarget.src = INSPECTOR_FALLBACK_IMAGE;
                      }
                    }}
                  />
                  <div className="admin-inspector-live-body">
                    {livePreview.badge && (
                      <span className="badge badge-ocean">
                        {livePreview.badge}
                      </span>
                    )}
                    <h4>{livePreview.title || "Sin título"}</h4>
                    {livePreview.subtitle && (
                      <p className="admin-inspector-live-subtitle">
                        {livePreview.subtitle}
                      </p>
                    )}
                    {livePreview.body && (
                      <p className="admin-inspector-live-text">
                        {livePreview.body}
                      </p>
                    )}
                    {livePreview.status && (
                      <p className="admin-inspector-live-status">
                        Estado: {livePreview.status}
                      </p>
                    )}
                    {livePreview.path && (
                      <p className="admin-inspector-live-path">
                        Ruta pública: <strong>{livePreview.path}</strong>
                      </p>
                    )}
                  </div>
                </article>
              ) : (
                <p className="admin-inspector-muted">
                  Abre un editor y modifica campos para ver aquí la
                  previsualización instantánea.
                </p>
              )}
            </div>

            <div className="admin-inspector-card">
              <h3>Vista Previa del Sitio</h3>
              <label className="admin-preview-toggle">
                <input
                  type="checkbox"
                  checked={autoPreviewEnabled}
                  onChange={(e) => handleAutoPreviewToggle(e.target.checked)}
                />
                <span>Auto-actualizar iframe</span>
              </label>
              <p className="admin-preview-auto-note">
                {autoPreviewEnabled
                  ? `Auto-actualización activa cada ${AUTO_PREVIEW_DEBOUNCE_MS} ms mientras editas.`
                  : "Auto-actualización desactivada. Usa Actualizar para refrescar manualmente."}
              </p>
              <div className="admin-preview-controls">
                <select
                  value={previewPath}
                  onChange={(e) => setPreviewPath(e.target.value)}
                >
                  {publicPages.map((page) => (
                    <option key={page.path} value={page.path}>
                      {page.label} ({page.path})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={refreshPreview}
                >
                  Actualizar
                </button>
              </div>

              <div className="admin-preview-frame-wrap">
                <iframe
                  key={`${previewPath}-${previewKey}`}
                  src={previewPath}
                  title="Vista previa de la página pública"
                  className="admin-preview-frame"
                />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
