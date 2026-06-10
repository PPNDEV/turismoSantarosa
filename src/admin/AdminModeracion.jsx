import { useEffect, useMemo, useState } from "react";
import { onValue, ref } from "firebase/database";
import { httpsCallable } from "firebase/functions";
import {
  FaCheck,
  FaClipboardCheck,
  FaPen,
  FaPlus,
  FaTimes,
} from "react-icons/fa";
import { functions, rtdb } from "../services/firebase";

const NODE_LABEL = {
  gastronomia: "Gastronomía",
  hospedajes: "Hospedajes",
  eventos: "Eventos",
  actividades: "Actividades",
  actividadesEditorial: "Actividades (editorial)",
  floraFauna: "Flora y Fauna",
  cooperativas: "Transporte",
  galeria: "Galería",
  heroSlides: "Portada",
};

function getItemName(data = {}) {
  return (
    data.nombre ||
    data.titulo ||
    data.title ||
    data.cooperativa ||
    "Sin título"
  );
}

export default function AdminModeracion({
  currentUser = null,
  onLivePreviewChange = () => {},
}) {
  const role = currentUser?.role;
  const isAdmin = role === "administrador";
  const canSubscribe = isAdmin || role === "editor";

  const [pendings, setPendings] = useState([]);
  const [loading, setLoading] = useState(canSubscribe);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    if (!canSubscribe) {
      return undefined;
    }

    const pendingRef = ref(rtdb, "contentPending");
    const unsubscribe = onValue(
      pendingRef,
      (snapshot) => {
        const val = snapshot.val();
        const list =
          val && typeof val === "object"
            ? Object.entries(val).map(([id, data]) => ({ id, ...data }))
            : [];
        setPendings(list);
        setLoading(false);
      },
      (err) => {
        console.warn("contentPending listener error:", err);
        setError("No se pudieron cargar las publicaciones pendientes.");
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [canSubscribe]);

  const visible = useMemo(() => {
    const list = isAdmin
      ? pendings
      : pendings.filter((p) => p.ownerUid === currentUser?.uid);
    return [...list].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [pendings, isAdmin, currentUser?.uid]);

  useEffect(() => {
    onLivePreviewChange({
      section: "moderacion",
      path: "/admin",
      image:
        "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=900",
      badge: "Moderación",
      title: `Publicaciones pendientes: ${visible.length}`,
      subtitle: isAdmin ? "Aprueba o rechaza envíos" : "Estado de tus envíos",
      body: isAdmin
        ? "Revisa las publicaciones enviadas por los editores antes de hacerlas públicas."
        : "Aquí ves el estado de las publicaciones que enviaste a revisión.",
      status: "Moderación",
    });
  }, [visible.length, isAdmin, onLivePreviewChange]);

  useEffect(() => {
    if (!success && !error) return undefined;
    const timer = setTimeout(() => {
      setSuccess("");
      setError("");
    }, 4500);
    return () => clearTimeout(timer);
  }, [success, error]);

  const approve = async (pending) => {
    setError("");
    setSuccess("");
    setProcessingId(pending.id);
    try {
      await httpsCallable(functions, "aprobarPublicacion")({
        pendingId: pending.id,
      });
      setSuccess("Publicación aprobada y publicada en el portal.");
    } catch (err) {
      setError(err.message || "Error al aprobar la publicación.");
    } finally {
      setProcessingId(null);
    }
  };

  const reject = async (pending) => {
    if (!confirm("¿Rechazar esta publicación? Se descartará el envío.")) {
      return;
    }
    setError("");
    setSuccess("");
    setProcessingId(pending.id);
    try {
      await httpsCallable(functions, "rechazarPublicacion")({
        pendingId: pending.id,
      });
      setSuccess("Publicación rechazada.");
    } catch (err) {
      setError(err.message || "Error al rechazar la publicación.");
    } finally {
      setProcessingId(null);
    }
  };

  if (!canSubscribe) {
    return (
      <div className="admin-empty-state">
        <span className="admin-empty-icon">
          <FaClipboardCheck aria-hidden="true" />
        </span>
        <h3>Sin publicaciones para moderar</h3>
        <p>
          La moderación de publicaciones está disponible para editores y
          administradores.
        </p>
      </div>
    );
  }

  return (
    <div className="admin-table-card admin-table-card-spaced">
      <div className="admin-table-header">
        <h2>
          <FaClipboardCheck className="inline-icon" aria-hidden="true" />
          {isAdmin
            ? `Publicaciones pendientes (${visible.length})`
            : `Mis publicaciones en revisión (${visible.length})`}
        </h2>
      </div>

      {!isAdmin && (
        <div className="admin-readonly-note">
          Tus publicaciones quedan en revisión. El administrador las aprobará
          antes de que aparezcan en el portal público.
        </div>
      )}

      {error && <div className="admin-alert admin-alert-error">{error}</div>}
      {success && (
        <div className="admin-alert admin-alert-success">{success}</div>
      )}

      {loading ? (
        <div className="admin-loading-state">Cargando publicaciones...</div>
      ) : visible.length === 0 ? (
        <div className="admin-empty-state">
          <span className="admin-empty-icon">
            <FaClipboardCheck aria-hidden="true" />
          </span>
          <h3>Nada pendiente</h3>
          <p>
            {isAdmin
              ? "No hay publicaciones de editores esperando revisión."
              : "No tienes publicaciones en revisión por el momento."}
          </p>
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Módulo</th>
              <th>Publicación</th>
              <th>Tipo</th>
              {isAdmin && <th>Editor</th>}
              <th>{isAdmin ? "Acciones" : "Estado"}</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((pending) => (
              <tr key={pending.id}>
                <td>
                  <span className="badge badge-ocean">
                    {NODE_LABEL[pending.nodeKey] || pending.nodeKey}
                  </span>
                </td>
                <td>
                  <strong>{getItemName(pending.data)}</strong>
                </td>
                <td>
                  {pending.isEdit ? (
                    <span className="badge badge-gold">
                      <FaPen className="inline-icon" aria-hidden="true" /> Edición
                    </span>
                  ) : (
                    <span className="badge badge-ocean">
                      <FaPlus className="inline-icon" aria-hidden="true" /> Nueva
                    </span>
                  )}
                </td>
                {isAdmin && <td>{pending.ownerEmail || "-"}</td>}
                <td>
                  {isAdmin ? (
                    <>
                      <button
                        className="action-btn edit-btn"
                        onClick={() => approve(pending)}
                        disabled={processingId === pending.id}
                        title="Aprobar y publicar"
                      >
                        <FaCheck className="inline-icon" aria-hidden="true" />
                        Aprobar
                      </button>
                      <button
                        className="action-btn del-btn"
                        onClick={() => reject(pending)}
                        disabled={processingId === pending.id}
                        title="Rechazar"
                      >
                        <FaTimes className="inline-icon" aria-hidden="true" />
                        Rechazar
                      </button>
                    </>
                  ) : (
                    <span className="badge badge-gold">Pendiente</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
