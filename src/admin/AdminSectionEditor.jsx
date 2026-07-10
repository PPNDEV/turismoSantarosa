import { useEffect, useMemo, useRef, useState } from "react";
import {
  FaArrowDown,
  FaArrowUp,
  FaEdit,
  FaImage,
  FaPlus,
  FaSave,
  FaTimes,
  FaTrash,
} from "react-icons/fa";
import { useContent } from "../context/useContent";
import AdminImageField from "./AdminImageField";
import { uploadContentImage } from "../services/uploadService";
import { SECTION_SCHEMAS, emptyValueForFields } from "./sectionSchemas";

// ---------------------------------------------------------------------------
// Helpers inmutables para leer/escribir valores anidados por ruta (path array).
// ---------------------------------------------------------------------------
function deepClone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function getIn(target, path) {
  return path.reduce(
    (acc, key) => (acc == null ? undefined : acc[key]),
    target,
  );
}

function setIn(target, path, value) {
  if (path.length === 0) return value;
  const [head, ...rest] = path;
  if (Array.isArray(target)) {
    const copy = target.slice();
    copy[head] = setIn(copy[head], rest, value);
    return copy;
  }
  const copy = { ...(target || {}) };
  copy[head] = setIn(copy[head], rest, value);
  return copy;
}

function pathKeyOf(path) {
  return path.join(".");
}

function pathFromKey(key) {
  return key
    .split(".")
    .map((segment) => (/^\d+$/.test(segment) ? Number(segment) : segment));
}

function sanitizeStorageId(value) {
  return String(value || "img")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .slice(0, 60);
}

// Nombre/miniatura que se muestra en la tarjeta compacta de cada elemento de una lista.
const SUMMARY_NAME_KEYS = [
  "nombre",
  "nombreComun",
  "titulo",
  "tipo",
  "tarifa",
];

function summarizeListDetail(itemFields, itemValue) {
  const detailField = itemFields.find(
    (field) =>
      field.type !== "image" &&
      !SUMMARY_NAME_KEYS.includes(field.name) &&
      itemValue?.[field.name],
  );

  return detailField ? String(itemValue[detailField.name]) : "Sin detalle";
}

function summarizeListItem(itemFields, itemValue, itemLabel, index) {
  let title = "";
  for (const key of SUMMARY_NAME_KEYS) {
    if (itemValue?.[key]) {
      title = String(itemValue[key]);
      break;
    }
  }
  if (!title) {
    const textField = itemFields.find((f) => f.type === "text");
    if (textField && itemValue?.[textField.name]) {
      title = String(itemValue[textField.name]);
    }
  }
  if (!title) title = `${itemLabel} ${index + 1}`;

  const imageField = itemFields.find((f) => f.type === "image");
  const image = imageField ? itemValue?.[imageField.name] : "";

  return { title, image };
}

