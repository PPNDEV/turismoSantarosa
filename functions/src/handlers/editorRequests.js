const { onCall, HttpsError } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const { logAdminAction } = require("../lib/audit");
const {
  ROLE_ADMIN,
  ROLE_EDITOR,
  ROLE_VIEWER,
  verifyRole,
} = require("../lib/adminAuth");

const db = admin.firestore();
const SOLICITUDES_COLLECTION = "solicitudes_editores";
const USERS_PUBLIC_COLLECTION = "usersPublic";
const USERS_PRIVATE_COLLECTION = "usersPrivate";
const ALLOWED_CATEGORIES = new Set([
  "gastronomia",
  "hospedajes",
  "eventos",
  "actividades",
  "transporte",
  "floraFauna",
  "otro",
]);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value, maxLength) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function isValidEmail(value) {
  return EMAIL_REGEX.test(String(value || "").trim());
}

function isValidCedula(value) {
  const cedula = String(value || "").replace(/\D/g, "");
  if (!/^\d{10}$/.test(cedula)) return false;

  const province = Number(cedula.slice(0, 2));
  const thirdDigit = Number(cedula[2]);
  if (province < 1 || province > 24 || thirdDigit > 5) return false;

  const coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  const total = coefficients.reduce((sum, coefficient, index) => {
    const product = Number(cedula[index]) * coefficient;
    return sum + (product >= 10 ? product - 9 : product);
  }, 0);
  const verifier = total % 10 === 0 ? 0 : 10 - (total % 10);

  return verifier === Number(cedula[9]);
}

/**
 * Valida un RUC ecuatoriano (13 dígitos): persona natural (3er dígito 0-5),
 * sector público (6) o sociedad privada (9).
 */
function isValidRuc(value) {
  const ruc = String(value || "").replace(/\D/g, "");
  if (!/^\d{13}$/.test(ruc)) return false;

  const province = Number(ruc.slice(0, 2));
  if (province < 1 || province > 24) return false;

  const establishment = ruc.slice(10);
  if (establishment === "000") return false;

  const thirdDigit = Number(ruc[2]);
  if (thirdDigit < 6) {
    // Persona natural: los primeros 10 dígitos forman una cédula válida.
    return isValidCedula(ruc.slice(0, 10));
  }

  // Sector público (6) o sociedad privada/extranjera (9): validación de formato.
  return thirdDigit === 6 || thirdDigit === 9;
}

const region = "us-central1";

/**
 * RF-EDI-01: registro público de un comerciante como editor. Crea una cuenta
 * con rol `visualizador` (puede iniciar sesión pero no publicar) y deja una
 * solicitud `pendiente_ruc` para que el administrador valide el RUC y la active.
 */
