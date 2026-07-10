import { useEffect, useMemo, useState } from "react";
import {
  FaArrowDown,
  FaArrowUp,
  FaEdit,
  FaImage,
  FaSave,
  FaTrash,
} from "react-icons/fa";
import { useContent } from "../context/useContent";
import { uploadContentImage } from "../services/uploadService";
import {
  canManageContentItem,
  getEditorOwnershipNote,
  getVisibleAdminItems,
  isAdminUser,
} from "./adminOwnership";

// Todas las portadas comparten un único botón "Ver información" hacia la página
// de información turística. Ya no se configura una acción por portada.
const HERO_CTA_LABEL = "Ver información";
const HERO_CTA_TO = "/informacion";

const emptySlide = {
  bg: "",
  tag: "",
  title: "",
  sub: "",
};

function hasDraftChanges(currentForm, initialForm) {
  return JSON.stringify(currentForm) !== JSON.stringify(initialForm);
}

function slugify(value) {
  return String(value || "slide")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 36);
}

function createSlideId(title) {
  const suffix =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);

  return `hero-${slugify(title)}-${suffix}`;
}

function SlideThumb({ slide }) {
  const [failed, setFailed] = useState(false);

  if (!slide.bg || failed) {
    return (
      <span className="admin-slide-thumb admin-slide-thumb-empty">
        <FaImage aria-hidden="true" />
      </span>
    );
  }

  return (
    <img
      src={slide.bg}
      alt={`Imagen de ${slide.title || "slide"}`}
      className="admin-slide-thumb"
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}


export default function AdminPortada({
  canEdit = true,
  currentUser = null,
  onLivePreviewChange = () => {},
  onDirtyChange = () => {},
}) {
  const { heroSlides, upsertHeroSlide, deleteHeroSlide, moveHeroSlide } =
    useContent();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptySlide);
  const [initialForm, setInitialForm] = useState(emptySlide);
  const [selectedFile, setSelectedFile] = useState(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const visibleHeroSlides = useMemo(
    () => getVisibleAdminItems(heroSlides, currentUser, canEdit),
    [heroSlides, currentUser, canEdit],
  );
  const ownershipNote = getEditorOwnershipNote(currentUser, canEdit);
  const canCreateSlide = canManageContentItem(null, currentUser, canEdit);
  const canReorderSlides = canEdit && isAdminUser(currentUser);

  const previewSlide = {
    bg: localPreviewUrl || form.bg || "",
    tag: form.tag || "",
    title: form.title || "",
    sub: form.sub || "",
    cta: HERO_CTA_LABEL,
    ctaTo: HERO_CTA_TO,
  };
  const previewHasTitle = Boolean(previewSlide.title.trim());

  const openNew = () => {
    if (!canCreateSlide) return;

    const nextForm = { ...emptySlide };
    setForm(nextForm);
    setInitialForm(nextForm);
    setSelectedFile(null);
    setLocalPreviewUrl("");
    setPreviewError(false);
    setError("");
    setEditing(null);
    setModal(true);
  };

  const openEdit = (slide) => {
    if (!canManageContentItem(slide, currentUser, canEdit)) return;

    const nextForm = { ...emptySlide, ...slide };
    setForm(nextForm);
    setInitialForm(nextForm);
    setSelectedFile(null);
    setLocalPreviewUrl("");
    setPreviewError(false);
    setError("");
    setEditing(slide.id);
    setModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModal(false);
    setSelectedFile(null);
    setLocalPreviewUrl("");
  };

  const handleImageSelect = (file) => {
    if (!file) return;

    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
    }

    setSelectedFile(file);
    setLocalPreviewUrl(URL.createObjectURL(file));
    setPreviewError(false);
  };

  const save = async () => {
    if (
      !canManageContentItem(editing ? initialForm : null, currentUser, canEdit) ||
      saving
    )
      return;
    if (!form.bg && !selectedFile) {
      setError("Selecciona una imagen de fondo para la portada.");
      return;
    }

    const slideId = editing || createSlideId(form.title || "portada");
    setSaving(true);
    setError("");

    try {
      const imageUrl = selectedFile
        ? await uploadContentImage(selectedFile, "heroSlides", slideId, true)
        : form.bg;

      await upsertHeroSlide({
        ...form,
        bg: imageUrl,
        cta: HERO_CTA_LABEL,
        ctaTo: HERO_CTA_TO,
        id: slideId,
      });

      setForm(emptySlide);
      setInitialForm(emptySlide);
      setModal(false);
      setSelectedFile(null);
      setLocalPreviewUrl("");
    } catch (saveError) {
      setError(
        saveError?.message ||
          "No se pudo guardar. Verifica la conexion con Cloud Functions.",
      );
    } finally {
      setSaving(false);
    }
  };

  const del = (slide) => {
    if (!canManageContentItem(slide, currentUser, canEdit)) return;

    if (confirm("Eliminar slide de portada?")) {
      deleteHeroSlide(slide.id);
    }
  };

  useEffect(() => {
    if (!modal) {
      onLivePreviewChange(null);
      return;
    }

    onLivePreviewChange({
      section: "portada",
      path: "/",
      image: previewSlide.bg,
      badge: previewSlide.tag,
      title: previewSlide.title,
      subtitle: previewSlide.sub,
      body: `Boton principal: ${previewSlide.cta}`,
      status: previewSlide.ctaTo,
    });
  }, [
    modal,
    previewSlide.bg,
    previewSlide.tag,
    previewSlide.title,
    previewSlide.sub,
    previewSlide.cta,
    previewSlide.ctaTo,
    onLivePreviewChange,
  ]);

  useEffect(() => {
    if (!modal) {
      onDirtyChange(false);
      return;
    }

    onDirtyChange(hasDraftChanges(form, initialForm) || Boolean(selectedFile));
  }, [modal, form, initialForm, selectedFile, onDirtyChange]);

  useEffect(
    () => () => {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }
      onDirtyChange(false);
      onLivePreviewChange(null);
    },
    [localPreviewUrl, onDirtyChange, onLivePreviewChange],
  );

  return (
    <div>
      <div className="admin-table-card">
        <div className="admin-table-header">
          <h2>
            <FaImage className="inline-icon" aria-hidden="true" />
            Portada ({visibleHeroSlides.length})
          </h2>
          <button
            className="btn btn-primary"
            onClick={openNew}
            disabled={!canCreateSlide}
          >
            Añadir
          </button>
        </div>

        {!canEdit && (
          <div className="admin-readonly-note">
            Modo visualizador: solo puedes revisar la portada publicada.
          </div>
        )}
        {ownershipNote && (
          <div className="admin-readonly-note">{ownershipNote}</div>
        )}

        <table>
          <thead>
            <tr>
              <th>Orden</th>
              <th>Imagen</th>
              <th>Codigo</th>
              <th>Titulo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {visibleHeroSlides.map((slide, index) => (
              <tr key={slide.id}>
                <td>{index + 1}</td>
                <td>
                  <SlideThumb slide={slide} />
                </td>
                <td>
                  <code className="admin-id-code">{slide.id}</code>
                </td>
                <td>
                  <strong>
                    {slide.title || (
                      <em className="admin-comment-empty">Sin título</em>
                    )}
                  </strong>
                  <div className="admin-slide-tag-muted">
                    {slide.tag}
                  </div>
                </td>
                <td>
                  <button
                    className="action-btn move-btn icon-btn icon-btn-spaced"
                    onClick={() => moveHeroSlide(slide.id, -1)}
                    disabled={!canReorderSlides || index === 0}
                    title="Subir slide"
                    aria-label="Subir slide"
                  >
                    <FaArrowUp aria-hidden="true" />
                  </button>
                  <button
                    className="action-btn move-btn icon-btn icon-btn-spaced"
                    onClick={() => moveHeroSlide(slide.id, 1)}
                    disabled={
                      !canReorderSlides || index === visibleHeroSlides.length - 1
                    }
                    title="Bajar slide"
                    aria-label="Bajar slide"
                  >
                    <FaArrowDown aria-hidden="true" />
                  </button>
                  <button
                    className="action-btn edit-btn icon-btn"
                    onClick={() => openEdit(slide)}
                    disabled={!canManageContentItem(slide, currentUser, canEdit)}
                    title="Editar"
                    aria-label="Editar"
                  >
                    <FaEdit className="inline-icon" aria-hidden="true" />
                  </button>
                  <button
                    className="action-btn del-btn icon-btn"
                    onClick={() => del(slide)}
                    disabled={!canManageContentItem(slide, currentUser, canEdit)}
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
            <h2>{editing ? "Editar Portada" : "Nueva Portada"}</h2>
            <div className="admin-form-preview-grid">
              <div className="admin-form-column">
                <div className="modal-field">
                  <label>Imagen de fondo</label>
                  <div className="admin-upload-row">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/*"
                      onChange={(e) => handleImageSelect(e.target.files?.[0])}
                    />
                    <span>
                      <FaImage className="inline-icon" aria-hidden="true" />
                      {selectedFile
                        ? selectedFile.name
                        : form.bg
                          ? "Imagen publicada"
                          : "Selecciona una imagen"}
                    </span>
                  </div>
                </div>

                <div className="modal-field">
                  <label>Etiqueta</label>
                  <input
                    type="text"
                    value={form.tag || ""}
                    onChange={(e) => setForm({ ...form, tag: e.target.value })}
                    placeholder="Ej: Archipielago de Jambeli"
                  />
                </div>

                <div className="modal-field">
                  <label>Titulo (opcional)</label>
                  <input
                    type="text"
                    value={form.title || ""}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    placeholder="Titulo principal (opcional)"
                  />
                </div>

                <div className="modal-field">
                  <label>Subtitulo (opcional)</label>
                  <input
                    type="text"
                    value={form.sub || ""}
                    onChange={(e) => setForm({ ...form, sub: e.target.value })}
                    placeholder="Texto breve para invitar a explorar (opcional)"
                  />
                </div>

                <div className="admin-readonly-note">
                  Todas las portadas muestran un único botón “Ver información”. Si
                  no escribes un título, la imagen se mostrará con un sombreado.
                </div>

                <div className="admin-generated-id">
                  Codigo unico:{" "}
                  <strong>{editing || "se genera al guardar"}</strong>
                </div>

                {error && (
                  <div className="admin-alert admin-alert-error">{error}</div>
                )}

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
                    {saving ? (
                      <span className="btn-spinner" aria-hidden="true" />
                    ) : (
                      <FaSave className="inline-icon" aria-hidden="true" />
                    )}
                    {saving ? "Guardando..." : "Guardar"}
                  </button>
                </div>
              </div>

              <div className="admin-preview-column">
                <h3 className="admin-preview-title">
                  Vista previa de la portada
                </h3>
                <article className="admin-slide-preview">
                  {previewSlide.bg && !previewError ? (
                    <>
                      <img
                        key={previewSlide.bg}
                        src={previewSlide.bg}
                        alt="Vista previa de la imagen de portada"
                        className="admin-slide-preview-bg"
                        decoding="async"
                        onError={() => setPreviewError(true)}
                      />
                      <div
                        className={`admin-slide-overlay ${
                          previewHasTitle
                            ? "admin-slide-overlay-titled"
                            : "admin-slide-overlay-plain"
                        }`}
                      >
                        {previewSlide.tag && (
                          <span className="admin-slide-tag">
                            {previewSlide.tag}
                          </span>
                        )}
                        {previewSlide.title && (
                          <h3 className="admin-slide-title">
                            {previewSlide.title}
                          </h3>
                        )}
                        {previewSlide.sub && (
                          <p className="admin-slide-sub">{previewSlide.sub}</p>
                        )}
                        <span className="btn btn-gold admin-slide-cta">
                          {previewSlide.cta}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="admin-slide-preview-empty">
                      <FaImage aria-hidden="true" />
                      <span>
                        {previewError
                          ? "No se pudo mostrar la imagen. Usa un archivo JPG, PNG o WebP."
                          : "Selecciona una imagen para ver la portada."}
                      </span>
                    </div>
                  )}
                </article>
                <div className="admin-preview-path">
                  Enlace del boton: <strong>{previewSlide.ctaTo}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
