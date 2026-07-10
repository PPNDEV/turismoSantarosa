import { useEffect, useMemo, useState } from "react";
import { FaBed, FaEdit, FaMapMarkerAlt, FaSave, FaTrash } from "react-icons/fa";
import { useContent } from "../context/useContent";
import AdminImageField from "./AdminImageField";
import AdminContentThumb from "./AdminContentThumb";
import AdminCoordinatesField from "./AdminCoordinatesField";
import { createContentId, uploadContentImage } from "../services/uploadService";
import {
  canManageContentItem,
  getEditorOwnershipNote,
  getVisibleAdminItems,
} from "./adminOwnership";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900";

const emptyHospedaje = {
  nombre: "",
  isla: "Jambelí",
  ubicacion: "",
  servicios: "",
  contacto: "",
  imagen: "",
};

function hasDraftChanges(currentForm, initialForm) {
  return JSON.stringify(currentForm) !== JSON.stringify(initialForm);
}

function splitServices(services) {
  return String(services || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export default function AdminHospedajes({
  canEdit = true,
  currentUser = null,
  onLivePreviewChange = () => {},
  onDirtyChange = () => {},
}) {
  const { hospedajes, upsertHospedaje, deleteHospedaje } = useContent();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyHospedaje);
  const [initialForm, setInitialForm] = useState(emptyHospedaje);
  const [error, setError] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const visibleHospedajes = useMemo(
    () => getVisibleAdminItems(hospedajes, currentUser, canEdit),
    [hospedajes, currentUser, canEdit],
  );
  const ownershipNote = getEditorOwnershipNote(currentUser, canEdit);
  const canCreateHospedaje = canManageContentItem(null, currentUser, canEdit);

  const openNew = () => {
    if (!canCreateHospedaje) {
      return;
    }

    setError("");
    const nextForm = { ...emptyHospedaje };
    setForm(nextForm);
    setInitialForm(nextForm);
    setImageFile(null);
    setImagePreviewUrl("");
    setEditing(null);
    setModal(true);
  };

  const openEdit = (hospedaje) => {
    if (!canManageContentItem(hospedaje, currentUser, canEdit)) {
      return;
    }

    setError("");
    const nextForm = { ...hospedaje };
    setForm(nextForm);
    setInitialForm(nextForm);
    setImageFile(null);
    setImagePreviewUrl("");
    setEditing(hospedaje.id);
    setModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModal(false);
    setImageFile(null);
    setImagePreviewUrl("");
  };

  const handleImageFileChange = (file) => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImageFile(file);
    setImagePreviewUrl(file ? URL.createObjectURL(file) : "");
  };

  const save = async () => {
    if (
      !canManageContentItem(editing ? initialForm : null, currentUser, canEdit) ||
      saving
    ) {
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

    const itemId = editing || createContentId("hospedaje", nombre);
    setSaving(true);
    try {
      try {
        const imageUrl = imageFile
          ? await uploadContentImage(imageFile, "hospedajes", itemId)
          : form.imagen;

        await upsertHospedaje({
          ...form,
          imagen: imageUrl,
          nombre,
          isla,
          ubicacion,
          servicios,
          contacto,
          id: itemId,
        });
        setForm(emptyHospedaje);
        setInitialForm(emptyHospedaje);
        setError("");
        setModal(false);
        setImageFile(null);
        setImagePreviewUrl("");
      } finally {
        setSaving(false);
      }
    } catch (err) {
      console.error("Error al guardar hospedaje:", err);
      setError("Error al guardar: " + (err.message || "Error desconocido"));
    }
  };

  const del = (hospedaje) => {
    if (!canManageContentItem(hospedaje, currentUser, canEdit)) {
      return;
    }

    if (confirm("¿Eliminar hospedaje?")) {
      deleteHospedaje(hospedaje.id);
    }
  };

  const previewItem = {
    nombre: form.nombre || "Nombre del hospedaje",
    isla: form.isla || "Jambelí",
    ubicacion: form.ubicacion || "Ubicación por confirmar",
    servicios:
      form.servicios || "Wifi, aire acondicionado, desayunos y recepción",
    contacto: form.contacto || "Contacto por confirmar",
    imagen: imagePreviewUrl || form.imagen || FALLBACK_IMAGE,
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

    onDirtyChange(hasDraftChanges(form, initialForm) || Boolean(imageFile));
  }, [modal, form, initialForm, imageFile, onDirtyChange]);

  useEffect(
    () => () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
      onDirtyChange(false);
      onLivePreviewChange(null);
    },
    [imagePreviewUrl, onDirtyChange, onLivePreviewChange],
  );

  return (
    <div>
      <div className="admin-table-card">
        <div className="admin-table-header">
          <h2>
            <FaBed className="inline-icon" aria-hidden="true" />
            Hospedajes ({visibleHospedajes.length})
          </h2>
          <button
            className="btn btn-primary"
            onClick={openNew}
            disabled={!canCreateHospedaje}
          >
            + Nuevo Hospedaje
          </button>
        </div>

        {!canEdit && (
          <div className="admin-readonly-note">
            Modo visualizador: solo puedes revisar contenido.
          </div>
        )}
        {ownershipNote && (
          <div className="admin-readonly-note">{ownershipNote}</div>
        )}

        <div className="admin-table-scroll">
        <table className="admin-content-table">
          <thead>
            <tr>
              <th>Imagen</th>
              <th>Hospedaje</th>
              <th>Isla</th>
              <th>Ubicación</th>
              <th>Contacto</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {visibleHospedajes.map((hospedaje) => (
              <tr key={hospedaje.id}>
                <td><AdminContentThumb src={hospedaje.imagen} alt={`Imagen de ${hospedaje.nombre}`} /></td>
                <td>
                  <strong>{hospedaje.nombre}</strong>
                </td>
                <td>{hospedaje.isla}</td>
                <td>{hospedaje.ubicacion}</td>
                <td>{hospedaje.contacto}</td>
                <td><div className="admin-actions-inline">
                  <button
                    className="action-btn edit-btn icon-btn"
                    onClick={() => openEdit(hospedaje)}
                    disabled={
                      !canManageContentItem(hospedaje, currentUser, canEdit)
                    }
                    title="Editar hospedaje"
                    aria-label={`Editar ${hospedaje.nombre}`}
                  >
                    <FaEdit className="inline-icon" aria-hidden="true" />
                  </button>
                  <button
                    className="action-btn del-btn icon-btn"
                    onClick={() => del(hospedaje)}
                    disabled={
                      !canManageContentItem(hospedaje, currentUser, canEdit)
                    }
                    title="Eliminar hospedaje"
                    aria-label={`Eliminar ${hospedaje.nombre}`}
                  >
                    <FaTrash className="inline-icon" aria-hidden="true" />
                  </button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay">
          <div
            className="modal-box modal-box-preview"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close-btn"
              onClick={closeModal}
              disabled={saving}
              aria-label="Cerrar"
            >
              x
            </button>
            <h2>{editing ? "Editar Hospedaje" : "Nuevo Hospedaje"}</h2>
            {error && (
              <div className="admin-alert admin-alert-error">{error}</div>
            )}
            <div className="admin-form-preview-grid">
              <div className="admin-form-column">
                {[
                  ["nombre", "Nombre"],
                  ["ubicacion", "Ubicación"],
                  ["servicios", "Servicios (separados por coma)"],
                  ["contacto", "Contacto"],
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

                <AdminImageField
                  label="Imagen del hospedaje"
                  value={form.imagen}
                  selectedFile={imageFile}
                  onFileChange={handleImageFileChange}
                  onUrlChange={(nextUrl) =>
                    setForm({ ...form, imagen: nextUrl })
                  }
                />

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

                <AdminCoordinatesField
                  lat={form.lat}
                  lng={form.lng}
                  onChange={(lat, lng) => setForm({ ...form, lat, lng })}
                />

                <div className="modal-actions">
                  <button
                    className="btn btn-outline"
                    onClick={closeModal}
                    disabled={saving}
                  >
                    Cancelar
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={save}
                    disabled={saving}
                  >
                    <FaSave className="inline-icon" aria-hidden="true" />
                    {saving ? "Guardando..." : "Guardar"}
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
                      loading="lazy"
                      decoding="async"
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
