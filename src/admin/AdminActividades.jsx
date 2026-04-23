import { useEffect, useState } from "react";
import { FaEdit, FaHiking, FaMapMarkerAlt, FaSave, FaTrash } from "react-icons/fa";
import { useContent } from "../context/useContent";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=900";

const emptyActividad = {
  nombre: "",
  descripcion: "",
  isla: "Jambelí",
  imagen: "",
  lat: "",
  lng: "",
};

function normalizeCoord(value) {
  if (value === "" || value === null || value === undefined) return "";
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : "";
}

function hasDraftChanges(a, b) {
  return JSON.stringify(a) !== JSON.stringify(b);
}

export default function AdminActividades({
  canEdit = true,
  onLivePreviewChange = () => {},
  onDirtyChange = () => {},
}) {
  const { actividades, upsertActividad, deleteActividad } = useContent();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyActividad);
  const [initialForm, setInitialForm] = useState(emptyActividad);
  const [error, setError] = useState("");

  const openNew = () => {
    if (!canEdit) return;
    setError("");
    const f = { ...emptyActividad };
    setForm(f);
    setInitialForm(f);
    setEditing(null);
    setModal(true);
  };

  const openEdit = (item) => {
    if (!canEdit) return;
    setError("");
    const f = { ...item, lat: item.lat ?? "", lng: item.lng ?? "" };
    setForm(f);
    setInitialForm(f);
    setEditing(item.id);
    setModal(true);
  };

  const closeModal = () => setModal(false);

  const save = () => {
    if (!canEdit) return;
    const nombre = String(form.nombre || "").trim();
    const descripcion = String(form.descripcion || "").trim();
    if (!nombre || !descripcion) {
      setError("Nombre y descripción son obligatorios.");
      return;
    }
    upsertActividad({
      ...form,
      nombre,
      descripcion,
      id: editing || Date.now().toString(),
      lat: normalizeCoord(form.lat),
      lng: normalizeCoord(form.lng),
    });
    setError("");
    closeModal();
  };

  const del = (id) => {
    if (!canEdit) return;
    if (confirm("¿Eliminar actividad?")) deleteActividad(id);
  };

  const preview = {
    nombre: form.nombre || "Nombre de la actividad",
    descripcion: form.descripcion || "Descripción de la actividad turística.",
    isla: form.isla || "Jambelí",
    imagen: form.imagen || FALLBACK_IMAGE,
  };

  useEffect(() => {
    if (!modal) { onLivePreviewChange(null); return; }
    onLivePreviewChange({
      section: "actividades",
      path: "/informacion",
      image: preview.imagen,
      badge: `${preview.isla} · Actividad`,
      title: preview.nombre,
      subtitle: "Actividad turística",
      body: preview.descripcion,
      status: "Listo para publicar",
    });
  }, [modal, preview.imagen, preview.isla, preview.nombre, preview.descripcion, onLivePreviewChange]);

  useEffect(() => {
    if (!modal) { onDirtyChange(false); return; }
    onDirtyChange(hasDraftChanges(form, initialForm));
  }, [modal, form, initialForm, onDirtyChange]);

  useEffect(() => () => { onDirtyChange(false); onLivePreviewChange(null); }, [onDirtyChange, onLivePreviewChange]);

  return (
    <div>
      <div className="admin-table-card">
        <div className="admin-table-header">
          <h2>Actividades ({actividades.length})</h2>
          <button className="btn btn-primary" onClick={openNew} disabled={!canEdit}>
            + Nueva Actividad
          </button>
        </div>

        {!canEdit && (
          <div className="admin-readonly-note">
            Modo visualizador: actividades disponibles solo para consulta.
          </div>
        )}

        <table>
          <thead>
            <tr>
              <th>Actividad</th>
              <th>Isla</th>
              <th>Descripción</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {actividades.map((a) => (
              <tr key={a.id}>
                <td><strong><FaHiking className="inline-icon" aria-hidden="true" /> {a.nombre}</strong></td>
                <td>{a.isla || "-"}</td>
                <td style={{ maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {a.descripcion}
                </td>
                <td>
                  <button className="action-btn edit-btn" onClick={() => openEdit(a)} disabled={!canEdit}>
                    <FaEdit className="inline-icon" aria-hidden="true" /> Editar
                  </button>
                  <button className="action-btn del-btn" onClick={() => del(a.id)} disabled={!canEdit}>
                    <FaTrash className="inline-icon" aria-hidden="true" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box modal-box-preview" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? "Editar Actividad" : "Nueva Actividad"}</h2>
            {error && <div className="login-error">{error}</div>}
            <div className="admin-form-preview-grid">
              <div className="admin-form-column">
                {[
                  ["nombre", "Nombre"],
                  ["imagen", "URL de Imagen"],
                  ["lat", "Latitud"],
                  ["lng", "Longitud"],
                ].map(([f, lbl]) => (
                  <div key={f} className="modal-field">
                    <label>{lbl}</label>
                    <input type="text" value={form[f] || ""} onChange={(e) => setForm({ ...form, [f]: e.target.value })} />
                  </div>
                ))}

                <div className="modal-field">
                  <label>Isla</label>
                  <select value={form.isla} onChange={(e) => setForm({ ...form, isla: e.target.value })}>
                    <option value="Jambelí">Jambelí</option>
                    <option value="Costa Rica">Costa Rica</option>
                    <option value="San Gregorio">San Gregorio</option>
                  </select>
                </div>

                <div className="modal-field">
                  <label>Descripción</label>
                  <textarea value={form.descripcion || ""} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
                </div>

                <div className="modal-actions">
                  <button className="btn btn-outline" onClick={closeModal}>Cancelar</button>
                  <button className="btn btn-primary" onClick={save}>
                    <FaSave className="inline-icon" aria-hidden="true" /> Guardar
                  </button>
                </div>
              </div>

              <div className="admin-preview-column">
                <h3 className="admin-preview-title">Vista previa</h3>
                <div className="admin-preview-card-frame">
                  <article className="info-card admin-preview-info-card">
                    <img src={preview.imagen} alt={preview.nombre} onError={(e) => { if (e.currentTarget.src !== FALLBACK_IMAGE) e.currentTarget.src = FALLBACK_IMAGE; }} />
                    <div className="info-card-body">
                      <span className="badge badge-ocean">{preview.isla}</span>
                      <h3>{preview.nombre}</h3>
                      <p>{preview.descripcion}</p>
                    </div>
                  </article>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
