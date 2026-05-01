import { useEffect, useMemo, useState } from "react";
import {
  FaBed,
  FaBus,
  FaCalendarAlt,
  FaCamera,
  FaChartPie,
  FaCogs,
  FaEnvelope,
  FaFileAlt,
  FaHiking,
  FaImage,
  FaLeaf,
  FaMapMarkerAlt,
  FaUserShield,
  FaUtensils,
  FaInbox,
} from "react-icons/fa";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "../services/firebase";
import { useContent } from "../context/useContent";
import { subscribeVisitMetrics } from "../services/visitCounter";

function getEventTimestamp(fecha) {
  const parsedDate = new Date(`${fecha || ""}T12:00:00`);
  const timestamp = parsedDate.getTime();
  return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp;
}

export default function AdminDashboard({
  onNavigateSection = () => {},
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
    actividades,
    cooperativas,
  } = useContent();
  const [visitMetrics, setVisitMetrics] = useState({
    totalPageViews: 0,
    totalSessions: 0,
    routes: [],
  });
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  useEffect(() => {
    if (!canManageUsers) return;

    const q = query(collection(db, "solicitudes_negocios"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setPendingRequestsCount(snapshot.size);
      },
      (error) => {
        console.warn("No se pudo cargar solicitudes:", error.message);
        setPendingRequestsCount(0);
      }
    );
    return () => {
      try {
        unsubscribe();
      } catch (e) {
        console.warn("Error al limpiar suscripción de solicitudes:", e);
      }
    };
  }, [canManageUsers]);

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

    return () => {
      try {
        unsubscribe();
      } catch (e) {
        console.warn("Error al limpiar suscripción de visitas:", e);
      }
    };
  }, []);

  const sectionCards = [
    {
      key: "portada",
      icon: FaImage,
      title: "Portada",
      desc: "Gestiona slides, titulares y botones de bienvenida.",
      total: heroSlides.length,
    },
    {
      key: "actividades",
      icon: FaHiking,
      title: "Actividades",
      desc: "Administra actividades turísticas con isla y coordenadas.",
      total: actividades.length,
    },
    {
      key: "eventos",
      icon: FaCalendarAlt,
      title: "Eventos",
      desc: "Controla publicaciones y agenda turística actualizada.",
      total: eventos.length,
    },
    {
      key: "blog",
      icon: FaFileAlt,
      title: "Blog",
      desc: "Edita noticias, artículos y contenido de promoción.",
      total: blog.length,
    },
    {
      key: "destinos",
      icon: FaMapMarkerAlt,
      title: "Destinos",
      desc: "Administra fichas turísticas y categorías principales.",
      total: destinos.length,
    },
    {
      key: "gastronomia",
      icon: FaUtensils,
      title: "Gastronomía",
      desc: "Gestiona restaurantes, platos típicos y contacto.",
      total: gastronomia.length,
    },
    {
      key: "hospedajes",
      icon: FaBed,
      title: "Hospedajes",
      desc: "Actualiza alojamientos con servicios y ubicación.",
      total: hospedajes.length,
    },
    {
      key: "floraFauna",
      icon: FaLeaf,
      title: "Flora y Fauna",
      desc: "Publica especies y zonas de biodiversidad.",
      total: floraFauna.length,
    },
    {
      key: "transporte",
      icon: FaBus,
      title: "Transporte",
      desc: "Cooperativas, rutas y frecuencias de movilización.",
      total: cooperativas.length,
    },
    {
      key: "galeria",
      icon: FaCamera,
      title: "Galería",
      desc: "Actualiza el material visual del sitio principal.",
      total: galeria.length,
    },
    {
      key: "mensajes",
      icon: FaEnvelope,
      title: "Mensajes",
      desc: "Consulta mensajes enviados por visitantes.",
      total: null,
    },
    {
      key: "encuestas",
      icon: FaChartPie,
      title: "Encuestas",
      desc: "Puntuaciones y comentarios de satisfacción.",
      total: null,
    },
    {
      key: "solicitudes",
      icon: FaInbox,
      title: "Solicitudes",
      desc: "Revisa y aprueba nuevos negocios.",
      total: pendingRequestsCount,
      adminOnly: true,
    },
    {
      key: "usuarios",
      icon: FaUserShield,
      title: "Usuarios",
      desc: "Crea usuarios y asigna roles de permisos.",
      total: canManageUsers ? 1 : 0,
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
      tone: "tone-ocean",
    },
    {
      label: "Actividades",
      value: actividades.length,
      icon: FaHiking,
      tone: "tone-orange",
    },
    {
      label: "Artículos",
      value: blog.length,
      icon: FaFileAlt,
      tone: "tone-gold",
    },
    {
      label: "Eventos",
      value: eventos.length,
      icon: FaCalendarAlt,
      tone: "tone-emerald",
    },
    {
      label: "Destinos",
      value: destinos.length,
      icon: FaMapMarkerAlt,
      tone: "tone-violet",
    },
    {
      label: "Gastronomía",
      value: gastronomia.length,
      icon: FaUtensils,
      tone: "tone-orange-dark",
    },
    {
      label: "Hospedajes",
      value: hospedajes.length,
      icon: FaBed,
      tone: "tone-green",
    },
    {
      label: "Flora/Fauna",
      value: floraFauna.length,
      icon: FaLeaf,
      tone: "tone-lime",
    },
    {
      label: "Transporte",
      value: cooperativas.length,
      icon: FaBus,
      tone: "tone-purple",
    },
    {
      label: "Fotos",
      value: galeria.length,
      icon: FaCamera,
      tone: "tone-blue",
    },
    {
      label: "Solicitudes",
      value: pendingRequestsCount,
      icon: FaInbox,
      tone: "tone-rose",
    },
    {
      label: "Sesiones",
      value: visitMetrics.totalSessions,
      icon: FaUserShield,
      tone: "tone-teal",
    },
    {
      label: "Vistas",
      value: visitMetrics.totalPageViews,
      icon: FaFileAlt,
      tone: "tone-amber",
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
            .map((section) => {
              return (
                <article
                  key={section.key}
                  className="admin-module-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => onNavigateSection(section.key)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onNavigateSection(section.key);
                    }
                  }}
                  aria-label={`Abrir ${section.title}`}
                >
                  <div className="admin-module-title">
                    <span>
                      <section.icon aria-hidden="true" />
                    </span>
                    <h3>{section.title}</h3>
                  </div>
                  <p>{section.desc}</p>
                  {section.total !== null && (
                    <div className="admin-module-total">
                      {section.total} items
                    </div>
                  )}
                </article>
              );
            })}
        </div>
      </div>

      <div className="admin-stats-grid">
        {stats.map((s, i) => (
          <div key={i} className="admin-stat-card">
            <div>
              <h3>{s.label}</h3>
              <div className={`big ${s.tone}`}>
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
