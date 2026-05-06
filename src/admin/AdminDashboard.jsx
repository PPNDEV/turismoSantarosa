import { useEffect, useMemo, useState } from "react";
import {
  FaBed,
  FaCalendarAlt,
  FaCamera,
  FaChartPie,
  FaEnvelope,
  FaFileAlt,
  FaHiking,
  FaHistory,
  FaImage,
  FaLeaf,
  FaMapMarkerAlt,
  FaShip,
  FaUserShield,
  FaUtensils,
  FaInbox,
} from "react-icons/fa";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "../services/firebase";
import { subscribeToSiteConfig, updateMascotasEnabled } from "../services/configService";
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
  recentSectionKeys = [],
}) {
  const {
    heroSlides,
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
  const [siteConfig, setSiteConfig] = useState({ mascotasEnabled: true });
  const [isToggling, setIsToggling] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeToSiteConfig((config) => {
      setSiteConfig(config);
    });
    return () => {
      try {
        unsubscribe();
      } catch {
        // ignorar
      }
    };
  }, []);

  const handleToggleMascotas = async () => {
    if (!canEditContent) return;
    setIsToggling(true);
    const newState = !siteConfig.mascotasEnabled;
    try {
      await updateMascotasEnabled(newState);
      setToastMessage({
        type: "success",
        message: newState
          ? "Mascotas activadas en el sitio."
          : "Mascotas desactivadas en todo el sitio.",
      });
      setTimeout(() => setToastMessage(null), 3000);
    } catch {
      setToastMessage({
        type: "error",
        message: "No se pudo actualizar la configuracion. Intenta nuevamente.",
      });
      setTimeout(() => setToastMessage(null), 4500);
    } finally {
      setIsToggling(false);
    }
  };

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
      icon: FaShip,
      title: "Transporte fluvial",
      desc: "Rutas, frecuencias y muelles de embarcacion.",
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
      label: "Transporte fluvial",
      value: cooperativas.length,
      icon: FaShip,
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

  const availableSectionCards = sectionCards.filter(
    (section) => !section.adminOnly || canManageUsers,
  );
  const recentSectionCards = recentSectionKeys
    .map((sectionKey) =>
      availableSectionCards.find((section) => section.key === sectionKey),
    )
    .filter(Boolean);

  return (
    <div>
      <div className="admin-dashboard-actions admin-table-card">
        {toastMessage && (
          <div
            className={`admin-alert ${
              toastMessage.type === "error"
                ? "admin-alert-error"
                : "admin-alert-success"
            }`}
          >
            {toastMessage.message}
          </div>
        )}
        <div className="admin-table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <h2>
            <FaHistory className="inline-icon" aria-hidden="true" />
            Visitados recientemente
          </h2>
          {canEditContent && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(0,0,0,0.03)', padding: '0.5rem 1rem', borderRadius: '50px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--gray-600)' }}>
                Animaciones (Mascotas)
              </span>
              <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', position: 'relative' }}>
                <input 
                  type="checkbox" 
                  checked={siteConfig.mascotasEnabled} 
                  onChange={handleToggleMascotas}
                  disabled={isToggling}
                  style={{ opacity: 0, position: 'absolute', width: 0, height: 0 }}
                />
                <div style={{
                  width: '46px',
                  height: '24px',
                  background: siteConfig.mascotasEnabled ? 'var(--ocean)' : 'var(--gray-400)',
                  borderRadius: '24px',
                  transition: 'background-color 0.3s',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '2px',
                    left: siteConfig.mascotasEnabled ? '24px' : '2px',
                    width: '20px',
                    height: '20px',
                    background: 'white',
                    borderRadius: '50%',
                    transition: 'left 0.3s',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }} />
                </div>
              </label>
            </div>
          )}
        </div>
        {!canEditContent && (
          <div className="admin-readonly-note">
            Tu rol actual es visualizador: puedes consultar, pero no editar.
          </div>
        )}
        <div className="admin-module-grid">
          {recentSectionCards.length === 0 && (
            <div className="admin-module-empty">
              Aun no hay secciones visitadas recientemente desde el sidebar.
            </div>
          )}
          {recentSectionCards.map((section) => {
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
                  <div className="admin-module-total">{section.total} items</div>
                )}
              </article>
            );
          })}
        </div>
      </div>

      <div className="admin-dashboard-overview">
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

        <div className="admin-table-card admin-events-overview-card">
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
    </div>
  );
}