// ---------------------------------------------------------------------------
// Editor genérico de secciones editoriales anidadas.
// ---------------------------------------------------------------------------
export default function AdminSectionEditor({
  nodeKey,
  canEdit = true,
  currentUser = null,
  onDirtyChange = () => {},
}) {
  const schema = SECTION_SCHEMAS[nodeKey];
  const { sections, upsertSection } = useContent();
  const rawSection = sections?.[nodeKey];

  const [draft, setDraft] = useState(null);
  const [initial, setInitial] = useState(null);
  const [files, setFiles] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingList, setEditingList] = useState(null);
  const initializedRef = useRef(false);

  const isAdmin = currentUser?.role === "administrador";
  const canEditSection = canEdit && isAdmin;

  // Inicializa el borrador la primera vez que llega el contenido del nodo.
  useEffect(() => {
    if (initializedRef.current || rawSection === undefined) return;
    const base =
      rawSection && typeof rawSection === "object"
        ? deepClone(rawSection)
        : emptyValueForFields(schema.fields);
    setDraft(base);
    setInitial(base);
    initializedRef.current = true;
  }, [rawSection, schema]);

  const dirty = useMemo(() => {
    if (!draft || !initial) return false;
    return (
      JSON.stringify(draft) !== JSON.stringify(initial) ||
      Object.keys(files).length > 0
    );
  }, [draft, initial, files]);

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  useEffect(() => () => onDirtyChange(false), [onDirtyChange]);

  const updateValue = (path, value) => {
    setSuccess("");
    setDraft((prev) => setIn(prev, path, value));
  };

  const handleFileChange = (path, file) => {
    setSuccess("");
    const key = pathKeyOf(path);
    setFiles((prev) => {
      const next = { ...prev };
      if (file) {
        next[key] = file;
      } else {
        delete next[key];
      }
      return next;
    });
  };

  const addListItem = (path, itemFields) => {
    setDraft((prev) => {
      const current = getIn(prev, path) || [];
      return setIn(prev, path, [
        ...current,
        emptyValueForFields(itemFields),
      ]);
    });
  };

  const removeListItem = (path, index) => {
    setDraft((prev) => {
      const current = getIn(prev, path) || [];
      return setIn(
        prev,
        path,
        current.filter((_, i) => i !== index),
      );
    });
    // Limpia archivos pendientes que cuelguen de la fila eliminada.
    setFiles((prev) => {
      const prefix = pathKeyOf([...path, index]);
      const next = {};
      for (const [key, value] of Object.entries(prev)) {
        if (!key.startsWith(`${prefix}.`)) next[key] = value;
      }
      return next;
    });
  };

  const moveListItem = (path, index, direction) => {
    setDraft((prev) => {
      const current = getIn(prev, path) || [];
      const target = index + direction;
      if (target < 0 || target >= current.length) return prev;
      const copy = current.slice();
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return setIn(prev, path, copy);
    });
  };

  const save = async () => {
    if (!canEditSection || saving) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      let next = deepClone(draft);
      // Sube las imágenes pendientes y reemplaza por su URL.
      for (const [key, file] of Object.entries(files)) {
        const path = pathFromKey(key);
        const url = await uploadContentImage(
          file,
          nodeKey,
          sanitizeStorageId(key),
        );
        next = setIn(next, path, url);
      }
      await upsertSection(nodeKey, next);
      setDraft(next);
      setInitial(next);
      setFiles({});
      setSuccess("Cambios guardados y publicados.");
    } catch (err) {
      setError(err?.message || "No se pudo guardar la sección.");
    } finally {
      setSaving(false);
    }
  };

  const discard = () => {
    setDraft(deepClone(initial));
    setFiles({});
    setError("");
    setSuccess("");
    setEditingList(null);
  };

  const openListItemEditor = (path, index, field) => {
    setEditingList({ path, index, field });
  };

  if (!schema) {
    return <div className="admin-alert admin-alert-error">Sección desconocida.</div>;
  }

  if (!draft) {
    return <div className="admin-loading">Cargando contenido...</div>;
  }

  return (
    <div className="admin-section-editor">
      <div className="admin-table-card">
        <div className="admin-table-header">
          <div>
            <h2>{schema.title}</h2>
            {schema.description && (
              <p className="admin-section-subtitle">{schema.description}</p>
            )}
          </div>
          <div className="admin-section-actions">
            {dirty && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={discard}
                disabled={saving}
              >
                Descartar
              </button>
            )}
            <button
              type="button"
              className="btn btn-primary"
              onClick={save}
              disabled={!canEditSection || saving || !dirty}
            >
              {saving ? (
                <span className="btn-spinner" aria-hidden="true" />
              ) : (
                <FaSave className="inline-icon" aria-hidden="true" />
              )}
              {saving ? "Guardando..." : "Guardar y publicar"}
            </button>
          </div>
        </div>

        {!isAdmin && (
          <div className="admin-readonly-note">
            Esta sección solo puede editarla un administrador.
          </div>
        )}
        {error && <div className="admin-alert admin-alert-error">{error}</div>}
        {success && (
          <div className="admin-alert admin-alert-success">{success}</div>
        )}

        <fieldset
          className="admin-section-fields"
          disabled={!canEditSection || saving}
        >
          {schema.fields.map((field) => (
            <FieldRenderer
              key={field.name}
              field={field}
              path={[field.name]}
              draft={draft}
              files={files}
              onChange={updateValue}
              onFileChange={handleFileChange}
              onAddItem={addListItem}
              onRemoveItem={removeListItem}
              onMoveItem={moveListItem}
              onEditItem={openListItemEditor}
            />
          ))}
        </fieldset>
      </div>

      {editingList &&
        getIn(draft, [...editingList.path, editingList.index]) !==
          undefined && (
          <div
            className="modal-overlay"
            onClick={() => setEditingList(null)}
          >
            <div
              className="modal-box admin-user-modal admin-section-item-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="admin-modal-header">
                <h2>
                  {(editingList.field.itemLabel || "Elemento")}{" "}
                  {editingList.index + 1}
                </h2>
                <button
                  type="button"
                  className="action-btn"
                  onClick={() => setEditingList(null)}
                  aria-label="Cerrar"
                >
                  <FaTimes aria-hidden="true" />
                </button>
              </div>

              <fieldset
                className="admin-section-fields"
                disabled={!canEditSection || saving}
              >
                {editingList.field.item.map((sub) => (
                  <FieldRenderer
                    key={sub.name}
                    field={sub}
                    path={[...editingList.path, editingList.index, sub.name]}
                    draft={draft}
                    files={files}
                    onChange={updateValue}
                    onFileChange={handleFileChange}
                    onAddItem={addListItem}
                    onRemoveItem={removeListItem}
                    onMoveItem={moveListItem}
                    onEditItem={openListItemEditor}
                  />
                ))}
              </fieldset>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => {
                    removeListItem(editingList.path, editingList.index);
                    setEditingList(null);
                  }}
                  disabled={!canEditSection || saving}
                >
                  <FaTrash className="inline-icon" aria-hidden="true" />{" "}
                  Eliminar
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setEditingList(null)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Renderizador recursivo de campos.
// ---------------------------------------------------------------------------
function FieldRenderer({
  field,
  path,
  draft,
  files,
  onChange,
  onFileChange,
  onAddItem,
  onRemoveItem,
  onMoveItem,
  onEditItem,
}) {
  const value = getIn(draft, path);

  if (field.type === "object") {
    return (
      <div className="admin-section-group">
        <h3 className="admin-section-group-title">{field.label}</h3>
        <div className="admin-section-group-body">
          {field.fields.map((sub) => (
            <FieldRenderer
              key={sub.name}
              field={sub}
              path={[...path, sub.name]}
              draft={draft}
              files={files}
              onChange={onChange}
              onFileChange={onFileChange}
              onAddItem={onAddItem}
              onRemoveItem={onRemoveItem}
              onMoveItem={onMoveItem}
              onEditItem={onEditItem}
            />
          ))}
        </div>
      </div>
    );
  }

  if (field.type === "list") {
    const items = Array.isArray(value) ? value : [];
    const itemLabel = field.itemLabel || "Elemento";
    return (
      <div className="admin-section-group">
        <div className="admin-section-group-header">
          <h3 className="admin-section-group-title">
            {field.label} ({items.length})
          </h3>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => onAddItem(path, field.item)}
          >
            <FaPlus className="inline-icon" aria-hidden="true" /> Añadir
          </button>
        </div>

        {items.length === 0 ? (
          <p className="admin-section-empty">
            Sin {itemLabel.toLowerCase()}s. Usa “Agregar”.
          </p>
        ) : (
          <div className="admin-section-table-scroll">
            <table className="admin-section-table">
              <thead>
                <tr>
                  <th>Orden</th>
                  <th>Imagen</th>
                  <th>Título</th>
                  <th>Detalle</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => {
                  const summary = summarizeListItem(
                    field.item,
                    item,
                    itemLabel,
                    index,
                  );
                  const detail = summarizeListDetail(field.item, item);
                  return (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>
                        <span className="admin-section-table-thumb">
                          {summary.image ? (
                            <img src={summary.image} alt={`Imagen de ${summary.title}`} />
                          ) : (
                            <FaImage aria-hidden="true" />
                          )}
                        </span>
                      </td>
                      <td>
                        <strong className="admin-section-table-title">
                          {summary.title}
                        </strong>
                        <span className="admin-section-table-type">{itemLabel}</span>
                      </td>
                      <td>
                        <span className="admin-section-table-detail">{detail}</span>
                      </td>
                      <td>
                        <span className="admin-section-table-actions">
                    <button
                      type="button"
                      className="action-btn move-btn icon-btn"
                      onClick={() => onMoveItem(path, index, -1)}
                      disabled={index === 0}
                      title="Subir"
                      aria-label="Subir"
                    >
                      <FaArrowUp aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="action-btn move-btn icon-btn"
                      onClick={() => onMoveItem(path, index, 1)}
                      disabled={index === items.length - 1}
                      title="Bajar"
                      aria-label="Bajar"
                    >
                      <FaArrowDown aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="action-btn edit-btn icon-btn"
                      onClick={() => onEditItem(path, index, field)}
                      title="Editar"
                      aria-label={`Editar ${summary.title}`}
                    >
                      <FaEdit aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="action-btn del-btn icon-btn"
                      onClick={() => onRemoveItem(path, index)}
                      title="Eliminar"
                      aria-label={`Eliminar ${summary.title}`}
                    >
                      <FaTrash aria-hidden="true" />
                    </button>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  if (field.type === "image") {
    const key = pathKeyOf(path);
    return (
      <AdminImageField
        label={field.label}
        value={value || ""}
        selectedFile={files[key] || null}
        onFileChange={(file) => onFileChange(path, file)}
        onUrlChange={(url) => onChange(path, url)}
      />
    );
  }

  if (field.type === "select") {
    return (
      <div className="modal-field">
        <label>{field.label}</label>
        <select
          value={value || ""}
          onChange={(e) => onChange(path, e.target.value)}
        >
          <option value="">— Seleccionar —</option>
          {field.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <div className="modal-field">
        <label>{field.label}</label>
        <textarea
          value={value || ""}
          onChange={(e) => onChange(path, e.target.value)}
          rows={4}
        />
      </div>
    );
  }

  return (
    <div className="modal-field">
      <label>{field.label}</label>
      <input
        type="text"
        value={value || ""}
        onChange={(e) => onChange(path, e.target.value)}
      />
    </div>
  );
}
