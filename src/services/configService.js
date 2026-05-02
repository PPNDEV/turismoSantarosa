import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "./firebase";

const CONFIG_DOC_PATH = "settings/site_config";

/**
 * Suscribe a los cambios de configuración del sitio.
 * @param {Function} callback Función que recibe el objeto de configuración.
 * @returns {Function} Función de desuscripción (unsubscribe).
 */
export const subscribeToSiteConfig = (callback) => {
  const docRef = doc(db, CONFIG_DOC_PATH);
  
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      // Si el campo no existe explícitamente, asumimos true por defecto
      callback({
        mascotasEnabled: data.mascotasEnabled !== undefined ? data.mascotasEnabled : true,
        ...data
      });
    } else {
      // Valor por defecto completo si el documento no existe en absoluto
      callback({ mascotasEnabled: true });
    }
  }, (error) => {
    console.error("Error al suscribirse a la configuración del sitio:", error);
    // Fallback seguro en caso de error de permisos o red
    callback({ mascotasEnabled: true });
  });
};

/**
 * Actualiza el estado de las mascotas flotantes.
 * @param {boolean} enabled Nuevo estado (true/false).
 */
export const updateMascotasEnabled = async (enabled) => {
  const docRef = doc(db, CONFIG_DOC_PATH);
  try {
    // Usamos merge: true para no sobrescribir otras configuraciones futuras en este documento
    await setDoc(docRef, { mascotasEnabled: enabled }, { merge: true });
    return true;
  } catch (error) {
    console.error("Error actualizando la configuración de mascotas:", error);
    throw error;
  }
};
