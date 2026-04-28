const { onCall, HttpsError } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

const db = admin.firestore();

const ROLE_ADMIN = "administrador";
const ROLE_EDITOR = "editor";
const ROLE_VIEWER = "visualizador";
const CONTENT_NODES = new Set([
  "actividades",
  "gastronomia",
  "hospedajes",
  "eventos",
  "floraFauna",
  "galeria",
  "destinos",
  "blog",
  "heroSlides",
  "cooperativas",
]);

function getRtdb() {
  return admin.database();
}

function normalizeRole(role) {
  if (role === ROLE_ADMIN || role === ROLE_EDITOR || role === ROLE_VIEWER) {
    return role;
  }

  return ROLE_VIEWER;
}

async function verifyRole(uid, allowedRoles) {
  if (!uid) {
    throw new HttpsError(
      "unauthenticated",
      "El usuario debe estar autenticado."
    );
  }
  const userDoc = await db.collection("usersPublic").doc(uid).get();
  if (!userDoc.exists) {
    throw new HttpsError("permission-denied", "Usuario no encontrado.");
  }
  const role = userDoc.data().role;
  const active = userDoc.data().active;

  if (active === false) {
    throw new HttpsError("permission-denied", "Usuario inactivo.");
  }

  if (!allowedRoles.includes(role)) {
    throw new HttpsError(
      "permission-denied",
      "No tienes los permisos necesarios."
    );
  }
  return role;
}

exports.adminUpsertContent = onCall({ region: "us-central1" }, async (request) => {
  await verifyRole(request.auth?.uid, [ROLE_ADMIN, ROLE_EDITOR]);
  const { nodeKey, itemData, id } = request.data;
  if (!nodeKey || !itemData) {
    throw new HttpsError("invalid-argument", "Faltan parámetros requeridos.");
  }

  if (!CONTENT_NODES.has(nodeKey)) {
    throw new HttpsError("invalid-argument", "Nodo de contenido no permitido.");
  }

  const payload = { ...itemData };
  // Usar timestamp del servidor de RTDB
  payload.updatedAt = admin.database.ServerValue.TIMESTAMP;

  const nodeRef = getRtdb().ref(`content/${nodeKey}`);
  let targetRef;
  let targetId = id;

  if (targetId) {
    targetRef = nodeRef.child(targetId);
  } else {
    targetRef = nodeRef.push();
    targetId = targetRef.key;
  }

  await targetRef.set(payload);
  return { success: true, id: targetId };
});

exports.adminDeleteContent = onCall({ region: "us-central1" }, async (request) => {
  await verifyRole(request.auth?.uid, [ROLE_ADMIN, ROLE_EDITOR]);
  const { nodeKey, id } = request.data;
  if (!nodeKey || !id) {
    throw new HttpsError("invalid-argument", "Faltan parámetros requeridos.");
  }

  if (!CONTENT_NODES.has(nodeKey)) {
    throw new HttpsError("invalid-argument", "Nodo de contenido no permitido.");
  }

  await getRtdb().ref(`content/${nodeKey}/${id}`).remove();
  return { success: true };
});

exports.adminCreateUser = onCall({ region: "us-central1" }, async (request) => {
  await verifyRole(request.auth?.uid, [ROLE_ADMIN]);
  const { email, password, displayName, role } = request.data;
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedDisplayName = String(displayName || "").trim();
  const normalizedRole = normalizeRole(role);

  if (!normalizedEmail || !password || !normalizedDisplayName || !role) {
    throw new HttpsError("invalid-argument", "Faltan datos de usuario.");
  }

  let userRecord;
  try {
    userRecord = await admin.auth().createUser({
      email: normalizedEmail,
      password,
      displayName: normalizedDisplayName,
    });
  } catch (e) {
    logger.error("Error creating auth user", e);
    throw new HttpsError("internal", e.message);
  }

  const uid = userRecord.uid;

  const batch = db.batch();
  const publicRef = db.collection("usersPublic").doc(uid);
  const privateRef = db.collection("usersPrivate").doc(uid);

  batch.set(publicRef, {
    uid,
    displayName: normalizedDisplayName,
    role: normalizedRole,
    active: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  batch.set(privateRef, {
    uid,
    email: normalizedEmail,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (e) {
    logger.error("Error creating Firestore user profile", e);
    await admin.auth().deleteUser(uid).catch((deleteError) => {
      logger.warn(`Could not roll back auth user ${uid}`, deleteError);
    });
    throw new HttpsError("internal", e.message);
  }

  return {
    success: true,
    user: {
      uid,
      email: normalizedEmail,
      displayName: normalizedDisplayName,
      role: normalizedRole,
      active: true,
    },
  };
});

exports.adminUpdateUserRole = onCall({ region: "us-central1" }, async (request) => {
  await verifyRole(request.auth?.uid, [ROLE_ADMIN]);
  const { uid, role } = request.data;

  if (!uid || !role) {
    throw new HttpsError("invalid-argument", "Faltan datos.");
  }

  await db.collection("usersPublic").doc(uid).update({
    role,
    active: true,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true };
});

exports.adminDeleteUser = onCall({ region: "us-central1" }, async (request) => {
  await verifyRole(request.auth?.uid, [ROLE_ADMIN]);
  const { uid } = request.data;

  if (!uid) {
    throw new HttpsError("invalid-argument", "Falta el ID del usuario.");
  }

  if (uid === request.auth.uid) {
    throw new HttpsError(
      "invalid-argument",
      "No puedes eliminar tu propio usuario."
    );
  }

  const batch = db.batch();
  const publicRef = db.collection("usersPublic").doc(uid);
  const privateRef = db.collection("usersPrivate").doc(uid);

  batch.update(publicRef, {
    active: false,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  try {
    batch.update(privateRef, {
      deletedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    await admin.auth().updateUser(uid, { disabled: true });
  } catch (e) {
    logger.warn(`Could not disable auth user ${uid}`, e);
  }

  await batch.commit();
  return { success: true };
});
