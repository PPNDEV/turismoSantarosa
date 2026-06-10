/**
 * Campo reutilizable de coordenadas (latitud/longitud) para los formularios
 * del panel admin. Las coordenadas son opcionales: si se cargan, el lugar
 * aparece como marcador en el mapa georreferenciado del inicio (RF-TUR-02).
 *
 * Guarda números (o null si está vacío) en `form.lat` / `form.lng`.
 */
function parseCoordinate(rawValue) {
  if (rawValue === "" || rawValue === null || rawValue === undefined) {
    return null;
  }
  const numeric = Number(rawValue);
  return Number.isFinite(numeric) ? numeric : null;
}

export default function AdminCoordinatesField({ lat, lng, onChange }) {
  const handleLat = (event) =>
    onChange(parseCoordinate(event.target.value), lng ?? null);
  const handleLng = (event) =>
    onChange(lat ?? null, parseCoordinate(event.target.value));

  return (
    <div className="modal-field">
      <label>Coordenadas en el mapa (opcional)</label>
      <p
        style={{
          margin: "0 0 0.4rem",
          fontSize: "0.8rem",
          color: "var(--admin-muted, #64748b)",
        }}
      >
        Latitud y longitud del lugar. Si las completas, aparecera como marcador
        en el mapa del inicio.
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.5rem",
        }}
      >
        <input
          type="number"
          step="any"
          inputMode="decimal"
          placeholder="Latitud (-3.2554)"
          value={lat ?? ""}
          onChange={handleLat}
          aria-label="Latitud"
        />
        <input
          type="number"
          step="any"
          inputMode="decimal"
          placeholder="Longitud (-80.1180)"
          value={lng ?? ""}
          onChange={handleLng}
          aria-label="Longitud"
        />
      </div>
    </div>
  );
}
