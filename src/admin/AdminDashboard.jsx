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
  FaLayerGroup,
  FaLeaf,
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

// Colores sólidos para el gráfico de dona (no se puede usar var(--tone) dentro de conic-gradient inline).
const TONE_HEX = {
  "tone-ocean": "#0a7ea4",
  "tone-orange": "#f97316",
  "tone-emerald": "#10b981",
  "tone-orange-dark": "#ea580c",
  "tone-green": "#059669",
  "tone-lime": "#65a30d",
  "tone-purple": "#7c3aed",
  "tone-blue": "#2563eb",
};

export default function AdminDashboard({
  onNavigateSection = () => {},
  canEditContent = true,
  canManageUsers = false,
  recentSectionKeys = [],
}) {
  const {
    heroSlides,
    eventos,
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

  const totalContenido =
    heroSlides.length +
    actividades.length +
    eventos.length +
    gastronomia.length +
    hospedajes.length +
    floraFauna.length +
    cooperativas.length +
    galeria.length;

  // Tarjetas KPI destacadas (estilo dashboard premium)
  const kpis = [
    {
      label: "Vistas totales",
      hint: "Tráfico",
      value: visitMetrics.totalPageViews,
      icon: FaFileAlt,
      grad: "kpi-teal",
    },
    {
      label: "Sesiones",
      hint: "Visitantes",
      value: visitMetrics.totalSessions,
      icon: FaUserShield,
      grad: "kpi-blue",
    },
    {
      label: "Contenido publicado",
      hint: "Total ítems",
      value: totalContenido,
      icon: FaLayerGroup,
      grad: "kpi-violet",
    },
    {
      label: "Solicitudes",
      hint: "Por revisar",
      value: pendingRequestsCount,
      icon: FaInbox,
      grad: "kpi-gold",
    },
  ];

  // Distribución de contenido por sección (barras + dona)
  const distribucion = [
    { label: "Portada", value: heroSlides.length, tone: "tone-ocean" },
    { label: "Actividades", value: actividades.length, tone: "tone-orange" },
    { label: "Eventos", value: eventos.length, tone: "tone-emerald" },
    { label: "Gastronomía", value: gastronomia.length, tone: "tone-orange-dark" },
    { label: "Hospedajes", value: hospedajes.length, tone: "tone-green" },
    { label: "Flora y Fauna", value: floraFauna.length, tone: "tone-lime" },
    { label: "Transporte", value: cooperativas.length, tone: "tone-purple" },
    { label: "Galería", value: galeria.length, tone: "tone-blue" },
  ];
  const maxDist = Math.max(1, ...distribucion.map((d) => d.value));
  const totalDist = distribucion.reduce((sum, d) => sum + d.value, 0);

  let donutCursor = 0;
  const donutSegments = distribucion
    .filter((d) => d.value > 0)
    .map((d) => {
      const color = TONE_HEX[d.tone] || "#0a7ea4";
      const start = (donutCursor / totalDist) * 100;
      donutCursor += d.value;
      const end = (donutCursor / totalDist) * 100;
      return { ...d, color, start, end };
    });
  const donutBackground =
    donutSegments.length > 0
      ? `conic-gradient(${donutSegments
          .map((s) => `${s.color} ${s.start}% ${s.end}%`)
          .join(", ")})`
      : "conic-gradient(#e2e8f0 0% 100%)";

  const proximosEventos = useMemo(
    () =>
      [...eventos]
        .filter((evento) => evento.activo !== false)
        .sort((a, b) => getEventTimestamp(a.fecha) - getEventTimestamp(b.fecha))
        .slice(0, 5),
    [eventos],
  );

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
      desc: "Administra actividades turísticas por isla.",
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

  const availableSectionCards = sectionCards.filter(
    (section) => !section.adminOnly || canManageUsers,
  );
  const recentSectionCards = recentSectionKeys
    .map((sectionKey) =>
      availableSectionCards.find((section) => section.key === sectionKey),
    )
    .filter(Boolean);

  return (
    <div className="admin-dashboard">
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

      {/* KPIs destacados */}
      <div className="admin-kpi-grid">
        {kpis.map((kpi) => (
          <div key={kpi.label} className={`admin-kpi-card ${kpi.grad}`}>
            <div className="admin-kpi-top">
              <span className="admin-kpi-icon">
                <kpi.icon aria-hidden="true" />
              </span>
              <span className="admin-kpi-hint">{kpi.hint}</span>
            </div>
            <div className="admin-kpi-value">{kpi.value}</div>
            <div className="admin-kpi-label">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Gráficas: barras + dona */}
      <div className="admin-dash-grid">
        <div className="admin-table-card">
          <div className="admin-table-header">
            <h2>
              <FaLayerGroup className="inline-icon" aria-hidden="true" />
              Contenido por sección
            </h2>
            <span className="admin-chip-soft">{totalContenido} ítems</span>
          </div>
          <div className="admin-bars">
            {distribucion.map((item) => (
              <div key={item.label} className={`admin-bar-row ${item.tone}`}>
                <span className="admin-bar-label">{item.label}</span>
                <span className="admin-bar-track">
                  <span
                    className="admin-bar-fill"
                    style={{ width: `${(item.value / maxDist) * 100}%` }}
                  />
                </span>
                <span className="admin-bar-value">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-table-card">
          <div className="admin-table-header">
            <h2>
              <FaChartPie className="inline-icon" aria-hidden="true" />
              Composición
            </h2>
          </div>
          <div className="admin-donut-wrap">
            <div
              className="admin-donut"
              style={{ background: donutBackground }}
              role="img"
              aria-label={`Composición del contenido: ${totalDist} ítems en total`}
            >
              <div className="admin-donut-hole">
                <strong>{totalDist}</strong>
                <span>ítems</span>
              </div>
            </div>
            <ul className="admin-donut-legend">
              {donutSegments.length === 0 && (
                <li className="admin-donut-empty">Aún no hay contenido.</li>
              )}
              {donutSegments.map((segment) => (
                <li key={segment.label}>
                  <span
                    className="admin-donut-dot"
                    style={{ background: segment.color }}
                  />
                  {segment.label}
                  <strong>{segment.value}</strong>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Próximos eventos + accesos rápidos */}
      <div className="admin-dash-grid">
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

        <div className="admin-table-card">
          <div
            className="admin-table-header"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <h2>
              <FaHistory className="inline-icon" aria-hidden="true" />
              Accesos rápidos
            </h2>
            {canEditContent && (
              <div className="admin-toggle-pill">
                <span>Mascotas</span>
                <label className="admin-switch">
                  <input
                    type="checkbox"
                    checked={siteConfig.mascotasEnabled}
                    onChange={handleToggleMascotas}
                    disabled={isToggling}
                  />
                  <span className="admin-switch-track" aria-hidden="true">
                    <span className="admin-switch-thumb" />
                  </span>
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
                Aún no hay secciones visitadas recientemente. Abre cualquier
                módulo del menú para verlo aquí.
              </div>
            )}
            {recentSectionCards.map((section) => (
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
