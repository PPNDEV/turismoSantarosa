const { onCall, HttpsError } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const { getRtdb } = require("./lib/rtdb");
const { logAdminAction } = require("./lib/audit");
const { sanitizeItemData, NODE_FIELDS } = require("./lib/adminSchema");
const {
  ROLE_ADMIN,
  ROLE_EDITOR,
  ROLE_VIEWER,
  normalizeRole,
  verifyRole,
} = require("./lib/adminAuth");

const db = admin.firestore();
const CONTENT_NODES = new Set(Object.keys(NODE_FIELDS));

exports.adminUpsertContent = onCall(
  { region: "us-central1" },
  async (request) => {
    await verifyRole(db, request.auth?.uid, [ROLE_ADMIN, ROLE_EDITOR]);
    const { nodeKey, itemData, id } = request.data;
    if (!nodeKey || !itemData) {
      throw new HttpsError("invalid-argument", "Faltan parámetros requeridos.");
    }

    if (!CONTENT_NODES.has(nodeKey)) {
      throw new HttpsError(
        "invalid-argument",
        "Nodo de contenido no permitido.",
      );
    }

    const payload = sanitizeItemData(nodeKey, itemData);
    // Usar timestamp del servidor de RTDB
    payload.updatedAt = admin.database.ServerValue.TIMESTAMP;

    const nodeRef = getRtdb(admin).ref(`content/${nodeKey}`);
    let targetRef;
    let targetId = id;

    if (targetId) {
      targetRef = nodeRef.child(targetId);
    } else {
      targetRef = nodeRef.push();
      targetId = targetRef.key;
    }

    await targetRef.set(payload);
    await logAdminAction(
      { db, FieldValue: admin.firestore.FieldValue, logger },
      request.auth?.uid,
      "content.upsert",
      {
        nodeKey,
        id: targetId,
      },
    );
    return { success: true, id: targetId };
  },
);

exports.adminDeleteContent = onCall(
  { region: "us-central1" },
  async (request) => {
    await verifyRole(db, request.auth?.uid, [ROLE_ADMIN, ROLE_EDITOR]);
    const { nodeKey, id } = request.data;
    if (!nodeKey || !id) {
      throw new HttpsError("invalid-argument", "Faltan parámetros requeridos.");
    }

    if (!CONTENT_NODES.has(nodeKey)) {
      throw new HttpsError(
        "invalid-argument",
        "Nodo de contenido no permitido.",
      );
    }

    await getRtdb(admin).ref(`content/${nodeKey}/${id}`).remove();
    await logAdminAction(
      { db, FieldValue: admin.firestore.FieldValue, logger },
      request.auth?.uid,
      "content.delete",
      {
        nodeKey,
        id,
      },
    );
    return { success: true };
  },
);

exports.adminCreateUser = onCall({ region: "us-central1" }, async (request) => {
  await verifyRole(db, request.auth?.uid, [ROLE_ADMIN]);
  const { email, password, displayName, role } = request.data;
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();
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

  try {
    await admin.auth().setCustomUserClaims(uid, { role: normalizedRole });
  } catch (e) {
    logger.error("Error setting custom claims", e);
    await admin.auth().deleteUser(uid);
    throw new HttpsError("internal", e.message);
  }


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
    await logAdminAction(
      { db, FieldValue: admin.firestore.FieldValue, logger },
      request.auth?.uid,
      "user.create",
      {
        uid,
        role: normalizedRole,
      },
    );
  } catch (e) {
    logger.error("Error creating Firestore user profile", e);
    await admin
      .auth()
      .deleteUser(uid)
      .catch((deleteError) => {
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

exports.adminUpdateUserRole = onCall(
  { region: "us-central1" },
  async (request) => {
    await verifyRole(db, request.auth?.uid, [ROLE_ADMIN]);
    const { uid, role } = request.data;

    if (!uid || !role) {
      throw new HttpsError("invalid-argument", "Faltan datos.");
    }

    await db.collection("usersPublic").doc(uid).update({
      role,
      active: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await logAdminAction(
      { db, FieldValue: admin.firestore.FieldValue, logger },
      request.auth?.uid,
      "user.role.update",
      { uid, role },
    );

    return { success: true };
  },
);

exports.adminDeleteUser = onCall({ region: "us-central1" }, async (request) => {
  await verifyRole(db, request.auth?.uid, [ROLE_ADMIN]);
  const { uid } = request.data;

  if (!uid) {
    throw new HttpsError("invalid-argument", "Falta el ID del usuario.");
  }

  if (uid === request.auth.uid) {
    throw new HttpsError(
      "invalid-argument",
      "No puedes eliminar tu propio usuario.",
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
  await logAdminAction(
    { db, FieldValue: admin.firestore.FieldValue, logger },
    request.auth?.uid,
    "user.delete",
    { uid },
  );
  return { success: true };
});

exports.asignarRol = onCall({ region: "us-central1" }, async (request) => {
  if (!request.auth || request.auth.token.role !== ROLE_ADMIN) {
    throw new HttpsError(
      "permission-denied",
      "Solo los administradores pueden asignar roles."
    );
  }

  const { targetUid, newRole } = request.data;
  const normalizedRole = normalizeRole(newRole);

  if (!targetUid || !normalizedRole) {
    throw new HttpsError(
      "invalid-argument",
      "Faltan parámetros requeridos: targetUid y newRole."
    );
  }

  try {
    // 1. Inyectar custom claim
    await admin.auth().setCustomUserClaims(targetUid, { role: normalizedRole });

    // 2. Sincronizar con usersPublic para la UI
    await db.collection("usersPublic").doc(targetUid).update({
      role: normalizedRole,
      active: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await logAdminAction(
      { db, FieldValue: admin.firestore.FieldValue, logger },
      request.auth.uid,
      "user.role.assign",
      { targetUid, role: normalizedRole }
    );

    return { success: true };
  } catch (e) {
    logger.error("Error al asignar rol", e);
    throw new HttpsError("internal", e.message);
  }
});
