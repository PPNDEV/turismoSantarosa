import { useEffect, useMemo, useRef, useState } from "react";
import {
  FaArrowDown,
  FaArrowUp,
  FaCheck,
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
  "subtipo",
  "tipo",
  "tarifa",
];

function summarizeListDetail(itemFields, itemValue, titleKey) {
  const detailField = itemFields.find(
    (field) =>
      field.type !== "image" &&
      field.name !== titleKey &&
      itemValue?.[field.name],
  );

  return detailField ? String(itemValue[detailField.name]) : "Sin detalle";
}

function remapListFileKeys(fileMap, path, mapIndex) {
  const prefix = `${pathKeyOf(path)}.`;
  const next = {};

  for (const [key, file] of Object.entries(fileMap)) {
    if (!key.startsWith(prefix)) {
      next[key] = file;
      continue;
    }

    const remainder = key.slice(prefix.length);
    const separatorIndex = remainder.indexOf(".");
    const indexText =
      separatorIndex === -1 ? remainder : remainder.slice(0, separatorIndex);
    const index = Number(indexText);

    if (!Number.isInteger(index)) {
      next[key] = file;
      continue;
    }

    const mappedIndex = mapIndex(index);
    if (mappedIndex == null) continue;

    const suffix = separatorIndex === -1 ? "" : remainder.slice(separatorIndex);
    next[`${prefix}${mappedIndex}${suffix}`] = file;
  }

  return next;
}

