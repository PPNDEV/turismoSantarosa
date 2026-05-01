import { useEffect, useState } from "react";
import { FaCheck, FaTimes, FaInbox } from "react-icons/fa";
import { db } from "../services/firebase";
import {
  collection,
  query,
  onSnapshot,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { functions } from "../services/firebase";

export default function AdminSolicitudes({ onLivePreviewChange = () => {} }) {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "solicitudes_negocios"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSolicitudes(data);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError("Error al cargar las solicitudes. Verifica tus permisos.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    onLivePreviewChange({
      section: "solicitudes",
      path: "/admin",
      image: "https://images.unsplash.com/photo-1512428559087-560fa5ceab42?w=900",
      badge: "Bandeja de Entrada",
      title: `Solicitudes Pendientes: ${solicitudes.length}`,
      subtitle: "Revisa y aprueba negocios",
      body: "Administra las solicitudes enviadas desde la App o formularios web.",
      status: "Moderación",
    });
  }, [solicitudes.length, onLivePreviewChange]);

  const handleApprove = async (solicitud) => {
    setError("");
    setSuccess("");
    setProcessingId(solicitud.id);

    try {
      const { categoria, id, ...datosLimpios } = solicitud;
      
      if (!categoria) {
        throw new Error("La solicitud no tiene una categoría definida.");
      }

      const adminUpsertContent = httpsCallable(functions, "adminUpsertContent");
      await adminUpsertContent({
        nodeKey: categoria,
        itemData: datosLimpios,
        id: id || solicitud.id,
      });
      
      // 2. Eliminar de solicitudes pendientes
      await deleteDoc(doc(db, "solicitudes_negocios", id || solicitud.id));

      setSuccess("Solicitud aprobada y publicada correctamente.");
    } catch (err) {
      setError(err.message || "Error al aprobar la solicitud.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id) => {
    setError("");
    setSuccess("");

    if (!confirm("¿Estás seguro de rechazar y eliminar esta solicitud?")) {
      return;
    }

    setProcessingId(id);

    try {
      await deleteDoc(doc(db, "solicitudes_negocios", id));
      setSuccess("Solicitud rechazada y eliminada.");
    } catch (err) {
      setError(err.message || "Error al rechazar la solicitud.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div>
      <div className="admin-table-card admin-table-card-spaced">
        <div className="admin-table-header">
          <h2>
            <FaInbox className="inline-icon" aria-hidden="true" />
            Solicitudes Pendientes ({solicitudes.length})
          </h2>
        </div>

        {error && <div className="login-error">{error}</div>}
        {success && <div className="admin-success-note">{success}</div>}

        {loading ? (
          <div className="admin-loading">Cargando solicitudes...</div>
        ) : solicitudes.length === 0 ? (
          <div className="admin-readonly-note">
            No hay solicitudes pendientes en este momento.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Negocio</th>
                <th>Categoría</th>
                <th>Contacto</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {solicitudes.map((s) => (
                <tr key={s.id}>
                  <td>
                    <strong>{s.nombre || s.title || "Sin nombre"}</strong>
                  </td>
                  <td>
                    <span className="badge badge-ocean">{s.categoria}</span>
                  </td>
                  <td>{s.contacto || s.email || "No provisto"}</td>
                  <td>
                    <button
                      className="action-btn edit-btn"
                      onClick={() => handleApprove(s)}
                      disabled={processingId === s.id}
                      title="Aprobar y publicar"
                    >
                      <FaCheck className="inline-icon" aria-hidden="true" />
                      Aprobar
                    </button>
                    <button
                      className="action-btn del-btn"
                      onClick={() => handleReject(s.id)}
                      disabled={processingId === s.id}
                      title="Rechazar y eliminar"
                    >
                      <FaTimes className="inline-icon" aria-hidden="true" />
                      Rechazar
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
