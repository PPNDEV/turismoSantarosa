import { useEffect, useState } from "react";
import { FaEdit, FaSave, FaTrash } from "react-icons/fa";
import { useContent } from "../context/useContent";

const FALLBACK_HERO_IMAGE =
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600";

const emptySlide = {
  bg: "",
  tag: "",
  title: "",
  sub: "",
  cta: "",
  ctaTo: "/destinos",
};

function hasDraftChanges(currentForm, initialForm) {
  return JSON.stringify(currentForm) !== JSON.stringify(initialForm);
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

  const openNew = () => {
    if (!canEdit) {
      return;
    }

    const nextForm = { ...emptySlide };
    setForm(nextForm);
    setInitialForm(nextForm);
    setEditing(null);
    setModal(true);
  };

  const openEdit = (slide) => {
    if (!canEdit) {
      return;
    }

    const nextForm = { ...slide };
    setForm(nextForm);
    setInitialForm(nextForm);
    setEditing(slide.id);
    setModal(true);
  };

  const closeModal = () => setModal(false);

  const save = () => {
    if (!canEdit) {
      return;
    }

    if (!form.bg || !form.title || !form.cta || !form.ctaTo) {
      return;
    }

    upsertHeroSlide({
      ...form,
      id: editing || Date.now().toString(),
    });
    setModal(false);
  };

  const del = (id) => {
    if (!canEdit) {
      return;
    }

    if (confirm("¿Eliminar slide de portada?")) {
      deleteHeroSlide(id);
    }
  };

  const previewSlide = {
    bg: form.bg || FALLBACK_HERO_IMAGE,
    tag: form.tag || "Etiqueta destacada",
    title: form.title || "Título principal de la portada",
    sub:
      form.sub ||
      "Texto descriptivo para invitar al usuario a explorar el sitio.",
    cta: form.cta || "Explorar",
    ctaTo: form.ctaTo || "/",
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
      body: `Botón principal: ${previewSlide.cta}`,
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
              <th>Título</th>
              <th>CTA</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {heroSlides.map((slide, index) => (
              <tr key={slide.id}>
                <td>{index + 1}</td>
                <td>
                  <strong>{slide.title}</strong>
                  <div
                    style={{
                      fontSize: "0.78rem",
                      color: "var(--gray-500)",
                      marginTop: "0.2rem",
                    }}
                  >
                    {slide.tag}
                  </div>
                </td>
                <td>{slide.cta}</td>
                <td>
                  <button
                    className="action-btn edit-btn"
                    onClick={() => moveHeroSlide(slide.id, -1)}
                    style={{ marginRight: "0.35rem" }}
                    disabled={!canEdit}
                  >
                    ↑
                  </button>
                  <button
                    className="action-btn edit-btn"
                    onClick={() => moveHeroSlide(slide.id, 1)}
                    style={{ marginRight: "0.35rem" }}
                    disabled={!canEdit}
                  >
                    ↓
                  </button>
                  <button
                    className="action-btn edit-btn"
                    onClick={() => openEdit(slide)}
                    disabled={!canEdit}
                  >
                    <FaEdit className="inline-icon" aria-hidden="true" />
                    Editar
                  </button>
                  <button
                    className="action-btn del-btn"
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
                {[
                  ["bg", "Imagen de fondo"],
                  ["tag", "Etiqueta"],
                  ["title", "Título"],
                  ["sub", "Subtítulo"],
                  ["cta", "Texto del botón"],
                  ["ctaTo", "Enlace del botón"],
                ].map(([field, label]) => (
                  <div key={field} className="modal-field">
                    <label>{label}</label>
                    <input
                      type="text"
                      value={form[field] || ""}
                      onChange={(e) =>
                        setForm({ ...form, [field]: e.target.value })
                      }
                      placeholder={label}
                    />
                  </div>
                ))}

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
                  Vista previa de la portada
                </h3>
                <article
                  className="admin-slide-preview"
                  style={{ backgroundImage: `url(${previewSlide.bg})` }}
                >
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
                  Enlace del botón: <strong>{previewSlide.ctaTo}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
