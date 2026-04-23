import { useEffect, useMemo, useState } from "react";
import {
  FaBed,
  FaCalendarAlt,
  FaCamera,
  FaCogs,
  FaFileAlt,
  FaLeaf,
  FaImage,
  FaMapMarkerAlt,
  FaUserShield,
  FaUtensils,
} from "react-icons/fa";
import { useContent } from "../context/useContent";
import { subscribeVisitMetrics } from "../services/visitCounter";

function getEventTimestamp(fecha) {
  const parsedDate = new Date(`${fecha || ""}T12:00:00`);
  const timestamp = parsedDate.getTime();
  return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp;
}

export default function AdminDashboard({
  onNavigateSection = () => {},
  onPreviewPathChange = () => {},
  canEditContent = true,
  canManageUsers = false,
}) {
  const {
    heroSlides,
    blog,
    eventos,
    destinos,
    galeria,
    gastronomia,
    hospedajes,
    floraFauna,
  } = useContent();
  const [visitMetrics, setVisitMetrics] = useState({
    totalPageViews: 0,
    totalSessions: 0,
    routes: [],
  });

  useEffect(() => {
    const unsubscribe = subscribeVisitMetrics(
      (metrics) => setVisitMetrics(metrics),
      () => {
        setVisitMetrics({
          totalPageViews: 0,
          totalSessions: 0,
          routes: [],
        });
      },
    );

    return () => unsubscribe();
  }, []);

  const sectionCards = [
    {
      key: "portada",
      icon: FaImage,
      title: "Portada",
      desc: "Gestiona slides, titulares y botones de bienvenida.",
      total: heroSlides.length,
      previewPath: "/",
    },
    {
      key: "eventos",
      icon: FaCalendarAlt,
      title: "Eventos",
      desc: "Controla publicaciones y agenda turística actualizada.",
      total: eventos.length,
      previewPath: "/eventos",
    },
    {
      key: "blog",
      icon: FaFileAlt,
      title: "Blog",
      desc: "Edita noticias, artículos y contenido de promoción.",
      total: blog.length,
      previewPath: "/blog",
    },
    {
      key: "destinos",
      icon: FaMapMarkerAlt,
      title: "Destinos",
      desc: "Administra fichas turísticas y categorías principales.",
      total: destinos.length,
      previewPath: "/destinos",
    },
    {
      key: "gastronomia",
      icon: FaUtensils,
      title: "Gastronomía",
      desc: "Gestiona restaurantes, platos típicos y contacto.",
      total: gastronomia.length,
      previewPath: "/informacion#gastronomia",
    },
    {
      key: "hospedajes",
      icon: FaBed,
      title: "Hospedajes",
      desc: "Actualiza alojamientos con servicios y ubicación.",
      total: hospedajes.length,
      previewPath: "/informacion#hospedajes",
    },
    {
      key: "floraFauna",
      icon: FaLeaf,
      title: "Flora y Fauna",
      desc: "Publica especies y zonas de biodiversidad.",
      total: floraFauna.length,
      previewPath: "/informacion#flora-fauna",
    },
    {
      key: "galeria",
      icon: FaCamera,
      title: "Galería",
      desc: "Actualiza el material visual del sitio principal.",
      total: galeria.length,
      previewPath: "/galeria",
    },
    {
      key: "usuarios",
      icon: FaUserShield,
      title: "Usuarios",
      desc: "Crea usuarios y asigna roles de permisos.",
      total: canManageUsers ? 1 : 0,
      previewPath: "/admin",
      adminOnly: true,
    },
  ];

  const proximosEventos = useMemo(
    () =>
      [...eventos]
        .filter((evento) => evento.activo !== false)
        .sort((a, b) => getEventTimestamp(a.fecha) - getEventTimestamp(b.fecha))
        .slice(0, 5),
    [eventos],
  );

  const stats = [
    {
      label: "Slides",
      value: heroSlides.length,
      icon: FaImage,
      color: "var(--ocean)",
    },
    {
      label: "Artículos",
      value: blog.length,
      icon: FaFileAlt,
      color: "var(--gold-dark)",
    },
    {
      label: "Eventos",
      value: eventos.length,
      icon: FaCalendarAlt,
      color: "#10b981",
    },
    {
      label: "Destinos",
      value: destinos.length,
      icon: FaMapMarkerAlt,
      color: "#8b5cf6",
    },
    {
      label: "Gastronomía",
      value: gastronomia.length,
      icon: FaUtensils,
      color: "#ea580c",
    },
    {
      label: "Hospedajes",
      value: hospedajes.length,
      icon: FaBed,
      color: "#059669",
    },
    {
      label: "Flora/Fauna",
      value: floraFauna.length,
      icon: FaLeaf,
      color: "#65a30d",
    },
    { label: "Fotos", value: galeria.length, icon: FaCamera, color: "#2563eb" },
    {
      label: "Sesiones",
      value: visitMetrics.totalSessions,
      icon: FaUserShield,
      color: "#0f766e",
    },
    {
      label: "Vistas",
      value: visitMetrics.totalPageViews,
      icon: FaFileAlt,
      color: "#b45309",
    },
  ];

  return (
    <div>
      <div className="admin-dashboard-actions admin-table-card">
        <div className="admin-table-header">
          <h2>
            <FaCogs className="inline-icon" aria-hidden="true" />
            Editor Completo del Sitio
          </h2>
        </div>
        {!canEditContent && (
          <div className="admin-readonly-note">
            Tu rol actual es visualizador: puedes consultar, pero no editar.
          </div>
        )}
        <div className="admin-module-grid">
          {sectionCards
            .filter((section) => !section.adminOnly || canManageUsers)
            .map((section) => (
              <article key={section.key} className="admin-module-card">
                <div className="admin-module-title">
                  <span>
                    <section.icon aria-hidden="true" />
                  </span>
                  <h3>{section.title}</h3>
                </div>
                <p>{section.desc}</p>
                <div className="admin-module-total">{section.total} items</div>
                <div className="admin-module-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => onNavigateSection(section.key)}
                  >
                    {canEditContent || section.key === "usuarios"
                      ? "Gestionar"
                      : "Ver"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => onPreviewPathChange(section.previewPath)}
                  >
                    Previsualizar
                  </button>
                </div>
              </article>
            ))}
        </div>
      </div>

      <div className="admin-stats-grid">
        {stats.map((s, i) => (
          <div key={i} className="admin-stat-card">
            <div>
              <h3>{s.label}</h3>
              <div className="big" style={{ color: s.color }}>
                {s.value}
              </div>
            </div>
            <div className="admin-stat-icon">
              <s.icon aria-hidden="true" />
            </div>
          </div>
        ))}
      </div>

      <div className="admin-table-card">
        <div className="admin-table-header">
          <h2>
            <FaFileAlt className="inline-icon" aria-hidden="true" />
            Visitas del Sitio
          </h2>
        </div>
        <table>
          <thead>
            <tr>
              <th>Ruta</th>
              <th>Vistas</th>
              <th>Sesiones</th>
            </tr>
          </thead>
          <tbody>
            {visitMetrics.routes.length === 0 && (
              <tr>
                <td colSpan={3}>Aun no hay visitas registradas.</td>
              </tr>
            )}
            {visitMetrics.routes.slice(0, 8).map((route) => (
              <tr key={route.key}>
                <td>{route.path}</td>
                <td>{route.views}</td>
                <td>{route.sessions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="admin-table-card">
        <div className="admin-table-header">
          <h2>
            <FaCalendarAlt className="inline-icon" aria-hidden="true" />
            Próximos Eventos Publicados
          </h2>
        </div>
        <table>
          <thead>
            <tr>
              <th>Evento</th>
              <th>Fecha</th>
              <th>Lugar</th>
              <th>Tipo</th>
            </tr>
          </thead>
          <tbody>
            {proximosEventos.length === 0 && (
              <tr>
                <td colSpan={4}>No hay eventos publicados para mostrar.</td>
              </tr>
            )}
            {proximosEventos.map((ev) => (
              <tr key={ev.id}>
                <td>
                  <strong>{ev.nombre}</strong>
                </td>
                <td>
                  {new Date(ev.fecha + "T12:00:00").toLocaleDateString("es-EC")}
                </td>
                <td>{ev.lugar}</td>
                <td>{ev.tipo || "General"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
