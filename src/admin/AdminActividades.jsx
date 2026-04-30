import { useEffect, useMemo, useState } from "react";
import {
  FaEdit,
  FaHiking,
  FaMapMarkerAlt,
  FaQuoteLeft,
  FaSave,
  FaTrash,
} from "react-icons/fa";
import { useContent } from "../context/useContent";
import AdminImageField from "./AdminImageField";
import { createContentId, uploadContentImage } from "./adminImageUpload";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=900";

const emptyActividad = {
  nombre: "",
  descripcion: "",
  isla: "Jambelí",
  imagen: "",
};

const emptyEditorial = {
  id: "main",
  eyebrow: "Editorial turístico",
  title: "Actividades que se viven, se cuentan y se recuerdan",
  subtitle:
    "Una lectura más pausada del territorio, con experiencias que puedes editar y publicar desde el panel.",
  intro:
    "Desde la costa hasta el humedal, Santa Rosa se recorre con calma. Esta página reúne experiencias turísticas para descubrir, promover y actualizar sin tocar el código.",
  quote: "Cada actividad suma una historia distinta al viaje.",
  quoteAuthor: "Dirección de Turismo",
  heroImage: "",
  ctaLabel: "Explorar destinos",
  ctaTo: "/destinos",
};

function hasDraftChanges(a, b) {
  return JSON.stringify(a) !== JSON.stringify(b);
}

function normalizeEditorial(item) {
  return { ...emptyEditorial, ...(item || {}), id: "main" };
}

