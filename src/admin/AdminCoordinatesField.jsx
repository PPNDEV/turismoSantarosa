/**
 * Campo reutilizable de ubicacion para los formularios del panel admin.
 * En vez de escribir latitud/longitud a mano, abre un mapa donde el usuario
 * marca el punto con un clic. Las coordenadas son opcionales: si se marcan, el
 * lugar aparece como marcador en el mapa georreferenciado del inicio (RF-TUR-02).
 *
 * Mantiene el mismo contrato que antes: guarda numeros (o null si esta vacio)
 * en `form.lat` / `form.lng` via onChange(lat, lng). Por eso todos los editores
 * que ya lo usan obtienen el selector de mapa sin cambios.
 */
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  CircleMarker,
  MapContainer,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { FaMapMarkerAlt, FaTimes } from "react-icons/fa";
import "leaflet/dist/leaflet.css";

const MAP_CENTER = [-3.255, -80.118];
const MAP_BOUNDS = [
  [-3.46, -80.56],
  [-3.08, -79.98],
];
const MAP_MIN_ZOOM = 10;
const MAP_MAX_ZOOM = 18;
const MUTED = "var(--admin-muted, #64748b)";

function toNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function hasCoords(lat, lng) {
  return toNumber(lat) !== null && toNumber(lng) !== null;
}

// Captura los clics en el mapa y dibuja el marcador en el punto elegido.
function LocationPicker({ position, onPick }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });

  if (!position) {
    return null;
  }

  return (
    <CircleMarker
      center={position}
      radius={9}
      pathOptions={{
        color: "#ffffff",
        fillColor: "#dc2626",
        fillOpacity: 0.95,
        opacity: 1,
        weight: 3,
      }}
    />
  );
}

// Leaflet calcula mal el tamano cuando se monta dentro de un modal recien
// abierto; forzamos un recalculo tras el primer render.
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 60);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

function MapPickerModal({ initialPosition, onCancel, onSave }) {
  const [draft, setDraft] = useState(initialPosition);

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onCancel]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Marcar ubicacion en el mapa"
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100000,
        background: "rgba(8, 24, 40, 0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          background: "#ffffff",
          borderRadius: "14px",
          width: "min(720px, 96vw)",
          maxHeight: "92vh",
          overflow: "hidden",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.35)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.9rem 1.1rem",
            borderBottom: "1px solid #e2e8f0",
          }}
        >
          <strong style={{ fontSize: "1rem" }}>
            Haz clic en el mapa para marcar la ubicacion
          </strong>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cerrar mapa"
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: "1.1rem",
              color: MUTED,
              lineHeight: 1,
            }}
          >
            <FaTimes aria-hidden="true" />
          </button>
        </div>

        <div style={{ height: "min(58vh, 460px)", width: "100%" }}>
          <MapContainer
            center={draft || MAP_CENTER}
            zoom={draft ? 15 : 13}
            minZoom={MAP_MIN_ZOOM}
            maxZoom={MAP_MAX_ZOOM}
            maxBounds={MAP_BOUNDS}
            maxBoundsViscosity={0.6}
            scrollWheelZoom
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapResizer />
            <LocationPicker
              position={draft}
              onPick={(lat, lng) => setDraft([lat, lng])}
            />
          </MapContainer>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.75rem",
            flexWrap: "wrap",
            padding: "0.85rem 1.1rem",
            borderTop: "1px solid #e2e8f0",
          }}
        >
          <span style={{ fontSize: "0.85rem", color: MUTED }}>
            {draft
              ? `Ubicacion: ${draft[0].toFixed(5)}, ${draft[1].toFixed(5)}`
              : "Aun no has marcado ningun punto."}
          </span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button type="button" className="btn btn-outline" onClick={onCancel}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!draft}
              onClick={() => onSave(draft[0], draft[1])}
            >
              Guardar ubicacion
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default function AdminCoordinatesField({ lat, lng, onChange }) {
  const [open, setOpen] = useState(false);
  const isSet = hasCoords(lat, lng);
  const initialPosition = isSet ? [toNumber(lat), toNumber(lng)] : null;

  const handleSave = (nextLat, nextLng) => {
    onChange(toNumber(nextLat), toNumber(nextLng));
    setOpen(false);
  };

  const handleClear = () => onChange(null, null);

  return (
    <div className="modal-field">
      <label>Ubicacion en el mapa (opcional)</label>
      <p style={{ margin: "0 0 0.5rem", fontSize: "0.8rem", color: MUTED }}>
        Abre el mapa y marca el punto del lugar con un clic. Si lo marcas,
        aparecera como marcador en el mapa del inicio.
      </p>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => setOpen(true)}
        >
          <FaMapMarkerAlt className="inline-icon" aria-hidden="true" />
          {isSet ? "Cambiar ubicacion" : "Abrir mapa"}
        </button>

        {isSet ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.82rem",
              color: MUTED,
            }}
          >
            {`Marcado: ${toNumber(lat).toFixed(5)}, ${toNumber(lng).toFixed(5)}`}
            <button
              type="button"
              onClick={handleClear}
              style={{
                border: "none",
                background: "transparent",
                color: "#dc2626",
                cursor: "pointer",
                textDecoration: "underline",
                fontSize: "0.82rem",
                padding: 0,
              }}
            >
              Quitar
            </button>
          </span>
        ) : (
          <span style={{ fontSize: "0.82rem", color: MUTED }}>
            Sin ubicacion
          </span>
        )}
      </div>

      {open && (
        <MapPickerModal
          initialPosition={initialPosition}
          onCancel={() => setOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
