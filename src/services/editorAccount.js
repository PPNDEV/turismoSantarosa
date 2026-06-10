import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";

/**
 * RF-EDI-01: envía una solicitud pública de cuenta de editor con RUC.
 * No requiere sesión iniciada; el backend crea la cuenta como `visualizador`
 * y deja la solicitud pendiente de validación del RUC por el administrador.
 */
export async function solicitarCuentaEditor(payload) {
  const fn = httpsCallable(functions, "solicitarCuentaEditor");
  const result = await fn(payload);
  return result?.data;
}
