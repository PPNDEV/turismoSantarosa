import { useEffect, useMemo, useState } from "react";
import { FaCheck, FaIdCard, FaStore, FaTimes } from "react-icons/fa";
import { collection, onSnapshot, query } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../services/firebase";
import { useAuth } from "../context/useAuth";

const ESTADO_LABEL = {
  pendiente_ruc: "Pendiente de RUC",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
};

const CATEGORIA_LABEL = {
  gastronomia: "Gastronomía",
  hospedajes: "Hospedaje",
  actividades: "Actividades",
  eventos: "Eventos",
  transporte: "Transporte",
  floraFauna: "Naturaleza",
  otro: "Otro",
};

export default function AdminEditores({ onLivePreviewChange = () => {} }) {
  const { refreshUsers } = useAuth();
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "solicitudes_editores")),
      (snapshot) => {
        const data = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setSolicitudes(data);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError("Error al cargar las solicitudes. Verifica tus permisos.");
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const pendientes = useMemo(
    () => solicitudes.filter((s) => s.estado === "pendiente_ruc"),
    [solicitudes],
  );
  const historico = useMemo(
    () => solicitudes.filter((s) => s.estado !== "pendiente_ruc"),
    [solicitudes],
  );

  useEffect(() => {
    onLivePreviewChange({
      section: "editores",
      path: "/admin",
      image:
        "https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=900",
      badge: "Validación de RUC",
      title: `Solicitudes de editor: ${pendientes.length}`,
      subtitle: "Valida el RUC y activa cuentas",
      body: "Aprueba comerciantes locales para que gestionen su propio catálogo.",
      status: "Moderación",
    });
  }, [pendientes.length, onLivePreviewChange]);

  useEffect(() => {
    if (!success && !error) return undefined;
    const timer = setTimeout(() => {
      setSuccess("");
      setError("");
    }, 4500);
    return () => clearTimeout(timer);
  }, [success, error]);

  const handleApprove = async (solicitud) => {
    setError("");
    setSuccess("");
    setProcessingId(solicitud.id);
    try {
      const aprobar = httpsCallable(functions, "aprobarSolicitudEditor");
      await aprobar({ uid: solicitud.uid || solicitud.id });
      // Recarga la lista de usuarios para que el editor recién aprobado aparezca
      // de inmediato en la sección "Usuarios".
      await refreshUsers();
      setSuccess(`${solicitud.negocio || "Editor"} aprobado correctamente.`);
    } catch (err) {
      setError(err.message || "Error al aprobar la solicitud.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (solicitud) => {
    setError("");
    setSuccess("");
    if (!confirm("¿Rechazar esta solicitud? La cuenta quedará deshabilitada.")) {
      return;
    }
    setProcessingId(solicitud.id);
    try {
      const rechazar = httpsCallable(functions, "rechazarSolicitudEditor");
      await rechazar({ uid: solicitud.uid || solicitud.id });
      setSuccess("Solicitud rechazada.");
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
            <FaStore className="inline-icon" aria-hidden="true" />
            Solicitudes de editor ({pendientes.length})
          </h2>
        </div>

        {error && <div className="admin-alert admin-alert-error">{error}</div>}
        {success && (
          <div className="admin-alert admin-alert-success">{success}</div>
        )}

        {loading ? (
          <div className="admin-loading-state">Cargando solicitudes...</div>
        ) : pendientes.length === 0 ? (
          <div className="admin-empty-state">
            <span className="admin-empty-icon">
              <FaIdCard aria-hidden="true" />
            </span>
            <h3>Sin solicitudes pendientes</h3>
            <p>
              Cuando un comerciante local se registre como editor desde el sitio
              web, su solicitud con RUC aparecerá aquí para que valides y
              actives su cuenta.
            </p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Negocio</th>
                <th>Responsable</th>
                <th>RUC</th>
                <th>Categoría</th>
                <th>Isla</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pendientes.map((s) => (
                <tr key={s.id}>
                  <td>
                    <strong>{s.negocio || "Sin nombre"}</strong>
                  </td>
                  <td>
                    {s.nombre || "-"}
                    <br />
                    <small>{s.email}</small>
                  </td>
                  <td>{s.ruc}</td>
                  <td>
                    <span className="badge badge-ocean">
                      {CATEGORIA_LABEL[s.categoria] || s.categoria || "Otro"}
                    </span>
                  </td>
                  <td>{s.isla || "-"}</td>
                  <td>
                    <button
                      className="action-btn edit-btn"
                      onClick={() => handleApprove(s)}
                      disabled={processingId === s.id}
                      title="Validar RUC y activar editor"
                    >
                      <FaCheck className="inline-icon" aria-hidden="true" />
                      Aprobar
                    </button>
                    <button
                      className="action-btn del-btn"
                      onClick={() => handleReject(s)}
                      disabled={processingId === s.id}
                      title="Rechazar y deshabilitar cuenta"
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

      {historico.length > 0 && (
        <div className="admin-table-card admin-table-card-spaced">
          <div className="admin-table-header">
            <h2>Historial</h2>
          </div>
          <table>
            <thead>
              <tr>
                <th>Negocio</th>
                <th>Responsable</th>
                <th>RUC</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {historico.map((s) => (
                <tr key={s.id}>
                  <td>
                    <strong>{s.negocio || "Sin nombre"}</strong>
                  </td>
                  <td>{s.nombre || s.email || "-"}</td>
                  <td>{s.ruc}</td>
                  <td>
                    <span
                      className={`badge ${s.estado === "aprobada" ? "badge-ocean" : "badge-gold"}`}
                    >
                      {ESTADO_LABEL[s.estado] || s.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
