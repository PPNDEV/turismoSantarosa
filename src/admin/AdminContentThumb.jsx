import { useState } from "react";
import { FaImage } from "react-icons/fa";

export default function AdminContentThumb({ src, alt = "Imagen del contenido" }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <span className="admin-slide-thumb admin-slide-thumb-empty" aria-label="Sin imagen">
        <FaImage aria-hidden="true" />
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="admin-slide-thumb"
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
