import { FaImage } from "react-icons/fa";

export default function AdminImageField({
  label = "Imagen",
  value = "",
  selectedFile = null,
  onFileChange,
  onUrlChange,
}) {
  return (
    <div className="modal-field">
      <label>{label}</label>
      <div className="admin-upload-row">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => onFileChange(e.target.files?.[0] || null)}
        />
        <span>
          <FaImage className="inline-icon" aria-hidden="true" />
          {selectedFile
            ? selectedFile.name
            : value
              ? "Imagen publicada"
              : "Selecciona una imagen"}
        </span>
      </div>
      <input
        type="url"
        value={value || ""}
        onChange={(e) => onUrlChange(e.target.value)}
        placeholder="URL alternativa de imagen"
      />
    </div>
  );
}
