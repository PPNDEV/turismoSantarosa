import { useEffect, useState } from "react";
import { FaEdit, FaSave, FaTrash, FaUtensils } from "react-icons/fa";
import { useContent } from "../context/useContent";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=900";

const emptyRestaurante = {
  nombre: "",
  isla: "Jambelí",
  platoTipico: "",
  descripcion: "",
  ubicacion: "",
  horario: "",
  contacto: "",
  imagen: "",
  lat: "",
  lng: "",
};

function hasDraftChanges(currentForm, initialForm) {
  return JSON.stringify(currentForm) !== JSON.stringify(initialForm);
}

function normalizeCoord(value) {
  if (value === "" || value === null || value === undefined) {
    return "";
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : "";
}

export default function AdminGastronomia({
  canEdit = true,
  onLivePreviewChange = () => {},
  onDirtyChange = () => {},
}) {
  const { gastronomia, upsertGastronomia, deleteGastronomia } = useContent();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyRestaurante);
  const [initialForm, setInitialForm] = useState(emptyRestaurante);
  const [error, setError] = useState("");

  const openNew = () => {
    if (!canEdit) {
      return;
    }

    setError("");
    const nextForm = { ...emptyRestaurante };
    setForm(nextForm);
    setInitialForm(nextForm);
    setEditing(null);
    setModal(true);
  };

  const openEdit = (restaurante) => {
    if (!canEdit) {
      return;
    }

    setError("");
    const nextForm = {
      ...restaurante,
      lat: restaurante.lat ?? "",
      lng: restaurante.lng ?? "",
    };
    setForm(nextForm);
    setInitialForm(nextForm);
    setEditing(restaurante.id);
    setModal(true);
  };

  const closeModal = () => setModal(false);

  const save = () => {
    if (!canEdit) {
      return;
    }

    const nombre = String(form.nombre || "").trim();
    const isla = String(form.isla || "").trim();
    const platoTipico = String(form.platoTipico || "").trim();
    const ubicacion = String(form.ubicacion || "").trim();
    const contacto = String(form.contacto || "").trim();

    if (!nombre || !isla || !platoTipico || !ubicacion || !contacto) {
      setError("Completa nombre, isla, plato tipico, ubicacion y contacto.");
      return;
    }

    if (form.lat !== "" && Number.isNaN(Number(form.lat))) {
      setError("La latitud debe ser un numero valido o quedar vacia.");
      return;
    }

    if (form.lng !== "" && Number.isNaN(Number(form.lng))) {
      setError("La longitud debe ser un numero valido o quedar vacia.");
      return;
    }

    upsertGastronomia({
      ...form,
      nombre,
      isla,
      platoTipico,
      ubicacion,
      contacto,
      id: editing || Date.now().toString(),
      lat: normalizeCoord(form.lat),
      lng: normalizeCoord(form.lng),
    });
    setError("");
    closeModal();
  };

  const del = (id) => {
    if (!canEdit) {
      return;
    }

    if (confirm("¿Eliminar restaurante?")) {
      deleteGastronomia(id);
    }
  };

  const previewItem = {
    nombre: form.nombre || "Nombre del restaurante",
    isla: form.isla || "Jambelí",
    platoTipico: form.platoTipico || "Plato típico principal",
    descripcion:
      form.descripcion ||
      "Descripción del restaurante y su propuesta gastronómica.",
    ubicacion: form.ubicacion || "Ubicación por confirmar",
    horario: form.horario || "Horario por confirmar",
    contacto: form.contacto || "Contacto por confirmar",
    imagen: form.imagen || FALLBACK_IMAGE,
  };

  useEffect(() => {
    if (!modal) {
      onLivePreviewChange(null);
      return;
    }

    onLivePreviewChange({
      section: "gastronomia",
      path: "/informacion",
      image: previewItem.imagen,
      badge: `${previewItem.isla} · Gastronomia`,
      title: previewItem.nombre,
      subtitle: previewItem.platoTipico,
      body: previewItem.descripcion,
      status: canEdit ? "Listo para publicar" : "Solo lectura",
    });
  }, [
    modal,
    previewItem.imagen,
    previewItem.isla,
    previewItem.nombre,
    previewItem.platoTipico,
    previewItem.descripcion,
    canEdit,
    onLivePreviewChange,
  ]);

  useEffect(() => {
    if (!modal) {
      onDirtyChange(false);
      return;
    }

    onDirtyChange(hasDraftChanges(form, initialForm));
  }, [modal, form, initialForm, onDirtyChange]);

  useEffect(
    () => () => {
      onDirtyChange(false);
      onLivePreviewChange(null);
    },
    [onDirtyChange, onLivePreviewChange],
  );

  return (
    <div>
      <div className="admin-table-card">
        <div className="admin-table-header">
          <h2>Restaurantes ({gastronomia.length})</h2>
          <button
            className="btn btn-primary"
            onClick={openNew}
            disabled={!canEdit}
          >
            + Nuevo Restaurante
          </button>
        </div>

        {!canEdit && (
          <div className="admin-readonly-note">
            Modo visualizador: puedes consultar datos, pero no crear ni editar.
          </div>
        )}

        <table>
          <thead>
            <tr>
              <th>Restaurante</th>
              <th>Isla</th>
              <th>Plato típico</th>
              <th>Contacto</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {gastronomia.map((restaurante) => (
              <tr key={restaurante.id}>
                <td>
                  <strong>{restaurante.nombre}</strong>
                </td>
                <td>{restaurante.isla}</td>
                <td>{restaurante.platoTipico}</td>
                <td>{restaurante.contacto}</td>
                <td>
                  <button
                    className="action-btn edit-btn"
                    onClick={() => openEdit(restaurante)}
                    disabled={!canEdit}
                  >
                    <FaEdit className="inline-icon" aria-hidden="true" />
                    Editar
                  </button>
                  <button
                    className="action-btn del-btn"
                    onClick={() => del(restaurante.id)}
                    disabled={!canEdit}
                  >
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
          <div
            className="modal-box modal-box-preview"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>{editing ? "Editar Restaurante" : "Nuevo Restaurante"}</h2>
            {error && <div className="login-error">{error}</div>}
            <div className="admin-form-preview-grid">
              <div className="admin-form-column">
                {[
                  ["nombre", "Nombre"],
                  ["platoTipico", "Plato típico"],
                  ["ubicacion", "Ubicación"],
                  ["horario", "Horario"],
                  ["contacto", "Contacto"],
                  ["imagen", "URL de Imagen"],
                  ["lat", "Latitud"],
                  ["lng", "Longitud"],
                ].map(([field, label]) => (
                  <div key={field} className="modal-field">
                    <label>{label}</label>
                    <input
                      type="text"
                      value={form[field] ?? ""}
                      onChange={(e) =>
                        setForm({ ...form, [field]: e.target.value })
                      }
                    />
                  </div>
                ))}

                <div className="modal-field">
                  <label>Isla</label>
                  <select
                    value={form.isla}
                    onChange={(e) => setForm({ ...form, isla: e.target.value })}
                  >
                    <option value="Jambelí">Jambelí</option>
                    <option value="Costa Rica">Costa Rica</option>
                    <option value="San Gregorio">San Gregorio</option>
                  </select>
                </div>

                <div className="modal-field">
                  <label>Descripción</label>
                  <textarea
                    value={form.descripcion}
                    onChange={(e) =>
                      setForm({ ...form, descripcion: e.target.value })
                    }
                  />
                </div>

                <div className="modal-actions">
                  <button className="btn btn-outline" onClick={closeModal}>
                    Cancelar
                  </button>
                  <button className="btn btn-primary" onClick={save}>
                    <FaSave className="inline-icon" aria-hidden="true" />
                    Guardar
                  </button>
                </div>
              </div>

              <div className="admin-preview-column">
                <h3 className="admin-preview-title">
                  Vista previa del restaurante
                </h3>
                <div className="admin-preview-card-frame">
                  <article className="info-card admin-preview-info-card">
                    <img
                      src={previewItem.imagen}
                      alt={previewItem.nombre}
                      onError={(e) => {
                        if (e.currentTarget.src !== FALLBACK_IMAGE) {
                          e.currentTarget.src = FALLBACK_IMAGE;
                        }
                      }}
                    />
                    <div className="info-card-body">
                      <span className="badge badge-gold">
                        {previewItem.isla}
                      </span>
                      <h3>{previewItem.nombre}</h3>
                      <div className="info-meta">
                        <FaUtensils
                          className="inline-icon"
                          aria-hidden="true"
                        />
                        {previewItem.platoTipico}
                      </div>
                      <p>{previewItem.descripcion}</p>
                      <div className="info-meta">{previewItem.ubicacion}</div>
                      <div className="info-meta">{previewItem.contacto}</div>
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
