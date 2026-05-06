import { getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage";
import { storage } from "../services/firebase";

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

export async function uploadContentImage(file, folder, contentId) {
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const imageRef = storageRef(
    storage,
    `cms/${folder}/${contentId}/${Date.now()}.${extension}`,
  );

  await uploadBytes(imageRef, file, {
    contentType: file.type || "image/jpeg",
    customMetadata: {
      folder,
      contentId,
    },
  });

  return getDownloadURL(imageRef);
}
