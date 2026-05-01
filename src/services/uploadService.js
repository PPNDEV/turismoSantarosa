import imageCompression from "browser-image-compression";
import {
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
} from "firebase/storage";
import { storage } from "./firebase";

// Configuración para módulos estándar
const STANDARD_OPTIONS = {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 1200,
  useWebWorker: true,
};

// Configuración para portadas y hero slides
const HIGH_QUALITY_OPTIONS = {
  maxSizeMB: 1.5,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
};

export async function uploadContentImage(
  file,
  folder,
  contentId,
  isHighQuality = false,
) {
  if (!file) {
    throw new Error("No se ha proporcionado ningún archivo para subir.");
  }

  const options = isHighQuality ? HIGH_QUALITY_OPTIONS : STANDARD_OPTIONS;

  let compressedFile = file;
  try {
    compressedFile = await imageCompression(file, options);
  } catch (error) {
    console.error("Error al comprimir la imagen:", error);
    // Si falla la compresión, se usa el archivo original
  }

  const extension =
    compressedFile.name.split(".").pop()?.toLowerCase() || "jpg";
  const imageRef = storageRef(
    storage,
    `cms/${folder}/${contentId}/${Date.now()}.${extension}`,
  );

  await uploadBytes(imageRef, compressedFile, {
    contentType: compressedFile.type || "image/jpeg",
    customMetadata: {
      folder,
      contentId,
    },
  });

  return getDownloadURL(imageRef);
}

export function slugifyContentId(value) {
  return String(value || "contenido")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 42);
}

export function createContentId(prefix, title) {
  const suffix =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);

  return `${prefix}-${slugifyContentId(title)}-${suffix}`;
}
