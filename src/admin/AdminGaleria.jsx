import { useEffect, useState } from "react";
import { FaCamera, FaEdit, FaSave, FaTimes, FaVideo } from "react-icons/fa";
import { useContent } from "../context/useContent";

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

  const openNew = () => {
    if (!canEdit) {
      return;
    }

    const nextForm = { url: "", titulo: "", tipo: "foto" };
    setForm(nextForm);
    setInitialForm(nextForm);
    setEditing(null);
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
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
  };

  const save = () => {
    if (!canEdit) {
      return;
    }

    if (!form.url) return;
    upsertGaleria({ ...form, id: editing || Date.now().toString() });
    const resetForm = { url: "", titulo: "", tipo: "foto" };
    setForm(resetForm);
    setInitialForm(resetForm);
    setEditing(null);
    setShowForm(false);
  };

  const del = (id) => {
    if (!canEdit) {
      return;
    }

    if (confirm("¿Eliminar?")) deleteGaleria(id);
  };

  const previewItem = {
    url: form.url || FALLBACK_GALLERY_IMAGE,
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

    onDirtyChange(hasDraftChanges(form, initialForm));
  }, [showForm, form, initialForm, onDirtyChange]);

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
              <div className="admin-inline-field">
                <label>URL de imagen</label>
                <input
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

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
                <button className="btn btn-primary" onClick={save}>
                  <FaSave className="inline-icon" aria-hidden="true" />
                  Guardar
                </button>
                <button className="btn btn-outline" onClick={closeForm}>
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

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: "1rem",
            padding: "1.5rem",
          }}
        >
          {galeria.map((item) => (
            <div
              key={item.id}
              style={{
                position: "relative",
                borderRadius: "8px",
                overflow: "hidden",
                background: "var(--gray-100)",
              }}
            >
              <img
                src={item.url}
                alt={item.titulo}
                style={{
                  width: "100%",
                  height: "130px",
                  objectFit: "cover",
                  display: "block",
                }}
              />
              <div
                style={{
                  padding: "0.5rem",
                  fontSize: "0.78rem",
                  color: "var(--gray-800)",
                }}
              >
                {item.titulo}
              </div>
              <div
                style={{
                  padding: "0 0.5rem 0.5rem",
                  display: "flex",
                  gap: "0.35rem",
                }}
              >
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
                style={{
                  position: "absolute",
                  top: "6px",
                  right: "6px",
                  background: "rgba(185,28,28,0.85)",
                  color: "white",
                  border: "none",
                  borderRadius: "50%",
                  width: "24px",
                  height: "24px",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
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
