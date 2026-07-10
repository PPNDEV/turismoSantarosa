import { useCallback, useEffect, useState } from "react";
import {
  FaCheck,
  FaCommentDots,
  FaStar,
  FaSyncAlt,
  FaTimes,
  FaTrash,
} from "react-icons/fa";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../services/firebase";

const PAGE_LIMIT = 80;

function Stars({ value }) {
  return (
    <span className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <FaStar
          key={star}
          className={`star-rating-icon ${star <= value ? "is-active" : ""}`}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

function formatDate(date) {
  if (!date) return "-";
  return date.toLocaleDateString("es-EC", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminResenas({
  canModerate = false,
  onLivePreviewChange = () => {},
  onDirtyChange = () => {},
}) {
  const [resenas, setResenas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("todas");

  const fetchResenas = useCallback(async () => {
    const q = query(
      collection(db, "resenas_turisticas"),
      orderBy("fecha", "desc"),
      limit(PAGE_LIMIT),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        fecha: data.fecha?.toDate?.() || null,
      };
    });
  }, []);

  const loadResenas = useCallback(async () => {
    setLoading(true);
    try {
      setResenas(await fetchResenas());
    } finally {
      setLoading(false);
    }
  }, [fetchResenas]);

  useEffect(() => {
    let mounted = true;

    void fetchResenas()
      .then((nextResenas) => {
        if (mounted) setResenas(nextResenas);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [fetchResenas]);

  useEffect(
    () => () => {
      onDirtyChange(false);
      onLivePreviewChange(null);
    },
    [onDirtyChange, onLivePreviewChange],
  );

  const updateEstado = async (id, estado) => {
    try {
      const adminUpdateReviewStatus = httpsCallable(
        functions,
        "adminUpdateReviewStatus",
      );
      await adminUpdateReviewStatus({ id, estado });
      setResenas((current) =>
        current.map((resena) =>
          resena.id === id ? { ...resena, estado } : resena,
        ),
      );
    } catch (error) {
      console.error("No se pudo actualizar la reseña:", error);
      alert(
        error?.message ||
          "No se pudo actualizar la reseña. Verifica tus permisos.",
      );
    }
  };

  const del = async (id) => {
    if (!confirm("Eliminar esta resena?")) return;

    try {
      const adminDeleteReview = httpsCallable(functions, "adminDeleteReview");
      await adminDeleteReview({ id });
      setResenas((current) => current.filter((resena) => resena.id !== id));
    } catch (error) {
      console.error("No se pudo eliminar la reseña:", error);
      alert(
        error?.message ||
          "No se pudo eliminar la reseña. Verifica tus permisos.",
      );
    }
  };

  const estadoDe = (resena) => resena.estado || "pendiente";

  const totals = {
    todas: resenas.length,
    pendiente: resenas.filter((r) => estadoDe(r) === "pendiente").length,
    aprobada: resenas.filter((r) => estadoDe(r) === "aprobada").length,
    rechazada: resenas.filter((r) => estadoDe(r) === "rechazada").length,
  };

  const filtros = [
    { key: "todas", label: "Todas", count: totals.todas },
    { key: "pendiente", label: "Pendientes", count: totals.pendiente },
    { key: "aprobada", label: "Aprobadas", count: totals.aprobada },
    { key: "rechazada", label: "Rechazadas", count: totals.rechazada },
  ];

  const resenasVisibles =
    filtro === "todas"
      ? resenas
      : resenas.filter((resena) => estadoDe(resena) === filtro);

  return (
    <div>
      <div className="admin-table-card">
        <div className="admin-table-header">
          <h2>
            <FaCommentDots className="inline-icon" aria-hidden="true" />
            Reseñas turisticas ({totals.todas})
          </h2>
          <button
            type="button"
            className="btn btn-outline"
            onClick={loadResenas}
            disabled={loading}
          >
            <FaSyncAlt className="inline-icon" aria-hidden="true" />
            Actualizar
          </button>
        </div>

        {!canModerate && (
          <div className="admin-readonly-note">
            Modo consulta: puedes revisar las reseñas, pero solo un administrador
            puede aprobarlas, rechazarlas o eliminarlas.
          </div>
        )}

        <div className="admin-filter-bar">
          {filtros.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`admin-filter-chip ${filtro === item.key ? "is-active" : ""}`}
              onClick={() => setFiltro(item.key)}
            >
              {item.label}
              <span className="admin-filter-count">{item.count}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="admin-loading-state">Cargando reseñas...</div>
        ) : resenas.length === 0 ? (
          <div className="admin-loading-state">
            No hay reseñas registradas.
          </div>
        ) : resenasVisibles.length === 0 ? (
          <div className="admin-loading-state">
            No hay reseñas con el estado seleccionado.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Estado</th>
                <th>Calificacion</th>
                <th>Lugar</th>
                <th>Opinion</th>
                <th>Visitante</th>
                <th>Cedula</th>
                <th>Fecha</th>
                {canModerate && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {resenasVisibles.map((resena) => (
                <tr key={resena.id}>
                  <td>
                    <span className={`admin-status-pill ${estadoDe(resena)}`}>
                      {estadoDe(resena)}
                    </span>
                  </td>
                  <td>
                    <Stars value={resena.calificacion || 0} />
                  </td>
                  <td>
                    <strong>{resena.objetivoNombre}</strong>
                    <div className="admin-comment-empty">
                      {resena.isla || "Santa Rosa"}
                    </div>
                  </td>
                  <td className="admin-comment-cell">{resena.opinion}</td>
                  <td>{resena.nombre}</td>
                  <td>{resena.cedula || "-"}</td>
                  <td>{formatDate(resena.fecha)}</td>
                  {canModerate && (
                    <td>
                      <div className="admin-actions-inline">
                        <button
                          className="action-btn edit-btn"
                          onClick={() => updateEstado(resena.id, "aprobada")}
                          title="Aprobar"
                        >
                          <FaCheck className="inline-icon" aria-hidden="true" />
                        </button>
                        <button
                          className="action-btn reject-btn"
                          onClick={() => updateEstado(resena.id, "rechazada")}
                          title="Rechazar"
                        >
                          <FaTimes className="inline-icon" aria-hidden="true" />
                        </button>
                        <button
                          className="action-btn del-btn"
                          onClick={() => del(resena.id)}
                          title="Eliminar"
                        >
                          <FaTrash className="inline-icon" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