function summarizeListItem(itemFields, itemValue, itemLabel, index) {
  let title = "";
  let titleKey = "";
  for (const key of SUMMARY_NAME_KEYS) {
    if (itemValue?.[key]) {
      title = String(itemValue[key]);
      titleKey = key;
      break;
    }
  }
  if (!title) {
    const textField = itemFields.find((f) => f.type === "text");
    if (textField && itemValue?.[textField.name]) {
      title = String(itemValue[textField.name]);
      titleKey = textField.name;
    }
  }
  if (!title) title = `${itemLabel} ${index + 1}`;

  const imageField = itemFields.find((f) => f.type === "image");
  const image = imageField ? itemValue?.[imageField.name] : "";

  return { title, image, titleKey };
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
  const { sections, contentErrors, upsertSection } = useContent();
  const rawSection = sections?.[nodeKey];
  const readError = contentErrors?.[nodeKey];

  const [draft, setDraft] = useState(null);
  const [initial, setInitial] = useState(null);
  const [files, setFiles] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingList, setEditingList] = useState(null);
  const [editingField, setEditingField] = useState(null);
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

  const addListItem = (path, field) => {
    const current = getIn(draft, path) || [];
    const index = current.length;
    const nextItem = emptyValueForFields(field.item);

    setDraft((prev) => setIn(prev, path, [...current, nextItem]));
    setEditingList({
      path,
      index,
      field,
      isNew: true,
      originalValue: null,
      filesSnapshot: { ...files },
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
    setFiles((prev) =>
      remapListFileKeys(prev, path, (fileIndex) => {
        if (fileIndex === index) return null;
        return fileIndex > index ? fileIndex - 1 : fileIndex;
      }),
    );
  };

  const moveListItem = (path, index, direction) => {
    const current = getIn(draft, path) || [];
    const target = index + direction;
    if (target < 0 || target >= current.length) return;

    setDraft((prev) => {
      const latest = getIn(prev, path) || [];
      const copy = latest.slice();
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return setIn(prev, path, copy);
    });
    setFiles((prev) =>
      remapListFileKeys(prev, path, (fileIndex) => {
        if (fileIndex === index) return target;
        if (fileIndex === target) return index;
        return fileIndex;
      }),
    );
  };

  const save = async () => {
    if (!canEditSection || saving || readError) return;
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
    setEditingField(null);
  };

  const openListItemEditor = (path, index, field) => {
    setEditingList({
      path,
      index,
      field,
      isNew: false,
      originalValue: deepClone(getIn(draft, [...path, index])),
      filesSnapshot: { ...files },
    });
  };

  const closeListItemEditor = (applyChanges) => {
    if (!editingList) return;

    if (!applyChanges) {
      if (editingList.isNew) {
        setDraft((prev) => {
          const current = getIn(prev, editingList.path) || [];
          return setIn(
            prev,
            editingList.path,
            current.filter((_, index) => index !== editingList.index),
          );
        });
      } else {
        setDraft((prev) =>
          setIn(
            prev,
            [...editingList.path, editingList.index],
            editingList.originalValue,
          ),
        );
      }
      setFiles(editingList.filesSnapshot);
    }

    setEditingList(null);
  };

  const openFieldEditor = (field, path) => {
    setEditingField({
      field,
      path,
      originalValue: deepClone(getIn(draft, path)),
      filesSnapshot: { ...files },
    });
  };

  const closeFieldEditor = (applyChanges) => {
    if (!editingField) return;

    if (!applyChanges) {
      setDraft((prev) =>
        setIn(prev, editingField.path, editingField.originalValue),
      );
      setFiles(editingField.filesSnapshot);
    }

    setEditingField(null);
  };

  useEffect(() => {
    if (!editingList && !editingField) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key !== "Escape") return;
      if (editingField) {
        closeFieldEditor(false);
      } else {
        closeListItemEditor(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  });

  if (!schema) {
    return <div className="admin-alert admin-alert-error">Sección desconocida.</div>;
  }

  if (readError && !draft) {
    return (
      <div className="admin-table-card admin-section-load-error" role="alert">
        <h2>No se pudo cargar {schema.title}</h2>
        <p>
          La edición está bloqueada para proteger el contenido publicado.
          Recarga la página e inténtalo de nuevo.
        </p>
      </div>
    );
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
              disabled={
                !canEditSection || saving || !dirty || Boolean(readError)
              }
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
        {readError && (
          <div className="admin-alert admin-alert-error" role="alert">
            No se pudo cargar esta sección. La edición está bloqueada para
            proteger el contenido publicado. Recarga la página e inténtalo de
            nuevo.
          </div>
        )}
        {success && (
          <div className="admin-alert admin-alert-success">{success}</div>
        )}

        <fieldset
          className="admin-section-fields admin-section-main-fields"
          disabled={!canEditSection || saving || Boolean(readError)}
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
              onEditField={openFieldEditor}
            />
          ))}
        </fieldset>
      </div>

      {editingList &&
        getIn(draft, [...editingList.path, editingList.index]) !==
          undefined && (
          <div
            className="modal-overlay"
            onClick={() => closeListItemEditor(false)}
          >
            <div
              className="modal-box admin-user-modal admin-section-item-modal"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="admin-list-modal-title"
            >
              <div className="admin-modal-header">
                <h2 id="admin-list-modal-title">
                  {editingList.isNew ? "Añadir" : "Editar"}{" "}
                  {(editingList.field.itemLabel || "elemento").toLowerCase()}
                </h2>
                <button
                  type="button"
                  className="modal-close-btn admin-section-modal-close"
                  onClick={() => closeListItemEditor(false)}
                  aria-label="Cerrar"
                >
                  <FaTimes aria-hidden="true" />
                </button>
              </div>

              <fieldset
                className="admin-section-fields admin-section-modal-fields"
                disabled={!canEditSection || saving}
              >
                {editingList.field.item.map((sub, subIndex) => (
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
                    onEditField={openFieldEditor}
                    displayMode="form"
                    shouldAutoFocus={subIndex === 0}
                  />
                ))}
              </fieldset>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => closeListItemEditor(false)}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => closeListItemEditor(true)}
                >
                  <FaCheck className="inline-icon" aria-hidden="true" />
                  Aplicar cambios
                </button>
              </div>
            </div>
          </div>
        )}

      {editingField && (
        <div className="modal-overlay" onClick={() => closeFieldEditor(false)}>
          <div
            className="modal-box admin-section-text-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-field-modal-title"
          >
            <div className="admin-modal-header">
              <div>
                <span className="admin-section-modal-eyebrow">
                  Contenido editorial
                </span>
                <h2 id="admin-field-modal-title">
                  {editingField.field.label}
                </h2>
              </div>
              <button
                type="button"
                className="modal-close-btn admin-section-modal-close"
                onClick={() => closeFieldEditor(false)}
                aria-label="Cerrar"
              >
                <FaTimes aria-hidden="true" />
              </button>
            </div>

            <div className="admin-section-modal-body">
              <p className="admin-section-modal-help">
                Edita este contenido y aplícalo al borrador. Se publicará
                cuando uses “Guardar y publicar”.
              </p>
              <fieldset
                className="admin-section-fields admin-section-modal-fields"
                disabled={!canEditSection || saving}
              >
                <FieldRenderer
                  field={editingField.field}
                  path={editingField.path}
                  draft={draft}
                  files={files}
                  onChange={updateValue}
                  onFileChange={handleFileChange}
                  onAddItem={addListItem}
                  onRemoveItem={removeListItem}
                  onMoveItem={moveListItem}
                  onEditItem={openListItemEditor}
                  onEditField={openFieldEditor}
                  displayMode="form"
                  shouldAutoFocus
                />
              </fieldset>
            </div>

            <div className="modal-actions admin-section-modal-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => closeFieldEditor(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => closeFieldEditor(true)}
              >
                <FaCheck className="inline-icon" aria-hidden="true" />
                Aplicar cambios
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
  onEditField,
  displayMode = "summary",
  shouldAutoFocus = false,
}) {
  const value = getIn(draft, path);
  const inputId = `admin-field-${path.map((segment) => String(segment)).join("-")}`;

  if (field.type === "object") {
    return (
      <section className="admin-section-object">
        <div className="admin-section-object-header">
          <h3>{field.label}</h3>
          <span>Contenido editorial</span>
        </div>
        <div className="admin-section-object-body">
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
              onEditField={onEditField}
              displayMode={displayMode}
              shouldAutoFocus={shouldAutoFocus}
            />
          ))}
        </div>
      </section>
    );
  }

  if (field.type === "list") {
    const items = Array.isArray(value) ? value : [];
    const itemLabel = field.itemLabel || "Elemento";
    const hasImage = field.item.some((itemField) => itemField.type === "image");
    return (
      <div className="admin-section-group">
        <div className="admin-section-group-header">
          <h3 className="admin-section-group-title">
            {field.label} ({items.length})
          </h3>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => onAddItem(path, field)}
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
            <table
              className={`admin-section-table ${hasImage ? "has-image" : "no-image"}`}
            >
              <thead>
                <tr>
                  <th scope="col">Orden</th>
                  {hasImage && <th scope="col">Imagen</th>}
                  <th scope="col">Título</th>
                  <th scope="col">Detalle</th>
                  <th scope="col">Acciones</th>
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
                  const detail = summarizeListDetail(
                    field.item,
                    item,
                    summary.titleKey,
                  );
                  return (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      {hasImage && (
                        <td>
                          <span className="admin-section-table-thumb">
                            {summary.image ? (
                              <img
                                src={summary.image}
                                alt={`Imagen de ${summary.title}`}
                              />
                            ) : (
                              <FaImage aria-hidden="true" />
                            )}
                          </span>
                        </td>
                      )}
                      <td>
                        <strong className="admin-section-table-title">
                          {summary.title}
                        </strong>
                        <span className="admin-section-table-type">
                          {itemLabel}
                        </span>
                      </td>
                      <td>
                        <span className="admin-section-table-detail">
                          {detail}
                        </span>
                      </td>
                      <td>
                        <span className="admin-section-table-actions">
                          <button
                            type="button"
                            className="action-btn move-btn icon-btn"
                            onClick={() => onMoveItem(path, index, -1)}
                            disabled={index === 0}
                            title="Subir"
                            aria-label={`Subir ${summary.title}`}
                          >
                            <FaArrowUp aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className="action-btn move-btn icon-btn"
                            onClick={() => onMoveItem(path, index, 1)}
                            disabled={index === items.length - 1}
                            title="Bajar"
                            aria-label={`Bajar ${summary.title}`}
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
                            onClick={() => {
                              if (confirm(`¿Eliminar ${summary.title}?`)) {
                                onRemoveItem(path, index);
                              }
                            }}
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

  if (displayMode === "summary") {
    const preview = String(value || "").trim();
    return (
      <div className="admin-section-copy-row">
        <div className="admin-section-copy-label-wrap">
          <span className="admin-section-copy-label">{field.label}</span>
          <span
            className={`admin-section-copy-status ${preview ? "is-ready" : "is-empty"}`}
          >
            {preview ? "Contenido configurado" : "Pendiente"}
          </span>
        </div>
        <p
          className={`admin-section-copy-preview ${preview ? "" : "is-empty"}`}
        >
          {preview || "Sin contenido. Pulsa Editar para completar este bloque."}
        </p>
        <button
          type="button"
          className="action-btn edit-btn icon-btn admin-section-copy-edit"
          onClick={() => onEditField(field, path)}
          title={`Editar ${field.label}`}
          aria-label={`Editar ${field.label}`}
        >
          <FaEdit aria-hidden="true" />
        </button>
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
        <label htmlFor={inputId}>{field.label}</label>
        <select
          id={inputId}
          value={value || ""}
          onChange={(e) => onChange(path, e.target.value)}
          autoFocus={shouldAutoFocus}
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
        <label htmlFor={inputId}>{field.label}</label>
        <textarea
          id={inputId}
          value={value || ""}
          onChange={(e) => onChange(path, e.target.value)}
          rows={4}
          autoFocus={shouldAutoFocus}
        />
      </div>
    );
  }

  return (
    <div className="modal-field">
      <label htmlFor={inputId}>{field.label}</label>
      <input
        id={inputId}
        type="text"
        value={value || ""}
        onChange={(e) => onChange(path, e.target.value)}
        autoFocus={shouldAutoFocus}
      />
    </div>
  );
}
