import { useEffect } from "react";
import { FaTimes } from "react-icons/fa";

export default function GalleryLightbox({ item, title, onClose }) {
  useEffect(() => {
    if (!item) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [item, onClose]);

  if (!item) {
    return null;
  }

  return (
    <div
      className="gallery-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={title || "Imagen de galeria"}
      onClick={onClose}
    >
      <button
        type="button"
        className="gallery-lightbox-close"
        onClick={onClose}
        aria-label="Cerrar imagen"
      >
        <FaTimes aria-hidden="true" />
      </button>
      <figure
        className="gallery-lightbox-frame"
        onClick={(event) => event.stopPropagation()}
      >
        <img
          src={item.url}
          alt={title || item.titulo || "Galeria"}
          loading="eager"
          decoding="async"
        />
        {(title || item.titulo) && <figcaption>{title || item.titulo}</figcaption>}
      </figure>
    </div>
  );
}
