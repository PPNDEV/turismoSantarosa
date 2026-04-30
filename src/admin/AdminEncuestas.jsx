import { useCallback, useEffect, useState } from "react";
import { FaChartPie, FaStar, FaSyncAlt, FaTrash } from "react-icons/fa";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../services/firebase";

const PAGE_LIMIT = 50;

function StarRating({ value }) {
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

export default function AdminEncuestas({
  onLivePreviewChange = () => {},
  onDirtyChange = () => {},
}) {
  const [encuestas, setEncuestas] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEncuestas = useCallback(async () => {
    const q = query(
      collection(db, "encuestas_satisfaccion"),
      orderBy("fecha", "desc"),
      limit(PAGE_LIMIT),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        puntuacion: data.puntuacion || 0,
        comentarios: data.comentarios || "",
        fecha: data.fecha?.toDate?.() || null,
      };
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    void fetchEncuestas()
      .then((nextEncuestas) => {
        if (isMounted) {
          setEncuestas(nextEncuestas);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [fetchEncuestas]);

  const loadEncuestas = useCallback(async () => {
    setLoading(true);
    try {
      setEncuestas(await fetchEncuestas());
    } finally {
      setLoading(false);
    }
  }, [fetchEncuestas]);

  useEffect(
    () => () => {
      onDirtyChange(false);
      onLivePreviewChange(null);
    },
    [onDirtyChange, onLivePreviewChange],
  );

  const del = async (id) => {
    if (confirm("Eliminar esta encuesta?")) {
      await deleteDoc(doc(db, "encuestas_satisfaccion", id));
      setEncuestas((current) =>
        current.filter((encuesta) => encuesta.id !== id),
      );
    }
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return date.toLocaleDateString("es-EC", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const total = encuestas.length;
  const avg =
    total > 0
      ? (encuestas.reduce((sum, e) => sum + e.puntuacion, 0) / total).toFixed(1)
      : "0.0";
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: encuestas.filter((e) => e.puntuacion === star).length,
  }));

  return (
    <div>
      <div className="admin-table-card">
        <div className="admin-table-header">
          <h2>
            <FaChartPie className="inline-icon" aria-hidden="true" />
            Encuestas de Satisfaccion ({total})
          </h2>
          <button
            type="button"
            className="btn btn-outline"
            onClick={loadEncuestas}
            disabled={loading}
          >
            <FaSyncAlt className="inline-icon" aria-hidden="true" />
            Actualizar
          </button>
        </div>

        <div className="admin-survey-summary">
          <div className="admin-survey-metric">
            <div className="admin-survey-value admin-survey-value-ocean">
              {avg}
            </div>
            <div className="admin-survey-label">
              Promedio
            </div>
            <StarRating value={Math.round(Number(avg))} />
          </div>
          <div className="admin-survey-metric">
            <div className="admin-survey-value admin-survey-value-gold">
              {total}
            </div>
            <div className="admin-survey-label">
              Total respuestas
            </div>
          </div>
          <div className="admin-survey-distribution">
            {distribution.map((d) => (
              <div key={d.star} className="admin-survey-dist-row">
                <span className="admin-survey-dist-star">
                  {d.star}*
                </span>
                <progress
                  className="admin-survey-progress"
                  value={d.count}
                  max={total || 1}
                />
                <span className="admin-survey-dist-count">
                  {d.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {!loading && encuestas.length >= PAGE_LIMIT && (
          <p className="admin-inspector-muted admin-inspector-pad">
            Mostrando las {PAGE_LIMIT} encuestas mas recientes para reducir
            lecturas.
          </p>
        )}

        {loading ? (
          <div className="admin-loading-state">
            Cargando encuestas...
          </div>
        ) : encuestas.length === 0 ? (
          <div className="admin-loading-state">
            No hay encuestas de satisfaccion registradas.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Puntuacion</th>
                <th>Comentarios</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {encuestas.map((e) => (
                <tr key={e.id}>
                  <td>
                    <StarRating value={e.puntuacion} />
                  </td>
                  <td className="admin-comment-cell">
                    {e.comentarios || (
                      <em className="admin-comment-empty">
                        Sin comentarios
                      </em>
                    )}
                  </td>
                  <td>{formatDate(e.fecha)}</td>
                  <td>
                    <button
                      className="action-btn del-btn"
                      onClick={() => del(e.id)}
                    >
                      <FaTrash className="inline-icon" aria-hidden="true" />
                    </button>
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
