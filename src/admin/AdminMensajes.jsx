import { useCallback, useEffect, useState } from "react";
import { FaEnvelope, FaSyncAlt, FaTrash } from "react-icons/fa";
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

export default function AdminMensajes({
  onLivePreviewChange = () => {},
  onDirtyChange = () => {},
}) {
  const [mensajes, setMensajes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const fetchMensajes = useCallback(async () => {
    const q = query(
      collection(db, "mensajes_contacto"),
      orderBy("fecha", "desc"),
      limit(PAGE_LIMIT),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        remitente: data.remitente || "Anonimo",
        correo: data.correo || "-",
        consulta_sugerencia: data.consulta_sugerencia || "",
        fecha: data.fecha?.toDate?.() || null,
      };
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    void fetchMensajes()
      .then((nextMensajes) => {
        if (isMounted) {
          setMensajes(nextMensajes);
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
  }, [fetchMensajes]);

  const loadMensajes = useCallback(async () => {
    setLoading(true);
    try {
      setMensajes(await fetchMensajes());
    } finally {
      setLoading(false);
    }
  }, [fetchMensajes]);

  useEffect(
    () => () => {
      onDirtyChange(false);
      onLivePreviewChange(null);
    },
    [onDirtyChange, onLivePreviewChange],
  );

  const del = async (id) => {
    if (confirm("Eliminar este mensaje?")) {
      await deleteDoc(doc(db, "mensajes_contacto", id));
      setMensajes((current) => current.filter((mensaje) => mensaje.id !== id));
      if (selected === id) {
        setSelected(null);
      }
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

  return (
    <div>
      <div className="admin-table-card">
        <div className="admin-table-header">
          <h2>
            <FaEnvelope className="inline-icon" aria-hidden="true" />
            Mensajes de Contacto ({mensajes.length})
          </h2>
          <button
            type="button"
            className="btn btn-outline"
            onClick={loadMensajes}
            disabled={loading}
          >
            <FaSyncAlt className="inline-icon" aria-hidden="true" />
            Actualizar
          </button>
        </div>

        {!loading && mensajes.length >= PAGE_LIMIT && (
          <p className="admin-inspector-muted" style={{ padding: "0 1.5rem" }}>
            Mostrando los {PAGE_LIMIT} mensajes mas recientes para reducir
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
            Cargando mensajes...
          </div>
        ) : mensajes.length === 0 ? (
          <div
            style={{
              padding: "2rem",
              textAlign: "center",
              color: "var(--gray-500)",
            }}
          >
            No hay mensajes de contacto recibidos.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Remitente</th>
                <th>Correo</th>
                <th>Fecha</th>
                <th>Consulta / Sugerencia</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {mensajes.map((m) => (
                <tr
                  key={m.id}
                  onClick={() => setSelected(selected === m.id ? null : m.id)}
                  style={{ cursor: "pointer" }}
                >
                  <td>
                    <strong>{m.remitente}</strong>
                  </td>
                  <td>{m.correo}</td>
                  <td>{formatDate(m.fecha)}</td>
                  <td
                    style={{
                      maxWidth: "350px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: selected === m.id ? "normal" : "nowrap",
                    }}
                  >
                    {m.consulta_sugerencia}
                  </td>
                  <td>
                    <button
                      className="action-btn del-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        del(m.id);
                      }}
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
