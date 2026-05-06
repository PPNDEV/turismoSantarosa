import { useEffect, useMemo, useState } from "react";
import {
  FaCalendarAlt,
  FaClock,
  FaEdit,
  FaMapMarkerAlt,
  FaSave,
  FaTrash,
} from "react-icons/fa";
import { useContent } from "../context/useContent";
import AdminImageField from "./AdminImageField";
import { createContentId, uploadContentImage } from "../services/uploadService";

const FALLBACK_EVENT_IMAGE =
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=900";

const emptyEvento = {
  nombre: "",
  descripcion: "",
  fecha: "",
  hora: "",
  lugar: "",
  tipo: "Cultural",
  organizador: "",
  contacto: "",
  imagen: "",
  activo: true,
};

const requiredFields = ["nombre", "descripcion", "fecha", "lugar"];

function getEventTimestamp(fecha) {
  const parsedDate = new Date(`${fecha || ""}T12:00:00`);
  const timestamp = parsedDate.getTime();
  return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp;
}

function formatFecha(fecha) {
  const parsedDate = new Date(`${fecha || ""}T12:00:00`);
  if (Number.isNaN(parsedDate.getTime())) {
    return "Fecha por confirmar";
  }

  return parsedDate.toLocaleDateString("es-EC", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function sanitizeText(value) {
  return String(value || "").trim();
}

function hasDraftChanges(currentForm, initialForm) {
  return JSON.stringify(currentForm) !== JSON.stringify(initialForm);
}

export default function AdminEventos({
  canEdit = true,
  onLivePreviewChange = () => {},
  onDirtyChange = () => {},
}) {
  const { eventos, upsertEvento, deleteEvento } = useContent();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyEvento);
  const [initialForm, setInitialForm] = useState(emptyEvento);
  const [error, setError] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const orderedEventos = useMemo(
    () =>
      [...eventos].sort(
        (a, b) => getEventTimestamp(a.fecha) - getEventTimestamp(b.fecha),
      ),
    [eventos],
  );

  const openNew = () => {
    if (!canEdit) {
      return;
    }

    const nextForm = { ...emptyEvento };
    setForm(nextForm);
    setInitialForm(nextForm);
    setEditing(null);
    setImageFile(null);
    setImagePreviewUrl("");
    setError("");
    setModal(true);
  };

  const openEdit = (ev) => {
    if (!canEdit) {
      return;
    }

    const nextForm = { ...ev };
    setForm(nextForm);
    setInitialForm(nextForm);
    setEditing(ev.id);
    setImageFile(null);
    setImagePreviewUrl("");
    setError("");
    setModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setError("");
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

    const cleaned = {
      ...form,
      nombre: sanitizeText(form.nombre),
      descripcion: sanitizeText(form.descripcion),
      fecha: sanitizeText(form.fecha),
      hora: sanitizeText(form.hora),
      lugar: sanitizeText(form.lugar),
      tipo: sanitizeText(form.tipo),
      organizador: sanitizeText(form.organizador),
      contacto: sanitizeText(form.contacto),
      imagen: sanitizeText(form.imagen),
      activo: Boolean(form.activo),
    };

    const missingField = requiredFields.find((field) => !cleaned[field]);
    if (missingField) {
      setError(
        "Completa los campos obligatorios: nombre, descripción, fecha y lugar.",
      );
      return;
    }

    if (Number.isNaN(new Date(`${cleaned.fecha}T12:00:00`).getTime())) {
      setError("La fecha ingresada no es válida.");
      return;
    }

    const itemId = editing || createContentId("evento", cleaned.nombre);
    setSaving(true);
    try {
      const imageUrl = imageFile
        ? await uploadContentImage(imageFile, "eventos", itemId)
        : cleaned.imagen;

      await upsertEvento({ ...cleaned, imagen: imageUrl, id: itemId });
      setForm(emptyEvento);
      setInitialForm(emptyEvento);
      setError("");
      setModal(false);
      setImageFile(null);
      setImagePreviewUrl("");
    } finally {
      setSaving(false);
    }
  };

  const del = (id) => {
    if (!canEdit) {
      return;
    }

    if (confirm("¿Eliminar evento?")) deleteEvento(id);
  };

  const previewEvento = {
    nombre: form.nombre || "Nombre del evento",
    descripcion:
      form.descripcion ||
      "Aquí verás cómo se mostrará la descripción en la tarjeta pública.",
    fecha: form.fecha,
    hora: form.hora || "Hora por confirmar",
    lugar: form.lugar || "Lugar por confirmar",
    tipo: form.tipo || "Evento",
    organizador: form.organizador,
    contacto: form.contacto,
    imagen: imagePreviewUrl || form.imagen || FALLBACK_EVENT_IMAGE,
    activo: Boolean(form.activo),
  };

  useEffect(() => {
    if (!modal) {
      onLivePreviewChange(null);
      return;
    }

    onLivePreviewChange({
      section: "eventos",
      path: "/eventos",
      image: previewEvento.imagen,
      badge: previewEvento.tipo,
      title: previewEvento.nombre,
      subtitle: `${formatFecha(previewEvento.fecha)} · ${previewEvento.lugar}`,
      body: previewEvento.descripcion,
      status: previewEvento.activo ? "Publicado" : "Oculto",
    });
  }, [
    modal,
    previewEvento.imagen,
    previewEvento.tipo,
    previewEvento.nombre,
    previewEvento.fecha,
    previewEvento.lugar,
    previewEvento.descripcion,
    previewEvento.activo,
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
          <h2>Eventos ({eventos.length})</h2>
          <button
            className="btn btn-primary"
            onClick={openNew}
            disabled={!canEdit}
          >
            + Nuevo Evento
          </button>
        </div>

        {!canEdit && (
          <div className="admin-readonly-note">
            Modo visualizador: la edición de eventos está deshabilitada.
          </div>
        )}
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Fecha</th>
              <th>Lugar</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {orderedEventos.map((ev) => (
              <tr key={ev.id}>
                <td>
                  <strong>{ev.nombre}</strong>
                </td>
                <td>{ev.tipo || "General"}</td>
                <td>{formatFecha(ev.fecha)}</td>
                <td>{ev.lugar}</td>
                <td>
                  <span
                    className={`badge ${ev.activo !== false ? "badge-ocean" : "badge-gold"}`}
                  >
                    {ev.activo !== false ? "Publicado" : "Oculto"}
                  </span>
                </td>
                <td>
                  <button
                    className="action-btn edit-btn"
                    onClick={() => openEdit(ev)}
                    disabled={!canEdit}
                  >
                    <FaEdit className="inline-icon" aria-hidden="true" />
                    Editar
                  </button>
                  <button
                    className="action-btn del-btn"
                    onClick={() => del(ev.id)}
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
            <h2>{editing ? "Editar Evento" : "Nuevo Evento"}</h2>
            {error && <div className="login-error">{error}</div>}

            <div className="admin-form-preview-grid">
              <div className="admin-form-column">
                {[
                  [
                    "nombre",
                    "Nombre",
                    "text",
                    "Ej: Festival de Música Costera",
                  ],
                  ["fecha", "Fecha", "date", ""],
                  ["hora", "Hora", "time", ""],
                  ["lugar", "Lugar", "text", "Ej: Parque Central"],
                  [
                    "organizador",
                    "Organizador",
                    "text",
                    "Ej: GAD Municipal de Santa Rosa",
                  ],
                  [
                    "contacto",
                    "Contacto",
                    "text",
                    "Ej: turismo@santarosa.gob.ec",
                  ],
                ].map(([field, label, type, placeholder]) => (
                  <div key={field} className="modal-field">
                    <label>{label}</label>
                    <input
                      type={type}
                      value={form[field]}
                      onChange={(e) =>
                        setForm({ ...form, [field]: e.target.value })
                      }
                      placeholder={placeholder}
                    />
                  </div>
                ))}

                <AdminImageField
                  label="Imagen del evento"
                  value={form.imagen}
                  selectedFile={imageFile}
                  onFileChange={handleImageFileChange}
                  onUrlChange={(nextUrl) =>
                    setForm({ ...form, imagen: nextUrl })
                  }
                />

                <div className="modal-field">
                  <label>Tipo de evento</label>
                  <select
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  >
                    <option value="Cultural">Cultural</option>
                    <option value="Gastronómico">Gastronómico</option>
                    <option value="Turístico">Turístico</option>
                    <option value="Deportivo">Deportivo</option>
                    <option value="Institucional">Institucional</option>
                    <option value="Comunitario">Comunitario</option>
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

                <label className="modal-check-row">
                  <input
                    type="checkbox"
                    checked={Boolean(form.activo)}
                    onChange={(e) =>
                      setForm({ ...form, activo: e.target.checked })
                    }
                  />
                  <span>Publicar este evento en la página web</span>
                </label>

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
                <h3 className="admin-preview-title">Vista previa del evento</h3>
                <div className="admin-preview-card-frame">
                  <article className="evento-card admin-preview-event-card">
                    <img
                      src={previewEvento.imagen}
                      alt={previewEvento.nombre}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        if (e.currentTarget.src !== FALLBACK_EVENT_IMAGE) {
                          e.currentTarget.src = FALLBACK_EVENT_IMAGE;
                        }
                      }}
                    />
                    <div className="evento-body">
                      <div className="evento-chip">{previewEvento.tipo}</div>
                      <div className="evento-fecha">
                        <FaCalendarAlt
                          className="inline-icon"
                          aria-hidden="true"
                        />
                        {formatFecha(previewEvento.fecha)}
                      </div>
                      <h3>{previewEvento.nombre}</h3>
                      <p>{previewEvento.descripcion}</p>
                      <div className="evento-meta-grid">
                        <div className="evento-lugar">
                          <FaMapMarkerAlt
                            className="inline-icon"
                            aria-hidden="true"
                          />
                          {previewEvento.lugar}
                        </div>
                        <div className="evento-lugar">
                          <FaClock className="inline-icon" aria-hidden="true" />
                          {previewEvento.hora}
                        </div>
                      </div>
                      {previewEvento.organizador && (
                        <div className="evento-extra">
                          Organiza: {previewEvento.organizador}
                        </div>
                      )}
                      {previewEvento.contacto && (
                        <div className="evento-extra">
                          Contacto: {previewEvento.contacto}
                        </div>
                      )}
                    </div>
                  </article>
                </div>

                <div className="admin-preview-note">
                  Estado de publicación:{" "}
                  {previewEvento.activo ? "Publicado" : "Oculto"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
