import { useEffect, useMemo, useRef, useState } from "react";
import {
  FaArrowDown,
  FaArrowUp,
  FaPlus,
  FaSave,
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
  const initializedRef = useRef(false);

  const isAdmin = currentUser?.role === "administrador";
  const canEditSection = canEdit && isAdmin;

  // Inicializa el borrador la primera vez que llega el contenido del nodo.
  /* eslint-disable react-hooks/set-state-in-effect */
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
  /* eslint-enable react-hooks/set-state-in-effect */

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
              <FaSave className="inline-icon" aria-hidden="true" />
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
            />
          ))}
        </fieldset>
      </div>
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
            className="btn btn-outline btn-sm"
            onClick={() => onAddItem(path, field.item)}
          >
            <FaPlus className="inline-icon" aria-hidden="true" /> Agregar{" "}
            {itemLabel.toLowerCase()}
          </button>
        </div>

        {items.length === 0 ? (
          <p className="admin-section-empty">
            Sin {itemLabel.toLowerCase()}s. Usa “Agregar”.
          </p>
        ) : (
          <div className="admin-section-list">
            {items.map((_, index) => (
              <div className="admin-section-item" key={index}>
                <div className="admin-section-item-header">
                  <span className="admin-section-item-title">
                    {itemLabel} #{index + 1}
                  </span>
                  <div className="admin-section-item-actions">
                    <button
                      type="button"
                      className="action-btn"
                      onClick={() => onMoveItem(path, index, -1)}
                      disabled={index === 0}
                      aria-label="Subir"
                    >
                      <FaArrowUp aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="action-btn"
                      onClick={() => onMoveItem(path, index, 1)}
                      disabled={index === items.length - 1}
                      aria-label="Bajar"
                    >
                      <FaArrowDown aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="action-btn del-btn"
                      onClick={() => onRemoveItem(path, index)}
                      aria-label="Eliminar"
                    >
                      <FaTrash aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <div className="admin-section-item-body">
                  {field.item.map((sub) => (
                    <FieldRenderer
                      key={sub.name}
                      field={sub}
                      path={[...path, index, sub.name]}
                      draft={draft}
                      files={files}
                      onChange={onChange}
                      onFileChange={onFileChange}
                      onAddItem={onAddItem}
                      onRemoveItem={onRemoveItem}
                      onMoveItem={onMoveItem}
                    />
                  ))}
                </div>
              </div>
            ))}
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