export default function AdminActividades({
  canEdit = true,
  onLivePreviewChange = () => {},
  onDirtyChange = () => {},
}) {
  const {
    actividades,
    actividadesEditorial,
    upsertActividad,
    deleteActividad,
    upsertActividadesEditorial,
  } = useContent();
  const [editorialForm, setEditorialForm] = useState(emptyEditorial);
  const [editorialInitialForm, setEditorialInitialForm] =
    useState(emptyEditorial);
  const [editorialImageFile, setEditorialImageFile] = useState(null);
  const [editorialImagePreviewUrl, setEditorialImagePreviewUrl] = useState("");
  const [editorialSaving, setEditorialSaving] = useState(false);
  const [editorialError, setEditorialError] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyActividad);
  const [initialForm, setInitialForm] = useState(emptyActividad);
  const [error, setError] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [saving, setSaving] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const nextEditorial = normalizeEditorial(actividadesEditorial[0]);
    setEditorialForm(nextEditorial);
    setEditorialInitialForm(nextEditorial);
    setEditorialImageFile(null);
    setEditorialImagePreviewUrl("");
  }, [actividadesEditorial]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const editorialPreview = useMemo(
    () => ({
      ...normalizeEditorial(editorialForm),
      heroImage:
        editorialImagePreviewUrl || editorialForm.heroImage || FALLBACK_IMAGE,
    }),
    [editorialForm, editorialImagePreviewUrl],
  );

  const editorialDirty =
    hasDraftChanges(editorialForm, editorialInitialForm) ||
    Boolean(editorialImageFile);

  const openNew = () => {
    if (!canEdit) return;
    setError("");
    const f = { ...emptyActividad };
    setForm(f);
    setInitialForm(f);
    setImageFile(null);
    setImagePreviewUrl("");
    setEditing(null);
    setModal(true);
  };

  const openEdit = (item) => {
    if (!canEdit) return;
    setError("");
    const f = { ...item };
    setForm(f);
    setInitialForm(f);
    setImageFile(null);
    setImagePreviewUrl("");
    setEditing(item.id);
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

  const handleEditorialImageFileChange = (file) => {
    if (editorialImagePreviewUrl) {
      URL.revokeObjectURL(editorialImagePreviewUrl);
    }
    setEditorialImageFile(file);
    setEditorialImagePreviewUrl(file ? URL.createObjectURL(file) : "");
  };

  const saveEditorial = async () => {
    if (!canEdit || editorialSaving) return;

    const title = String(editorialForm.title || "").trim();
    const intro = String(editorialForm.intro || "").trim();
    if (!title || !intro) {
      setEditorialError("Título e introducción son obligatorios.");
      return;
    }

    setEditorialSaving(true);
    try {
      const imageUrl = editorialImageFile
        ? await uploadContentImage(
            editorialImageFile,
            "actividadesEditorial",
            editorialForm.id || "main",
          )
        : editorialForm.heroImage;

      const nextEditorial = {
        ...editorialForm,
        id: editorialForm.id || "main",
        title,
        intro,
        heroImage: imageUrl,
      };

      await upsertActividadesEditorial(nextEditorial);
      setEditorialForm(nextEditorial);
      setEditorialInitialForm(nextEditorial);
      setEditorialImageFile(null);
      setEditorialImagePreviewUrl("");
      setEditorialError("");
    } finally {
      setEditorialSaving(false);
    }
  };

  const save = async () => {
    if (!canEdit || saving) return;
    const nombre = String(form.nombre || "").trim();
    const descripcion = String(form.descripcion || "").trim();
    if (!nombre || !descripcion) {
      setError("Nombre y descripción son obligatorios.");
      return;
    }
    const itemId = editing || createContentId("actividad", nombre);
    setSaving(true);
    try {
      const imageUrl = imageFile
        ? await uploadContentImage(imageFile, "actividades", itemId)
        : form.imagen;

      await upsertActividad({
        ...form,
        imagen: imageUrl,
        nombre,
        descripcion,
        id: itemId,
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
    if (!canEdit) return;
    if (confirm("¿Eliminar actividad?")) deleteActividad(id);
  };

  const preview = useMemo(
    () => ({
      nombre: form.nombre || "Nombre de la actividad",
      descripcion: form.descripcion || "Descripción de la actividad turística.",
      isla: form.isla || "Jambelí",
      imagen: imagePreviewUrl || form.imagen || FALLBACK_IMAGE,
    }),
    [form.nombre, form.descripcion, form.isla, form.imagen, imagePreviewUrl],
  );

  const previewPayload = useMemo(
    () =>
      modal
        ? {
            section: "actividades",
            path: "/actividades",
            image: preview.imagen,
            badge: `${preview.isla} · Actividad`,
            title: preview.nombre,
            subtitle: "Actividad turística",
            body: preview.descripcion,
            status: "Listo para publicar",
          }
        : {
            section: "actividades",
            path: "/actividades",
            image: editorialPreview.heroImage,
            badge: editorialPreview.eyebrow,
            title: editorialPreview.title,
            subtitle: editorialPreview.subtitle,
            body: editorialPreview.intro,
            status: editorialPreview.ctaLabel,
          },
    [modal, preview, editorialPreview],
  );

  useEffect(() => {
    onLivePreviewChange(previewPayload);
  }, [onLivePreviewChange, previewPayload]);

  useEffect(() => {
    onDirtyChange(
      editorialDirty ||
        (modal && (hasDraftChanges(form, initialForm) || Boolean(imageFile))),
    );
  }, [editorialDirty, modal, form, initialForm, imageFile, onDirtyChange]);

  useEffect(
    () => () => {
      if (editorialImagePreviewUrl)
        URL.revokeObjectURL(editorialImagePreviewUrl);
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
      onDirtyChange(false);
      onLivePreviewChange(null);
    },
    [
      editorialImagePreviewUrl,
      imagePreviewUrl,
      onDirtyChange,
      onLivePreviewChange,
    ],
  );

  return (
    <div className="admin-activities-stack">
      <div className="admin-table-card">
        <div className="admin-table-header">
          <h2>Portada editorial de Actividades</h2>
          <button
            className="btn btn-primary"
            onClick={saveEditorial}
            disabled={!canEdit || editorialSaving}
          >
            <FaSave className="inline-icon" aria-hidden="true" />
            {editorialSaving ? "Guardando..." : "Guardar portada"}
          </button>
        </div>

        {!canEdit && (
          <div className="admin-readonly-note">
            Modo visualizador: la portada editorial y las actividades son solo
            de consulta.
          </div>
        )}

        {editorialError && <div className="login-error">{editorialError}</div>}

        <div className="admin-form-preview-grid">
          <div className="admin-form-column">
            <div className="modal-field">
              <label>Entradilla</label>
              <input
                type="text"
                value={editorialForm.eyebrow}
                onChange={(e) =>
                  setEditorialForm({
                    ...editorialForm,
                    eyebrow: e.target.value,
                  })
                }
              />
            </div>
            <div className="modal-field">
              <label>Título</label>
              <input
                type="text"
                value={editorialForm.title}
                onChange={(e) =>
                  setEditorialForm({ ...editorialForm, title: e.target.value })
                }
              />
            </div>
            <div className="modal-field">
              <label>Subtítulo</label>
              <textarea
                value={editorialForm.subtitle}
                onChange={(e) =>
                  setEditorialForm({
                    ...editorialForm,
                    subtitle: e.target.value,
                  })
                }
              />
            </div>
            <div className="modal-field">
              <label>Introducción</label>
              <textarea
                value={editorialForm.intro}
                onChange={(e) =>
                  setEditorialForm({ ...editorialForm, intro: e.target.value })
                }
              />
            </div>
            <div className="modal-field">
              <label>Cita editorial</label>
              <textarea
                value={editorialForm.quote}
                onChange={(e) =>
                  setEditorialForm({ ...editorialForm, quote: e.target.value })
                }
              />
            </div>
            <div className="modal-field">
              <label>Autor de la cita</label>
              <input
                type="text"
                value={editorialForm.quoteAuthor}
                onChange={(e) =>
                  setEditorialForm({
                    ...editorialForm,
                    quoteAuthor: e.target.value,
                  })
                }
              />
            </div>
            <AdminImageField
              label="Imagen de portada"
              value={editorialForm.heroImage}
              selectedFile={editorialImageFile}
              onFileChange={handleEditorialImageFileChange}
              onUrlChange={(nextUrl) =>
                setEditorialForm({ ...editorialForm, heroImage: nextUrl })
              }
            />
            <div className="modal-field">
              <label>Texto del botón</label>
              <input
                type="text"
                value={editorialForm.ctaLabel}
                onChange={(e) =>
                  setEditorialForm({
                    ...editorialForm,
                    ctaLabel: e.target.value,
                  })
                }
              />
            </div>
            <div className="modal-field">
              <label>Enlace del botón</label>
              <input
                type="text"
                value={editorialForm.ctaTo}
                onChange={(e) =>
                  setEditorialForm({ ...editorialForm, ctaTo: e.target.value })
                }
              />
            </div>
          </div>

          <div className="admin-preview-column">
            <h3 className="admin-preview-title">Vista previa editorial</h3>
            <div className="admin-preview-card-frame">
              <div className="activities-hero activities-admin-preview">
                <div className="activities-hero-copy">
                  <span className="badge badge-gold">
                    {editorialPreview.eyebrow}
                  </span>
                  <h3 className="activities-hero-title">
                    {editorialPreview.title}
                  </h3>
                  <p className="activities-hero-subtitle">
                    {editorialPreview.subtitle}
                  </p>
                  <p className="activities-hero-intro">
                    {editorialPreview.intro}
                  </p>
                </div>
                <div className="activities-hero-media">
                  <img
                    src={editorialPreview.heroImage}
                    alt={editorialPreview.title}
                  />
                  <div className="activities-quote-card">
                    <FaQuoteLeft
                      className="activities-quote-icon"
                      aria-hidden="true"
                    />
                    <p>{editorialPreview.quote}</p>
                    <strong>{editorialPreview.quoteAuthor}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-table-card">
        <div className="admin-table-header">
          <h2>Actividades ({actividades.length})</h2>
          <button
            className="btn btn-primary"
            onClick={openNew}
            disabled={!canEdit}
          >
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
                <td>
                  <strong>
                    <FaHiking className="inline-icon" aria-hidden="true" />{" "}
                    {a.nombre}
                  </strong>
                </td>
                <td>{a.isla || "-"}</td>
                <td className="admin-cell-ellipsis">
                  {a.descripcion}
                </td>
                <td>
                  <button
                    className="action-btn edit-btn"
                    onClick={() => openEdit(a)}
                    disabled={!canEdit}
                  >
                    <FaEdit className="inline-icon" aria-hidden="true" /> Editar
                  </button>
                  <button
                    className="action-btn del-btn"
                    onClick={() => del(a.id)}
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
            <h2>{editing ? "Editar Actividad" : "Nueva Actividad"}</h2>
            {error && <div className="login-error">{error}</div>}
            <div className="admin-form-preview-grid">
              <div className="admin-form-column">
                {["nombre"].map((f) => (
                  <div key={f} className="modal-field">
                    <label>Nombre</label>
                    <input
                      type="text"
                      value={form[f] || ""}
                      onChange={(e) =>
                        setForm({ ...form, [f]: e.target.value })
                      }
                    />
                  </div>
                ))}

                <AdminImageField
                  label="Imagen de la actividad"
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

                <div className="modal-field">
                  <label>Descripción</label>
                  <textarea
                    value={form.descripcion || ""}
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
                    <FaSave className="inline-icon" aria-hidden="true" />{" "}
                    {saving ? "Guardando..." : "Guardar"}
                  </button>
                </div>
              </div>

              <div className="admin-preview-column">
                <h3 className="admin-preview-title">Vista previa</h3>
                <div className="admin-preview-card-frame">
                  <article className="info-card admin-preview-info-card">
                    <img
                      src={preview.imagen}
                      alt={preview.nombre}
                      onError={(e) => {
                        if (e.currentTarget.src !== FALLBACK_IMAGE)
                          e.currentTarget.src = FALLBACK_IMAGE;
                      }}
                    />
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
