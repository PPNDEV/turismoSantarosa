import { useEffect, useState } from "react";
import { FaEnvelope, FaTrash } from "react-icons/fa";
import { collection, onSnapshot, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { db } from "../services/firebase";

export default function AdminMensajes({
  onLivePreviewChange = () => {},
  onDirtyChange = () => {},
}) {
  const [mensajes, setMensajes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "mensajes_contacto"), orderBy("fecha", "desc"));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        setMensajes(
          snapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              remitente: data.remitente || "Anónimo",
              correo: data.correo || "-",
              consulta_sugerencia: data.consulta_sugerencia || "",
              fecha: data.fecha?.toDate?.() || null,
            };
          }),
        );
        setLoading(false);
      },
      () => setLoading(false),
    );
    return () => unsub();
  }, []);

  useEffect(() => () => { onDirtyChange(false); onLivePreviewChange(null); }, [onDirtyChange, onLivePreviewChange]);

  const del = async (id) => {
    if (confirm("¿Eliminar este mensaje?")) {
      await deleteDoc(doc(db, "mensajes_contacto", id));
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
        </div>

        {loading ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "var(--gray-500)" }}>
            Cargando mensajes...
          </div>
        ) : mensajes.length === 0 ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "var(--gray-500)" }}>
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
                  <td><strong>{m.remitente}</strong></td>
                  <td>{m.correo}</td>
                  <td>{formatDate(m.fecha)}</td>
                  <td style={{ maxWidth: "350px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: selected === m.id ? "normal" : "nowrap" }}>
                    {m.consulta_sugerencia}
                  </td>
                  <td>
                    <button className="action-btn del-btn" onClick={(e) => { e.stopPropagation(); del(m.id); }}>
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
