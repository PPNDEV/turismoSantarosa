import { useEffect, useState } from "react";
import { FaEdit, FaMapMarkerAlt, FaSave, FaTrash } from "react-icons/fa";
import { useContent } from "../context/useContent";
import AdminImageField from "./AdminImageField";
import { createContentId, uploadContentImage } from "./adminImageUpload";
import {
  destinoIconOptions,
  getDestinoIconComponent,
  normalizeDestinoIcon,
} from "../utils/destinoIcons";

const FALLBACK_DESTINO_IMAGE =
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900";

const emptyDestino = {
  nombre: "",
  isla: "Jambelí",
  descripcion: "",
  imagen: "",
  categoria: "",
  icono: "playa",
  lat: "",
  lng: "",
};

function normalizeCoord(value) {
  if (value === "" || value === null || value === undefined) {
    return "";
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : "";
}

function hasDraftChanges(currentForm, initialForm) {
  return JSON.stringify(currentForm) !== JSON.stringify(initialForm);
}

export default function AdminDestinos({
  canEdit = true,
  onLivePreviewChange = () => {},
  onDirtyChange = () => {},
}) {
  const { destinos, upsertDestino, deleteDestino } = useContent();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyDestino);
  const [initialForm, setInitialForm] = useState(emptyDestino);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const openNew = () => {
    if (!canEdit) {
      return;
    }

    const nextForm = { ...emptyDestino };
    setForm(nextForm);
    setInitialForm(nextForm);
    setImageFile(null);
    setImagePreviewUrl("");
    setEditing(null);
    setModal(true);
  };
  const openEdit = (d) => {
    if (!canEdit) {
      return;
    }

    const nextForm = { ...d, icono: normalizeDestinoIcon(d.icono) };
    setForm(nextForm);
    setInitialForm(nextForm);
    setImageFile(null);
    setImagePreviewUrl("");
    setEditing(d.id);
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

    const itemId = editing || createContentId("destino", form.nombre);
    setSaving(true);
    try {
      const imageUrl = imageFile
        ? await uploadContentImage(imageFile, "destinos", itemId)
        : form.imagen;

      await upsertDestino({
        ...form,
        imagen: imageUrl,
        icono: normalizeDestinoIcon(form.icono),
        id: itemId,
        lat: normalizeCoord(form.lat),
        lng: normalizeCoord(form.lng),
      });
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

    if (confirm("¿Eliminar destino?")) deleteDestino(id);
  };

  const previewDestino = {
    nombre: form.nombre || "Nombre del destino",
    descripcion:
      form.descripcion ||
      "Descripción breve para promocionar el destino en la página principal.",
    imagen: imagePreviewUrl || form.imagen || FALLBACK_DESTINO_IMAGE,
    isla: form.isla || "Jambelí",
    categoria: form.categoria || "Categoría",
    icono: normalizeDestinoIcon(form.icono),
  };

  const previewIconLabel =
    destinoIconOptions.find((option) => option.value === previewDestino.icono)
      ?.label || "Ubicación";

  useEffect(() => {
    if (!modal) {
      onLivePreviewChange(null);
      return;
    }

    onLivePreviewChange({
      section: "destinos",
      path: "/destinos",
      image: previewDestino.imagen,
      badge: `${previewDestino.isla} · ${previewIconLabel}`,
      title: previewDestino.nombre,
      subtitle: "Destino turístico",
      body: previewDestino.descripcion,
      status: "Listo para publicación",
    });
  }, [
    modal,
    previewDestino.imagen,
    previewDestino.icono,
    previewDestino.isla,
    previewDestino.categoria,
    previewIconLabel,
    previewDestino.nombre,
    previewDestino.descripcion,
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
          <h2>Destinos ({destinos.length})</h2>
          <button
            className="btn btn-primary"
            onClick={openNew}
            disabled={!canEdit}
          >
            + Nuevo Destino
          </button>
        </div>

        {!canEdit && (
          <div className="admin-readonly-note">
            Modo visualizador: destinos disponibles solo para consulta.
          </div>
        )}

        <table>
          <thead>
            <tr>
              <th>Destino</th>
              <th>Isla</th>
              <th>Categoría</th>
              <th>Descripción</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {destinos.map((d) => {
              const DestinoIcon = getDestinoIconComponent(d.icono);

              return (
                <tr key={d.id}>
                  <td>
                    <strong>
                      <DestinoIcon className="inline-icon" aria-hidden="true" />
                      {d.nombre}
                    </strong>
                  </td>
                  <td>{d.isla || "-"}</td>
                  <td>{d.categoria}</td>
                  <td
                    style={{
                      maxWidth: "300px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {d.descripcion}
                  </td>
                  <td>
                    <button
                      className="action-btn edit-btn"
                      onClick={() => openEdit(d)}
                      disabled={!canEdit}
                    >
                      <FaEdit className="inline-icon" aria-hidden="true" />
                      Editar
                    </button>
                    <button
                      className="action-btn del-btn"
                      onClick={() => del(d.id)}
                      disabled={!canEdit}
                    >
                      <FaTrash className="inline-icon" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal-box modal-box-preview"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>{editing ? "Editar Destino" : "Nuevo Destino"}</h2>
            <div className="admin-form-preview-grid">
              <div className="admin-form-column">
                {[
                  ["nombre", "Nombre"],
                  ["isla", "Isla"],
                  ["categoria", "Categoría"],
                  ["lat", "Latitud"],
                  ["lng", "Longitud"],
                ].map(([f, lbl]) => (
                  <div key={f} className="modal-field">
                    <label>{lbl}</label>
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
                  label="Imagen del destino"
                  value={form.imagen}
                  selectedFile={imageFile}
                  onFileChange={handleImageFileChange}
                  onUrlChange={(nextUrl) =>
                    setForm({ ...form, imagen: nextUrl })
                  }
                />

                <div className="modal-field">
                  <label>Tipo de ícono</label>
                  <select
                    value={form.icono || "playa"}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        icono: normalizeDestinoIcon(e.target.value),
                      })
                    }
                  >
                    {destinoIconOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
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
                    <FaSave className="inline-icon" aria-hidden="true" />
                    {saving ? "Guardando..." : "Guardar"}
                  </button>
                </div>
              </div>

              <div className="admin-preview-column">
                <h3 className="admin-preview-title">
                  Vista previa del destino
                </h3>
                <div className="admin-preview-card-frame">
                  <article className="destino-card admin-preview-destino-card">
                    <img
                      src={previewDestino.imagen}
                      alt={previewDestino.nombre}
                      onError={(e) => {
                        if (e.currentTarget.src !== FALLBACK_DESTINO_IMAGE) {
                          e.currentTarget.src = FALLBACK_DESTINO_IMAGE;
                        }
                      }}
                    />
                    <div className="destino-info">
                      <div className="destino-cat">
                        <FaMapMarkerAlt
                          className="inline-icon"
                          aria-hidden="true"
                        />
                        {previewDestino.isla} ·{previewDestino.categoria}
                      </div>
                      <h3>{previewDestino.nombre}</h3>
                      <p>{previewDestino.descripcion}</p>
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
