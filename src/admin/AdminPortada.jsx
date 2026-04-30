import { useEffect, useMemo, useState } from "react";
import {
  FaArrowDown,
  FaArrowUp,
  FaEdit,
  FaImage,
  FaSave,
  FaTrash,
} from "react-icons/fa";
import {
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
} from "firebase/storage";
import { useContent } from "../context/useContent";
import { storage } from "../services/firebase";

const FALLBACK_HERO_IMAGE =
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600";

const CTA_OPTIONS = [
  {
    id: "destinos",
    label: "Destinos",
    cta: "Explorar destinos",
    ctaTo: "/destinos",
  },
  {
    id: "eventos",
    label: "Eventos",
    cta: "Ver eventos",
    ctaTo: "/eventos",
  },
  {
    id: "informacion",
    label: "Informacion turistica",
    cta: "Planificar visita",
    ctaTo: "/informacion",
  },
  {
    id: "galeria",
    label: "Galeria",
    cta: "Ver galeria",
    ctaTo: "/galeria",
  },
  {
    id: "blog",
    label: "Blog",
    cta: "Leer noticias",
    ctaTo: "/blog",
  },
];

const emptySlide = {
  bg: "",
  tag: "",
  title: "",
  sub: "",
  cta: CTA_OPTIONS[0].cta,
  ctaTo: CTA_OPTIONS[0].ctaTo,
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

function getCtaOptionId(slide) {
  return (
    CTA_OPTIONS.find(
      (option) => option.cta === slide.cta && option.ctaTo === slide.ctaTo,
    )?.id || "custom"
  );
}

async function uploadHeroImage(file, slideId) {
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const imageRef = storageRef(
    storage,
    `cms/heroSlides/${slideId}/${Date.now()}.${extension}`,
  );

  await uploadBytes(imageRef, file, {
    contentType: file.type || "image/jpeg",
    customMetadata: { slideId },
  });

  return getDownloadURL(imageRef);
}

export default function AdminPortada({
  canEdit = true,
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const ctaOptionId = useMemo(() => getCtaOptionId(form), [form]);

  const previewSlide = {
    bg: localPreviewUrl || form.bg || FALLBACK_HERO_IMAGE,
    tag: form.tag || "Etiqueta destacada",
    title: form.title || "Titulo principal de la portada",
    sub:
      form.sub ||
      "Texto descriptivo para invitar al usuario a explorar el sitio.",
    cta: form.cta || CTA_OPTIONS[0].cta,
    ctaTo: form.ctaTo || CTA_OPTIONS[0].ctaTo,
  };

  const openNew = () => {
    if (!canEdit) return;

    const nextForm = { ...emptySlide };
    setForm(nextForm);
    setInitialForm(nextForm);
    setSelectedFile(null);
    setLocalPreviewUrl("");
    setError("");
    setEditing(null);
    setModal(true);
  };

  const openEdit = (slide) => {
    if (!canEdit) return;

    const nextForm = { ...emptySlide, ...slide };
    setForm(nextForm);
    setInitialForm(nextForm);
    setSelectedFile(null);
    setLocalPreviewUrl("");
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

  const handleCtaOptionChange = (optionId) => {
    const option = CTA_OPTIONS.find((entry) => entry.id === optionId);
    if (!option) return;

    setForm({
      ...form,
      cta: option.cta,
      ctaTo: option.ctaTo,
    });
  };

  const handleImageSelect = (file) => {
    if (!file) return;

    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
    }

    setSelectedFile(file);
    setLocalPreviewUrl(URL.createObjectURL(file));
  };

  const save = async () => {
    if (!canEdit || saving) return;
    if (
      !form.title ||
      !form.cta ||
      !form.ctaTo ||
      (!form.bg && !selectedFile)
    ) {
      return;
    }

    const slideId = editing || createSlideId(form.title);
    setSaving(true);
    setError("");

    try {
      const imageUrl = selectedFile
        ? await uploadHeroImage(selectedFile, slideId)
        : form.bg;

      await upsertHeroSlide({
        ...form,
        bg: imageUrl,
        id: slideId,
      });

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

  const del = (id) => {
    if (!canEdit) return;

    if (confirm("Eliminar slide de portada?")) {
      deleteHeroSlide(id);
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
          <h2>Portada ({heroSlides.length})</h2>
          <button
            className="btn btn-primary"
            onClick={openNew}
            disabled={!canEdit}
          >
            + Nueva Slide
          </button>
        </div>

        {!canEdit && (
          <div className="admin-readonly-note">
            Modo visualizador: solo puedes revisar la portada publicada.
          </div>
        )}

        <table>
          <thead>
            <tr>
              <th>Orden</th>
              <th>Codigo</th>
              <th>Titulo</th>
              <th>CTA</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {heroSlides.map((slide, index) => (
              <tr key={slide.id}>
                <td>{index + 1}</td>
                <td>
                  <code className="admin-id-code">{slide.id}</code>
                </td>
                <td>
                  <strong>{slide.title}</strong>
                  <div className="admin-slide-tag-muted">
                    {slide.tag}
                  </div>
                </td>
                <td>{slide.cta}</td>
                <td>
                  <button
                    className="action-btn move-btn icon-btn icon-btn-spaced"
                    onClick={() => moveHeroSlide(slide.id, -1)}
                    disabled={!canEdit || index === 0}
                    title="Subir slide"
                    aria-label="Subir slide"
                  >
                    <FaArrowUp aria-hidden="true" />
                  </button>
                  <button
                    className="action-btn move-btn icon-btn icon-btn-spaced"
                    onClick={() => moveHeroSlide(slide.id, 1)}
                    disabled={!canEdit || index === heroSlides.length - 1}
                    title="Bajar slide"
                    aria-label="Bajar slide"
                  >
                    <FaArrowDown aria-hidden="true" />
                  </button>
                  <button
                    className="action-btn edit-btn icon-btn"
                    onClick={() => openEdit(slide)}
                    disabled={!canEdit}
                    title="Editar"
                    aria-label="Editar"
                  >
                    <FaEdit className="inline-icon" aria-hidden="true" />
                  </button>
                  <button
                    className="action-btn del-btn icon-btn"
                    onClick={() => del(slide.id)}
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
            <h2>{editing ? "Editar Slide" : "Nueva Slide"}</h2>
            <div className="admin-form-preview-grid">
              <div className="admin-form-column">
                <div className="modal-field">
                  <label>Imagen de fondo</label>
                  <div className="admin-upload-row">
                    <input
                      type="file"
                      accept="image/*"
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
                  <input
                    type="url"
                    value={form.bg || ""}
                    onChange={(e) => setForm({ ...form, bg: e.target.value })}
                    placeholder="URL alternativa de imagen"
                  />
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
                  <label>Titulo</label>
                  <input
                    type="text"
                    value={form.title || ""}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    placeholder="Titulo principal"
                  />
                </div>

                <div className="modal-field">
                  <label>Subtitulo</label>
                  <input
                    type="text"
                    value={form.sub || ""}
                    onChange={(e) => setForm({ ...form, sub: e.target.value })}
                    placeholder="Texto breve para invitar a explorar"
                  />
                </div>

                <div className="modal-field">
                  <label>Accion del boton</label>
                  <select
                    value={ctaOptionId}
                    onChange={(e) => handleCtaOptionChange(e.target.value)}
                  >
                    {CTA_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label} - {option.cta}
                      </option>
                    ))}
                    <option value="custom">Personalizado</option>
                  </select>
                </div>

                {ctaOptionId === "custom" && (
                  <>
                    <div className="modal-field">
                      <label>Texto del boton</label>
                      <input
                        type="text"
                        value={form.cta || ""}
                        onChange={(e) =>
                          setForm({ ...form, cta: e.target.value })
                        }
                        placeholder="Texto del boton"
                      />
                    </div>
                    <div className="modal-field">
                      <label>Enlace del boton</label>
                      <input
                        type="text"
                        value={form.ctaTo || ""}
                        onChange={(e) =>
                          setForm({ ...form, ctaTo: e.target.value })
                        }
                        placeholder="/destinos"
                      />
                    </div>
                  </>
                )}

                <div className="admin-generated-id">
                  Codigo unico:{" "}
                  <strong>{editing || "se genera al guardar"}</strong>
                </div>

                {error && <div className="login-error">{error}</div>}

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
                  Vista previa de la portada
                </h3>
                <article className="admin-slide-preview">
                  <img
                    src={previewSlide.bg}
                    alt=""
                    aria-hidden="true"
                    className="admin-slide-preview-bg"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="admin-slide-overlay">
                    <span className="admin-slide-tag">{previewSlide.tag}</span>
                    <h3 className="admin-slide-title">{previewSlide.title}</h3>
                    <p className="admin-slide-sub">{previewSlide.sub}</p>
                    <span className="btn btn-gold admin-slide-cta">
                      {previewSlide.cta}
                    </span>
                  </div>
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
