import { useEffect, useState } from "react";
import { FaBed, FaEdit, FaMapMarkerAlt, FaSave, FaTrash } from "react-icons/fa";
import { useContent } from "../context/useContent";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900";

const emptyHospedaje = {
  nombre: "",
  isla: "Jambelí",
  ubicacion: "",
  servicios: "",
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

function splitServices(services) {
  return String(services || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export default function AdminHospedajes({
  canEdit = true,
  onLivePreviewChange = () => {},
  onDirtyChange = () => {},
}) {
  const { hospedajes, upsertHospedaje, deleteHospedaje } = useContent();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyHospedaje);
  const [initialForm, setInitialForm] = useState(emptyHospedaje);
  const [error, setError] = useState("");

  const openNew = () => {
    if (!canEdit) {
      return;
    }

    setError("");
    const nextForm = { ...emptyHospedaje };
    setForm(nextForm);
    setInitialForm(nextForm);
    setEditing(null);
    setModal(true);
  };

  const openEdit = (hospedaje) => {
    if (!canEdit) {
      return;
    }

    setError("");
    const nextForm = {
      ...hospedaje,
      lat: hospedaje.lat ?? "",
      lng: hospedaje.lng ?? "",
    };
    setForm(nextForm);
    setInitialForm(nextForm);
    setEditing(hospedaje.id);
    setModal(true);
  };

  const closeModal = () => setModal(false);

  const save = () => {
    if (!canEdit) {
      return;
    }

    const nombre = String(form.nombre || "").trim();
    const isla = String(form.isla || "").trim();
    const ubicacion = String(form.ubicacion || "").trim();
    const servicios = String(form.servicios || "").trim();
    const contacto = String(form.contacto || "").trim();

    if (!nombre || !isla || !ubicacion || !servicios || !contacto) {
      setError("Completa nombre, isla, ubicacion, servicios y contacto.");
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

    upsertHospedaje({
      ...form,
      nombre,
      isla,
      ubicacion,
      servicios,
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

    if (confirm("¿Eliminar hospedaje?")) {
      deleteHospedaje(id);
    }
  };

  const previewItem = {
    nombre: form.nombre || "Nombre del hospedaje",
    isla: form.isla || "Jambelí",
    ubicacion: form.ubicacion || "Ubicación por confirmar",
    servicios:
      form.servicios || "Wifi, aire acondicionado, desayunos y recepción",
    contacto: form.contacto || "Contacto por confirmar",
    imagen: form.imagen || FALLBACK_IMAGE,
  };

  useEffect(() => {
    if (!modal) {
      onLivePreviewChange(null);
      return;
    }

    onLivePreviewChange({
      section: "hospedajes",
      path: "/informacion",
      image: previewItem.imagen,
      badge: `${previewItem.isla} · Hospedaje`,
      title: previewItem.nombre,
      subtitle: previewItem.ubicacion,
      body: previewItem.servicios,
      status: canEdit ? "Listo para publicar" : "Solo lectura",
    });
  }, [
    modal,
    previewItem.imagen,
    previewItem.isla,
    previewItem.nombre,
    previewItem.ubicacion,
    previewItem.servicios,
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
          <h2>Hospedajes ({hospedajes.length})</h2>
          <button
            className="btn btn-primary"
            onClick={openNew}
            disabled={!canEdit}
          >
            + Nuevo Hospedaje
          </button>
        </div>

        {!canEdit && (
          <div className="admin-readonly-note">
            Modo visualizador: solo puedes revisar contenido.
          </div>
        )}

        <table>
          <thead>
            <tr>
              <th>Hospedaje</th>
              <th>Isla</th>
              <th>Ubicación</th>
              <th>Contacto</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {hospedajes.map((hospedaje) => (
              <tr key={hospedaje.id}>
                <td>
                  <strong>{hospedaje.nombre}</strong>
                </td>
                <td>{hospedaje.isla}</td>
                <td>{hospedaje.ubicacion}</td>
                <td>{hospedaje.contacto}</td>
                <td>
                  <button
                    className="action-btn edit-btn"
                    onClick={() => openEdit(hospedaje)}
                    disabled={!canEdit}
                  >
                    <FaEdit className="inline-icon" aria-hidden="true" />
                    Editar
                  </button>
                  <button
                    className="action-btn del-btn"
                    onClick={() => del(hospedaje.id)}
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
            <h2>{editing ? "Editar Hospedaje" : "Nuevo Hospedaje"}</h2>
            {error && <div className="login-error">{error}</div>}
            <div className="admin-form-preview-grid">
              <div className="admin-form-column">
                {[
                  ["nombre", "Nombre"],
                  ["ubicacion", "Ubicación"],
                  ["servicios", "Servicios (separados por coma)"],
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
                  Vista previa del hospedaje
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
                      <span className="badge badge-ocean">
                        {previewItem.isla}
                      </span>
                      <h3>{previewItem.nombre}</h3>
                      <div className="info-meta">
                        <FaMapMarkerAlt
                          className="inline-icon"
                          aria-hidden="true"
                        />
                        {previewItem.ubicacion}
                      </div>
                      <div className="info-meta">
                        <FaBed className="inline-icon" aria-hidden="true" />
                        Servicios
                      </div>
                      <ul className="info-list">
                        {splitServices(previewItem.servicios).map(
                          (servicio) => (
                            <li key={`${previewItem.nombre}-${servicio}`}>
                              {servicio}
                            </li>
                          ),
                        )}
                      </ul>
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
