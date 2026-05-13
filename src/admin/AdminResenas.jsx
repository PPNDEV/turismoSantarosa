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
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { db } from "../services/firebase";

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
  onLivePreviewChange = () => {},
  onDirtyChange = () => {},
}) {
  const [resenas, setResenas] = useState([]);
  const [loading, setLoading] = useState(true);

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
    await updateDoc(doc(db, "resenas_turisticas", id), { estado });
    setResenas((current) =>
      current.map((resena) =>
        resena.id === id ? { ...resena, estado } : resena,
      ),
    );
  };

  const del = async (id) => {
    if (!confirm("Eliminar esta resena?")) return;
    await deleteDoc(doc(db, "resenas_turisticas", id));
    setResenas((current) => current.filter((resena) => resena.id !== id));
  };

  const totals = {
    total: resenas.length,
    pendientes: resenas.filter((resena) => resena.estado === "pendiente")
      .length,
    aprobadas: resenas.filter((resena) => resena.estado === "aprobada").length,
  };

  return (
    <div>
      <div className="admin-table-card">
        <div className="admin-table-header">
          <h2>
            <FaCommentDots className="inline-icon" aria-hidden="true" />
            Reseñas turisticas ({totals.total})
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

        <div className="admin-survey-summary">
          <div className="admin-survey-metric">
            <div className="admin-survey-value admin-survey-value-ocean">
              {totals.pendientes}
            </div>
            <div className="admin-survey-label">Pendientes</div>
          </div>
          <div className="admin-survey-metric">
            <div className="admin-survey-value admin-survey-value-gold">
              {totals.aprobadas}
            </div>
            <div className="admin-survey-label">Aprobadas</div>
          </div>
        </div>

        {loading ? (
          <div className="admin-loading-state">Cargando reseñas...</div>
        ) : resenas.length === 0 ? (
          <div className="admin-loading-state">
            No hay reseñas registradas.
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
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {resenas.map((resena) => (
                <tr key={resena.id}>
                  <td>
                    <span className={`admin-status-pill ${resena.estado}`}>
                      {resena.estado || "pendiente"}
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
                        className="action-btn del-btn"
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
