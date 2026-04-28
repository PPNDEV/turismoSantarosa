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
    <span style={{ color: "#e8a733", fontSize: "1rem", letterSpacing: "2px" }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <FaStar
          key={star}
          style={{ opacity: star <= value ? 1 : 0.2 }}
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

        <div
          style={{
            padding: "1.5rem",
            display: "flex",
            gap: "2rem",
            flexWrap: "wrap",
            borderBottom: "1px solid var(--gray-200)",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: "2rem",
                fontWeight: 700,
                color: "var(--ocean)",
              }}
            >
              {avg}
            </div>
            <div style={{ fontSize: "0.82rem", color: "var(--gray-500)" }}>
              Promedio
            </div>
            <StarRating value={Math.round(Number(avg))} />
          </div>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: "2rem",
                fontWeight: 700,
                color: "var(--gold-dark)",
              }}
            >
              {total}
            </div>
            <div style={{ fontSize: "0.82rem", color: "var(--gray-500)" }}>
              Total respuestas
            </div>
          </div>
          <div style={{ flex: 1, minWidth: "200px" }}>
            {distribution.map((d) => (
              <div
                key={d.star}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "0.25rem",
                }}
              >
                <span
                  style={{
                    width: "20px",
                    textAlign: "right",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                  }}
                >
                  {d.star}*
                </span>
                <div
                  style={{
                    flex: 1,
                    height: "8px",
                    background: "var(--gray-200)",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: total > 0 ? `${(d.count / total) * 100}%` : "0%",
                      height: "100%",
                      background: "var(--ocean)",
                      borderRadius: "4px",
                      transition: "width 0.3s",
                    }}
                  />
                </div>
                <span
                  style={{
                    width: "30px",
                    fontSize: "0.78rem",
                    color: "var(--gray-500)",
                  }}
                >
                  {d.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {!loading && encuestas.length >= PAGE_LIMIT && (
          <p className="admin-inspector-muted" style={{ padding: "0 1.5rem" }}>
            Mostrando las {PAGE_LIMIT} encuestas mas recientes para reducir
            lecturas.
          </p>
        )}

        {loading ? (
          <div
            style={{
              padding: "2rem",
              textAlign: "center",
              color: "var(--gray-500)",
            }}
          >
            Cargando encuestas...
          </div>
        ) : encuestas.length === 0 ? (
          <div
            style={{
              padding: "2rem",
              textAlign: "center",
              color: "var(--gray-500)",
            }}
          >
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
                  <td style={{ maxWidth: "400px" }}>
                    {e.comentarios || (
                      <em style={{ color: "var(--gray-400)" }}>
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