exports.solicitarCuentaEditor = onCall({ region }, async (request) => {
  const data = request.data || {};
  const nombre = clean(data.nombre, 120);
  const email = String(data.email || "")
    .trim()
    .toLowerCase();
  const password = String(data.password || "");
  const ruc = String(data.ruc || "").replace(/\D/g, "");
  const negocio = clean(data.negocio, 160);
  const isla = clean(data.isla, 80);
  const categoria = clean(data.categoria, 40);
  const telefono = clean(data.telefono, 40);

  if (!nombre || !negocio) {
    throw new HttpsError(
      "invalid-argument",
      "Ingresa tu nombre y el nombre de tu negocio.",
    );
  }
  if (!isValidEmail(email)) {
    throw new HttpsError("invalid-argument", "Correo electrónico no válido.");
  }
  if (password.length < 6) {
    throw new HttpsError(
      "invalid-argument",
      "La contraseña debe tener al menos 6 caracteres.",
    );
  }
  if (!isValidRuc(ruc)) {
    throw new HttpsError(
      "invalid-argument",
      "El RUC ingresado no es válido (debe tener 13 dígitos).",
    );
  }
  if (categoria && !ALLOWED_CATEGORIES.has(categoria)) {
    throw new HttpsError("invalid-argument", "Categoría de negocio no válida.");
  }

  const existing = await admin
    .auth()
    .getUserByEmail(email)
    .catch(() => null);
  if (existing) {
    throw new HttpsError(
      "already-exists",
      "Ya existe una cuenta con ese correo electrónico.",
    );
  }

  let userRecord;
  try {
    userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: nombre,
    });
  } catch (error) {
    logger.error("Error creando cuenta de editor", error);
    throw new HttpsError("internal", "No se pudo crear la cuenta.");
  }

  const uid = userRecord.uid;

  try {
    await admin.auth().setCustomUserClaims(uid, { role: ROLE_VIEWER });

    const batch = db.batch();
    batch.set(db.collection(USERS_PUBLIC_COLLECTION).doc(uid), {
      uid,
      displayName: nombre,
      role: ROLE_VIEWER,
      active: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    batch.set(db.collection(USERS_PRIVATE_COLLECTION).doc(uid), {
      uid,
      email,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    batch.set(db.collection(SOLICITUDES_COLLECTION).doc(uid), {
      uid,
      nombre,
      email,
      ruc,
      negocio,
      isla,
      categoria: categoria || "otro",
      telefono,
      estado: "pendiente_ruc",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    await batch.commit();
  } catch (error) {
    logger.error("Error guardando solicitud de editor", error);
    await admin
      .auth()
      .deleteUser(uid)
      .catch((deleteError) =>
        logger.warn(`No se pudo revertir la cuenta ${uid}`, deleteError),
      );
    throw new HttpsError("internal", "No se pudo registrar la solicitud.");
  }

  return { success: true };
});

/**
 * RF-ADM-02: el administrador valida el RUC y promueve al solicitante a editor.
 */
exports.aprobarSolicitudEditor = onCall({ region }, async (request) => {
  await verifyRole(db, request.auth?.uid, [ROLE_ADMIN]);
  const targetUid = String(request.data?.uid || "").trim();
  if (!targetUid) {
    throw new HttpsError("invalid-argument", "Falta el ID de la solicitud.");
  }

  const solicitudRef = db.collection(SOLICITUDES_COLLECTION).doc(targetUid);
  const solicitudSnap = await solicitudRef.get();
  if (!solicitudSnap.exists) {
    throw new HttpsError("not-found", "La solicitud no existe.");
  }

  await admin.auth().setCustomUserClaims(targetUid, { role: ROLE_EDITOR });
  await admin.auth().updateUser(targetUid, { disabled: false });

  const targetUser = await admin
    .auth()
    .getUser(targetUid)
    .catch(() => null);

  await db.collection(USERS_PUBLIC_COLLECTION).doc(targetUid).set(
    {
      displayName:
        targetUser?.displayName || targetUser?.email || "Editor",
      role: ROLE_EDITOR,
      active: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  await solicitudRef.update({
    estado: "aprobada",
    reviewedBy: request.auth.uid,
    reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await logAdminAction(
    { db, FieldValue: admin.firestore.FieldValue, logger },
    request.auth.uid,
    "editor.request.approve",
    { uid: targetUid },
  );

  return { success: true };
});

/**
 * RF-EDI-02: una solicitud rechazada deja la cuenta deshabilitada para que el
 * solicitante no pueda autenticarse.
 */
exports.rechazarSolicitudEditor = onCall({ region }, async (request) => {
  await verifyRole(db, request.auth?.uid, [ROLE_ADMIN]);
  const targetUid = String(request.data?.uid || "").trim();
  const motivo = clean(request.data?.motivo, 280);
  if (!targetUid) {
    throw new HttpsError("invalid-argument", "Falta el ID de la solicitud.");
  }

  const solicitudRef = db.collection(SOLICITUDES_COLLECTION).doc(targetUid);
  const solicitudSnap = await solicitudRef.get();
  if (!solicitudSnap.exists) {
    throw new HttpsError("not-found", "La solicitud no existe.");
  }

  await admin
    .auth()
    .updateUser(targetUid, { disabled: true })
    .catch((error) =>
      logger.warn(`No se pudo deshabilitar la cuenta ${targetUid}`, error),
    );

  await db.collection(USERS_PUBLIC_COLLECTION).doc(targetUid).set(
    {
      active: false,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  await solicitudRef.update({
    estado: "rechazada",
    motivo,
    reviewedBy: request.auth.uid,
    reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await logAdminAction(
    { db, FieldValue: admin.firestore.FieldValue, logger },
    request.auth.uid,
    "editor.request.reject",
    { uid: targetUid },
  );

  return { success: true };
});
