import { useEffect, useState } from "react";
import { FaEdit, FaPenNib, FaSave, FaTrash } from "react-icons/fa";
import { useContent } from "../context/useContent";

const FALLBACK_BLOG_IMAGE =
  "https://images.unsplash.com/photo-1456324504439-367cee3b3c32?w=900";

function formatFecha(fecha) {
  const parsedDate = new Date(`${fecha || ""}T12:00:00`);
  if (Number.isNaN(parsedDate.getTime())) {
    return "Fecha por confirmar";
  }

  return parsedDate.toLocaleDateString("es-EC", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const empty = {
  titulo: "",
  resumen: "",
  imagen: "",
  fecha: "",
  autor: "",
  categoria: "",
  publicado: true,
};

function hasDraftChanges(currentForm, initialForm) {
  return JSON.stringify(currentForm) !== JSON.stringify(initialForm);
}

export default function AdminBlog({
  canEdit = true,
  onLivePreviewChange = () => {},
  onDirtyChange = () => {},
}) {
  const { blog, upsertBlog, deleteBlog } = useContent();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [initialForm, setInitialForm] = useState(empty);

  const openNew = () => {
    if (!canEdit) {
      return;
    }

    const nextForm = { ...empty };
    setForm(nextForm);
    setInitialForm(nextForm);
    setEditing(null);
    setModal(true);
  };
  const openEdit = (art) => {
    if (!canEdit) {
      return;
    }

    const nextForm = { ...art };
    setForm(nextForm);
    setInitialForm(nextForm);
    setEditing(art.id);
    setModal(true);
  };

  const save = () => {
    if (!canEdit) {
      return;
    }

    upsertBlog({ ...form, id: editing || Date.now().toString() });
    setModal(false);
  };

  const del = (id) => {
    if (!canEdit) {
      return;
    }

    if (confirm("¿Eliminar artículo?")) deleteBlog(id);
  };

  const previewBlog = {
    titulo: form.titulo || "Título del artículo",
    resumen:
      form.resumen ||
      "Aquí verás cómo se mostrará el resumen del artículo en la página pública.",
    imagen: form.imagen || FALLBACK_BLOG_IMAGE,
    fecha: form.fecha,
    autor: form.autor || "Autor",
    categoria: form.categoria || "General",
    publicado: form.publicado !== false,
  };

  useEffect(() => {
    if (!modal) {
      onLivePreviewChange(null);
      return;
    }

    onLivePreviewChange({
      section: "blog",
      path: "/blog",
      image: previewBlog.imagen,
      badge: previewBlog.categoria,
      title: previewBlog.titulo,
      subtitle: `Por ${previewBlog.autor} · ${formatFecha(previewBlog.fecha)}`,
      body: previewBlog.resumen,
      status: previewBlog.publicado ? "Publicado" : "Borrador",
    });
  }, [
    modal,
    previewBlog.imagen,
    previewBlog.categoria,
    previewBlog.titulo,
    previewBlog.autor,
    previewBlog.fecha,
    previewBlog.resumen,
    previewBlog.publicado,
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
          <h2>Artículos ({blog.length})</h2>
          <button
            className="btn btn-primary"
            onClick={openNew}
            disabled={!canEdit}
          >
            + Nuevo Artículo
          </button>
        </div>

        {!canEdit && (
          <div className="admin-readonly-note">
            Modo visualizador: no puedes crear o modificar artículos.
          </div>
        )}
        <table>
          <thead>
            <tr>
              <th>Título</th>
              <th>Categoría</th>
              <th>Fecha</th>
              <th>Autor</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {blog.map((art) => (
              <tr key={art.id}>
                <td>
                  <strong>{art.titulo}</strong>
                </td>
                <td>
                  <span className="badge badge-ocean">{art.categoria}</span>
                </td>
                <td>
                  {new Date(art.fecha + "T12:00:00").toLocaleDateString(
                    "es-EC",
                  )}
                </td>
                <td>{art.autor}</td>
                <td>
                  <button
                    className="action-btn edit-btn"
                    onClick={() => openEdit(art)}
                    disabled={!canEdit}
                  >
                    <FaEdit className="inline-icon" aria-hidden="true" />
                    Editar
                  </button>
                  <button
                    className="action-btn del-btn"
                    onClick={() => del(art.id)}
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
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div
            className="modal-box modal-box-preview"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>{editing ? "Editar Artículo" : "Nuevo Artículo"}</h2>
            <div className="admin-form-preview-grid">
              <div className="admin-form-column">
                {[
                  ["titulo", "Título"],
                  ["autor", "Autor"],
                  ["categoria", "Categoría"],
                  ["fecha", "Fecha"],
                  ["imagen", "URL de Imagen"],
                ].map(([field, lbl]) => (
                  <div key={field} className="modal-field">
                    <label>{lbl}</label>
                    <input
                      type={field === "fecha" ? "date" : "text"}
                      value={form[field] || ""}
                      onChange={(e) =>
                        setForm({ ...form, [field]: e.target.value })
                      }
                    />
                  </div>
                ))}

                <div className="modal-field">
                  <label>Resumen</label>
                  <textarea
                    value={form.resumen || ""}
                    onChange={(e) =>
                      setForm({ ...form, resumen: e.target.value })
                    }
                  />
                </div>

                <label className="modal-check-row">
                  <input
                    type="checkbox"
                    checked={previewBlog.publicado}
                    onChange={(e) =>
                      setForm({ ...form, publicado: e.target.checked })
                    }
                  />
                  <span>Publicado en la página web</span>
                </label>

                <div className="modal-actions">
                  <button
                    className="btn btn-outline"
                    onClick={() => setModal(false)}
                  >
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
                  Vista previa del artículo
                </h3>
                <div className="admin-preview-card-frame">
                  <article className="blog-card admin-preview-blog-card">
                    <img
                      src={previewBlog.imagen}
                      alt={previewBlog.titulo}
                      onError={(e) => {
                        if (e.currentTarget.src !== FALLBACK_BLOG_IMAGE) {
                          e.currentTarget.src = FALLBACK_BLOG_IMAGE;
                        }
                      }}
                    />
                    <div className="blog-body">
                      <div className="blog-meta">
                        <span className="badge badge-ocean">
                          {previewBlog.categoria}
                        </span>
                        <span
                          style={{
                            fontSize: "0.78rem",
                            color: "var(--gray-400)",
                          }}
                        >
                          {formatFecha(previewBlog.fecha)}
                        </span>
                      </div>
                      <h3>{previewBlog.titulo}</h3>
                      <p>{previewBlog.resumen}</p>
                    </div>
                    <div className="blog-footer">
                      <span
                        style={{
                          fontSize: "0.82rem",
                          color: "var(--gray-400)",
                        }}
                      >
                        <FaPenNib className="inline-icon" aria-hidden="true" />
                        {previewBlog.autor}
                      </span>
                    </div>
                  </article>
                </div>

                <div className="admin-preview-note">
                  Estado de publicación:{" "}
                  {previewBlog.publicado ? "Publicado" : "Borrador"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
