import { useEffect, useState } from "react";
import { FaCamera, FaEdit, FaSave, FaTimes, FaVideo } from "react-icons/fa";
import { useContent } from "../context/useContent";
import AdminImageField from "./AdminImageField";
import { createContentId, uploadContentImage } from "../services/uploadService";

const FALLBACK_GALLERY_IMAGE =
  "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=900";

function hasDraftChanges(currentForm, initialForm) {
  return JSON.stringify(currentForm) !== JSON.stringify(initialForm);
}

export default function AdminGaleria({
  canEdit = true,
  onLivePreviewChange = () => {},
  onDirtyChange = () => {},
}) {
  const { galeria, upsertGaleria, deleteGaleria } = useContent();
  const [form, setForm] = useState({ url: "", titulo: "", tipo: "foto" });
  const [initialForm, setInitialForm] = useState({
    url: "",
    titulo: "",
    tipo: "foto",
  });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const openNew = () => {
    if (!canEdit) {
      return;
    }

    const nextForm = { url: "", titulo: "", tipo: "foto" };
    setForm(nextForm);
    setInitialForm(nextForm);
    setEditing(null);
    setImageFile(null);
    setImagePreviewUrl("");
    setShowForm(true);
  };

  const openEdit = (item) => {
    if (!canEdit) {
      return;
    }

    const nextForm = { ...item };
    setForm(nextForm);
    setInitialForm(nextForm);
    setEditing(item.id);
    setImageFile(null);
    setImagePreviewUrl("");
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;
    setShowForm(false);
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

    if (!form.url && !imageFile) return;
    const itemId = editing || createContentId("galeria", form.titulo);
    setSaving(true);
    try {
      const imageUrl = imageFile
        ? await uploadContentImage(imageFile, "galeria", itemId)
        : form.url;

      await upsertGaleria({ ...form, url: imageUrl, id: itemId });
    } finally {
      setSaving(false);
    }
    const resetForm = { url: "", titulo: "", tipo: "foto" };
    setForm(resetForm);
    setInitialForm(resetForm);
    setEditing(null);
    setImageFile(null);
    setImagePreviewUrl("");
    setShowForm(false);
  };

  const del = (id) => {
    if (!canEdit) {
      return;
    }

    if (confirm("¿Eliminar?")) deleteGaleria(id);
  };

  const previewItem = {
    url: imagePreviewUrl || form.url || FALLBACK_GALLERY_IMAGE,
    titulo: form.titulo || "Título de la imagen",
    tipo: form.tipo || "foto",
  };

  useEffect(() => {
    if (!showForm) {
      onLivePreviewChange(null);
      return;
    }

    onLivePreviewChange({
      section: "galeria",
      path: "/galeria",
      image: previewItem.url,
      badge: previewItem.tipo === "video" ? "Video" : "Foto",
      title: previewItem.titulo,
      subtitle: "Elemento de galería",
      body: "Vista previa de cómo aparecerá en la galería pública.",
      status: "Edición en curso",
    });
  }, [
    showForm,
    previewItem.url,
    previewItem.titulo,
    previewItem.tipo,
    onLivePreviewChange,
  ]);

  useEffect(() => {
    if (!showForm) {
      onDirtyChange(false);
      return;
    }

    onDirtyChange(hasDraftChanges(form, initialForm) || Boolean(imageFile));
  }, [showForm, form, initialForm, imageFile, onDirtyChange]);

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
          <h2>Galería ({galeria.length})</h2>
          <button
            className="btn btn-primary"
            onClick={openNew}
            disabled={!canEdit}
          >
            + Agregar
          </button>
        </div>

        {!canEdit && (
          <div className="admin-readonly-note">
            Modo visualizador: el contenido de galería es solo de lectura.
          </div>
        )}

        {showForm && (
          <div className="admin-inline-editor">
            <div className="admin-inline-editor-fields">
              <AdminImageField
                label="Imagen de galeria"
                value={form.url}
                selectedFile={imageFile}
                onFileChange={handleImageFileChange}
                onUrlChange={(nextUrl) => setForm({ ...form, url: nextUrl })}
              />

              <div className="admin-inline-field">
                <label>Título</label>
                <input
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Descripción..."
                />
              </div>

              <div className="admin-inline-field">
                <label>Tipo</label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                >
                  <option value="foto">Foto</option>
                  <option value="video">Video</option>
                </select>
              </div>

              <div className="admin-inline-actions">
                <button
                  className="btn btn-primary"
                  onClick={save}
                  disabled={saving}
                >
                  <FaSave className="inline-icon" aria-hidden="true" />
                  {saving ? "Guardando..." : "Guardar"}
                </button>
                <button
                  className="btn btn-outline"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancelar
                </button>
              </div>
            </div>

            <div className="admin-inline-preview">
              <h3 className="admin-preview-title">Vista previa de galería</h3>
              <article className="admin-gallery-preview-card">
                <img
                  src={previewItem.url}
                  alt={previewItem.titulo}
                  onError={(e) => {
                    if (e.currentTarget.src !== FALLBACK_GALLERY_IMAGE) {
                      e.currentTarget.src = FALLBACK_GALLERY_IMAGE;
                    }
                  }}
                />
                <div className="admin-gallery-preview-body">
                  <span className="badge badge-ocean">
                    {previewItem.tipo === "video" ? (
                      <>
                        <FaVideo className="inline-icon" aria-hidden="true" />
                        Video
                      </>
                    ) : (
                      <>
                        <FaCamera className="inline-icon" aria-hidden="true" />
                        Foto
                      </>
                    )}
                  </span>
                  <p>{previewItem.titulo}</p>
                </div>
              </article>
            </div>
          </div>
        )}

        <div className="admin-gallery-grid">
          {galeria.map((item) => (
            <div key={item.id} className="admin-gallery-item">
              <img
                src={item.url}
                alt={item.titulo}
                className="admin-gallery-image"
                loading="lazy"
                decoding="async"
              />
              <div className="admin-gallery-title">
                {item.titulo}
              </div>
              <div className="admin-gallery-actions">
                <button
                  className="action-btn edit-btn"
                  onClick={() => openEdit(item)}
                  disabled={!canEdit}
                >
                  <FaEdit className="inline-icon" aria-hidden="true" />
                </button>
              </div>
              <button
                onClick={() => del(item.id)}
                disabled={!canEdit}
                className="admin-gallery-delete"
              >
                <FaTimes aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
