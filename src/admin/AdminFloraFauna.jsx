import { useEffect, useState } from "react";
import { FaEdit, FaLeaf, FaPaw, FaSave, FaTrash } from "react-icons/fa";
import { useContent } from "../context/useContent";
import AdminImageField from "./AdminImageField";
import { createContentId, uploadContentImage } from "./adminImageUpload";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=900";

const emptyRegistro = {
  nombre: "",
  tipo: "Flora",
  zona: "",
  estado: "",
  descripcion: "",
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

export default function AdminFloraFauna({
  canEdit = true,
  onLivePreviewChange = () => {},
  onDirtyChange = () => {},
}) {
  const { floraFauna, upsertFloraFauna, deleteFloraFauna } = useContent();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyRegistro);
  const [initialForm, setInitialForm] = useState(emptyRegistro);
  const [error, setError] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const openNew = () => {
    if (!canEdit) {
      return;
    }

    setError("");
    const nextForm = { ...emptyRegistro };
    setForm(nextForm);
    setInitialForm(nextForm);
    setImageFile(null);
    setImagePreviewUrl("");
    setEditing(null);
    setModal(true);
  };

  const openEdit = (registro) => {
    if (!canEdit) {
      return;
    }

    setError("");
    const nextForm = {
      ...registro,
      lat: registro.lat ?? "",
      lng: registro.lng ?? "",
    };
    setForm(nextForm);
    setInitialForm(nextForm);
    setImageFile(null);
    setImagePreviewUrl("");
    setEditing(registro.id);
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
    if (!canEdit || saving) {
      return;
    }

    const nombre = String(form.nombre || "").trim();
    const tipo = String(form.tipo || "").trim();
    const zona = String(form.zona || "").trim();
    const estado = String(form.estado || "").trim();
    const descripcion = String(form.descripcion || "").trim();

    if (!nombre || !tipo || !zona || !descripcion) {
      setError("Completa nombre, tipo, zona y descripcion.");
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

    const itemId = editing || createContentId("flora-fauna", nombre);
    setSaving(true);
    try {
      const imageUrl = imageFile
        ? await uploadContentImage(imageFile, "floraFauna", itemId)
        : form.imagen;

      await upsertFloraFauna({
        ...form,
        imagen: imageUrl,
        nombre,
        tipo,
        zona,
        estado,
        descripcion,
        id: itemId,
        lat: normalizeCoord(form.lat),
        lng: normalizeCoord(form.lng),
      });
    } finally {
      setSaving(false);
    }
    setError("");
    setModal(false);
    setImageFile(null);
    setImagePreviewUrl("");
  };

  const del = (id) => {
    if (!canEdit) {
      return;
    }

    if (confirm("¿Eliminar registro de flora/fauna?")) {
      deleteFloraFauna(id);
    }
  };

  const previewItem = {
    nombre: form.nombre || "Nombre de la especie",
    tipo: form.tipo || "Flora",
    zona: form.zona || "Zona por confirmar",
    estado: form.estado || "Estado de conservación",
    descripcion:
      form.descripcion ||
      "Descripción de la especie y recomendaciones para el visitante.",
    imagen: imagePreviewUrl || form.imagen || FALLBACK_IMAGE,
  };

  useEffect(() => {
    if (!modal) {
      onLivePreviewChange(null);
      return;
    }

    onLivePreviewChange({
      section: "floraFauna",
      path: "/informacion",
      image: previewItem.imagen,
      badge: previewItem.tipo,
      title: previewItem.nombre,
      subtitle: previewItem.zona,
      body: previewItem.descripcion,
      status: canEdit ? "Listo para publicar" : "Solo lectura",
    });
  }, [
    modal,
    previewItem.imagen,
    previewItem.tipo,
    previewItem.nombre,
    previewItem.zona,
    previewItem.descripcion,
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
          <h2>Flora y Fauna ({floraFauna.length})</h2>
          <button
            className="btn btn-primary"
            onClick={openNew}
            disabled={!canEdit}
          >
            + Nuevo Registro
          </button>
        </div>

        {!canEdit && (
          <div className="admin-readonly-note">
            Modo visualizador: el contenido es solo de consulta.
          </div>
        )}

        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Zona</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {floraFauna.map((registro) => (
              <tr key={registro.id}>
                <td>
                  <strong>{registro.nombre}</strong>
                </td>
                <td>{registro.tipo}</td>
                <td>{registro.zona}</td>
                <td>{registro.estado}</td>
                <td>
                  <button
                    className="action-btn edit-btn"
                    onClick={() => openEdit(registro)}
                    disabled={!canEdit}
                  >
                    <FaEdit className="inline-icon" aria-hidden="true" />
                    Editar
                  </button>
                  <button
                    className="action-btn del-btn"
                    onClick={() => del(registro.id)}
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
            <h2>{editing ? "Editar Registro" : "Nuevo Registro"}</h2>
            {error && <div className="login-error">{error}</div>}
            <div className="admin-form-preview-grid">
              <div className="admin-form-column">
                {[
                  ["nombre", "Nombre"],
                  ["zona", "Zona turística"],
                  ["estado", "Estado"],
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

                <AdminImageField
                  label="Imagen de flora/fauna"
                  value={form.imagen}
                  selectedFile={imageFile}
                  onFileChange={handleImageFileChange}
                  onUrlChange={(nextUrl) =>
                    setForm({ ...form, imagen: nextUrl })
                  }
                />

                <div className="modal-field">
                  <label>Tipo</label>
                  <select
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  >
                    <option value="Flora">Flora</option>
                    <option value="Fauna">Fauna</option>
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
                  Vista previa de flora/fauna
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
                        {previewItem.tipo}
                      </span>
                      <h3>{previewItem.nombre}</h3>
                      <p>{previewItem.descripcion}</p>
                      <div className="info-meta">
                        <FaLeaf className="inline-icon" aria-hidden="true" />
                        {previewItem.zona}
                      </div>
                      <div className="info-meta">
                        <FaPaw className="inline-icon" aria-hidden="true" />
                        {previewItem.estado}
                      </div>
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
