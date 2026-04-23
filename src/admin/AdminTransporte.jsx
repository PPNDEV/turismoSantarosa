import { useEffect, useState } from "react";
import { FaBus, FaEdit, FaPhoneAlt, FaSave, FaTrash } from "react-icons/fa";
import { useContent } from "../context/useContent";

const emptyCooperativa = {
  nombre: "",
  cooperativa: "",
  ruta: "",
  ruta_hacia_muelle: "",
  frecuencia: "",
  contacto: "",
  puntoSalida: "",
  puntoLlegada: "",
  lat: "",
  lng: "",
};

function normalizeCoord(value) {
  if (value === "" || value === null || value === undefined) return "";
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : "";
}

function hasDraftChanges(a, b) {
  return JSON.stringify(a) !== JSON.stringify(b);
}

export default function AdminTransporte({
  canEdit = true,
  onLivePreviewChange = () => {},
  onDirtyChange = () => {},
}) {
  const { cooperativas, upsertCooperativa, deleteCooperativa } = useContent();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyCooperativa);
  const [initialForm, setInitialForm] = useState(emptyCooperativa);
  const [error, setError] = useState("");

  const openNew = () => {
    if (!canEdit) return;
    setError("");
    const f = { ...emptyCooperativa };
    setForm(f);
    setInitialForm(f);
    setEditing(null);
    setModal(true);
  };

  const openEdit = (item) => {
    if (!canEdit) return;
    setError("");
    const f = { ...item, lat: item.lat ?? "", lng: item.lng ?? "" };
    setForm(f);
    setInitialForm(f);
    setEditing(item.id);
    setModal(true);
  };

  const closeModal = () => setModal(false);

  const save = () => {
    if (!canEdit) return;
    const nombre = String(form.nombre || form.cooperativa || "").trim();
    const ruta = String(form.ruta || form.ruta_hacia_muelle || "").trim();
    const contacto = String(form.contacto || "").trim();
    if (!nombre || !ruta || !contacto) {
      setError("Cooperativa, ruta y contacto son obligatorios.");
      return;
    }
    upsertCooperativa({
      ...form,
      nombre,
      cooperativa: nombre,
      ruta,
      ruta_hacia_muelle: ruta,
      id: editing || Date.now().toString(),
      lat: normalizeCoord(form.lat),
      lng: normalizeCoord(form.lng),
    });
    setError("");
    closeModal();
  };

  const del = (id) => {
    if (!canEdit) return;
    if (confirm("¿Eliminar cooperativa?")) deleteCooperativa(id);
  };

  const preview = {
    nombre: form.nombre || form.cooperativa || "Nombre de la cooperativa",
    ruta: form.ruta || form.ruta_hacia_muelle || "Ruta hacia muelle",
    frecuencia: form.frecuencia || "Frecuencia por confirmar",
    contacto: form.contacto || "Contacto",
    puntoSalida: form.puntoSalida || "Punto de salida",
    puntoLlegada: form.puntoLlegada || "Punto de llegada",
  };

  useEffect(() => {
    if (!modal) { onLivePreviewChange(null); return; }
    onLivePreviewChange({
      section: "transporte",
      path: "/informacion#transporte",
      image: null,
      badge: "Transporte",
      title: preview.nombre,
      subtitle: preview.ruta,
      body: `Frecuencia: ${preview.frecuencia}`,
      status: "Listo para publicar",
    });
  }, [modal, preview.nombre, preview.ruta, preview.frecuencia, onLivePreviewChange]);

  useEffect(() => {
    if (!modal) { onDirtyChange(false); return; }
    onDirtyChange(hasDraftChanges(form, initialForm));
  }, [modal, form, initialForm, onDirtyChange]);

  useEffect(() => () => { onDirtyChange(false); onLivePreviewChange(null); }, [onDirtyChange, onLivePreviewChange]);

  return (
    <div>
      <div className="admin-table-card">
        <div className="admin-table-header">
          <h2>Cooperativas de Transporte ({cooperativas.length})</h2>
          <button className="btn btn-primary" onClick={openNew} disabled={!canEdit}>
            + Nueva Cooperativa
          </button>
        </div>

        {!canEdit && (
          <div className="admin-readonly-note">
            Modo visualizador: datos de transporte en solo lectura.
          </div>
        )}

        <table>
          <thead>
            <tr>
              <th>Cooperativa</th>
              <th>Ruta</th>
              <th>Frecuencia</th>
              <th>Contacto</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cooperativas.map((c) => (
              <tr key={c.id}>
                <td><strong><FaBus className="inline-icon" aria-hidden="true" /> {c.nombre || c.cooperativa}</strong></td>
                <td>{c.ruta || c.ruta_hacia_muelle || "-"}</td>
                <td>{c.frecuencia || "-"}</td>
                <td>{c.contacto || "-"}</td>
                <td>
                  <button className="action-btn edit-btn" onClick={() => openEdit(c)} disabled={!canEdit}>
                    <FaEdit className="inline-icon" aria-hidden="true" /> Editar
                  </button>
                  <button className="action-btn del-btn" onClick={() => del(c.id)} disabled={!canEdit}>
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
          <div className="modal-box modal-box-preview" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? "Editar Cooperativa" : "Nueva Cooperativa"}</h2>
            {error && <div className="login-error">{error}</div>}
            <div className="admin-form-preview-grid">
              <div className="admin-form-column">
                {[
                  ["nombre", "Nombre de Cooperativa"],
                  ["ruta", "Ruta"],
                  ["frecuencia", "Frecuencia"],
                  ["contacto", "Contacto"],
                  ["puntoSalida", "Punto de Salida"],
                  ["puntoLlegada", "Punto de Llegada"],
                  ["lat", "Latitud"],
                  ["lng", "Longitud"],
                ].map(([f, lbl]) => (
                  <div key={f} className="modal-field">
                    <label>{lbl}</label>
                    <input type="text" value={form[f] || ""} onChange={(e) => setForm({ ...form, [f]: e.target.value })} />
                  </div>
                ))}

                <div className="modal-actions">
                  <button className="btn btn-outline" onClick={closeModal}>Cancelar</button>
                  <button className="btn btn-primary" onClick={save}>
                    <FaSave className="inline-icon" aria-hidden="true" /> Guardar
                  </button>
                </div>
              </div>

              <div className="admin-preview-column">
                <h3 className="admin-preview-title">Vista previa</h3>
                <div className="admin-preview-card-frame">
                  <article className="cooperativa-card" style={{ padding: "1.5rem" }}>
                    <h3><FaBus className="inline-icon" aria-hidden="true" /> {preview.nombre}</h3>
                    <p>{preview.ruta}</p>
                    <div className="info-meta"><strong>Frecuencia:</strong> {preview.frecuencia}</div>
                    <div className="info-meta"><strong>Salida:</strong> {preview.puntoSalida}</div>
                    <div className="info-meta"><strong>Llegada:</strong> {preview.puntoLlegada}</div>
                    <div className="info-meta"><FaPhoneAlt className="inline-icon" aria-hidden="true" /> {preview.contacto}</div>
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
