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

function getRequesterEmail(request) {
  return String(request.auth?.token?.email || "")
    .trim()
    .toLowerCase();
}

function assertEditorOwnsExistingContent(role, uid, snapshot, action) {
  if (role !== ROLE_EDITOR || !snapshot.exists()) {
    return;
  }

  const existing = snapshot.val() || {};
  if (existing.ownerUid !== uid) {
    throw new HttpsError(
      "permission-denied",
      `Los editores solo pueden ${action} contenido creado por su propio usuario.`,
    );
  }
}

function applyOwnershipMetadata(payload, snapshot, request) {
  const existing = snapshot.exists() ? snapshot.val() || {} : null;
  const uid = request.auth?.uid;
  const email = getRequesterEmail(request);

  payload.updatedAt = admin.database.ServerValue.TIMESTAMP;
  payload.updatedByUid = uid;
  payload.updatedByEmail = email;

  if (existing) {
    payload.createdAt = existing.createdAt || admin.database.ServerValue.TIMESTAMP;
    payload.ownerUid = existing.ownerUid || uid;
    payload.ownerEmail = existing.ownerEmail || email;
    return payload;
  }

  payload.createdAt = admin.database.ServerValue.TIMESTAMP;
  payload.ownerUid = uid;
  payload.ownerEmail = email;
  return payload;
}

/**
 * RF-EDI-03/04: las publicaciones de un editor no se publican directamente.
 * Se guardan en `contentPending` con estado "pendiente" hasta que el admin las
 * apruebe. Al editar una publicación aprobada, la original permanece pública.
 */
async function submitEditorPendingContent({ request, nodeKey, id, payload }) {
  const uid = request.auth?.uid;
  const email = getRequesterEmail(request);
  const contentNodeRef = getRtdb(admin).ref(`content/${nodeKey}`);

  let targetId = id;
  let isEdit = false;

  if (targetId) {
    const existingSnapshot = await contentNodeRef.child(targetId).get();
    if (existingSnapshot.exists()) {
      assertEditorOwnsExistingContent(
        ROLE_EDITOR,
        uid,
        existingSnapshot,
        "editar",
      );
      isEdit = true;
    }
  } else {
    targetId = contentNodeRef.push().key;
  }

  const pendingRef = getRtdb(admin).ref("contentPending").push();
  await pendingRef.set({
    nodeKey,
    targetId,
    isEdit,
    estado: "pendiente",
    data: payload,
    ownerUid: uid,
    ownerEmail: email,
    createdAt: admin.database.ServerValue.TIMESTAMP,
  });

  await logAdminAction(
    { db, FieldValue: admin.firestore.FieldValue, logger },
    uid,
    "content.submit",
    { nodeKey, targetId, pendingId: pendingRef.key },
  );

  return { success: true, pending: true, id: targetId };
}

exports.adminUpsertContent = onCall(
  { region: "us-central1" },
  async (request) => {
    const role = await verifyRole(db, request.auth?.uid, [
      ROLE_ADMIN,
      ROLE_EDITOR,
    ]);
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

    if (role === ROLE_EDITOR) {
      return submitEditorPendingContent({ request, nodeKey, id, payload });
    }

    const nodeRef = getRtdb(admin).ref(`content/${nodeKey}`);
    let targetRef;
    let targetId = id;

    if (targetId) {
      targetRef = nodeRef.child(targetId);
    } else {
      targetRef = nodeRef.push();
      targetId = targetRef.key;
    }

    const existingSnapshot = await targetRef.get();
    assertEditorOwnsExistingContent(
      role,
      request.auth?.uid,
      existingSnapshot,
      "editar",
    );
    applyOwnershipMetadata(payload, existingSnapshot, request);

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

// ---------------------------------------------------------------------------
// Edición de SECCIONES editoriales completas (contenido anidado).
// Algunos nodos no son listas planas de tarjetas sino objetos por secciones
// (p. ej. gastronomia = { jambeli: [...], sanGregorio: [...] }). Esta función
// guarda el nodo completo de una sola vez. Solo administradores.
// ---------------------------------------------------------------------------
const SECTION_NODES = new Set([
  "actividades",
  "gastronomia",
  "hospedajes",
  "floraFauna",
  "eventos",
  "cooperativas",
]);

const MAX_SECTION_DEPTH = 8;
const MAX_ARRAY_ITEMS = 500;
const MAX_OBJECT_KEYS = 200;
const MAX_STRING_LENGTH = 6000;

function sanitizeRichString(value) {
  return String(value == null ? "" : value)
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/\r\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, MAX_STRING_LENGTH);
}

function sanitizeSectionValue(value, depth = 0) {
  if (depth > MAX_SECTION_DEPTH) {
    return null;
  }

  if (typeof value === "string") {
    return sanitizeRichString(value);
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "boolean") {
    return value;
  }
  if (Array.isArray(value)) {
    return value
      .slice(0, MAX_ARRAY_ITEMS)
      .map((entry) => sanitizeSectionValue(entry, depth + 1))
      .filter((entry) => entry !== null && entry !== undefined);
  }
  if (value && typeof value === "object") {
    const out = {};
    let count = 0;
    for (const [key, val] of Object.entries(value)) {
      if (count >= MAX_OBJECT_KEYS) break;
      if (!/^[a-zA-Z0-9_-]{1,60}$/.test(key)) continue;
      const sanitized = sanitizeSectionValue(val, depth + 1);
      if (sanitized !== null && sanitized !== undefined) {
        out[key] = sanitized;
        count += 1;
      }
    }
    return out;
  }
  return null;
}

exports.adminUpsertSection = onCall(
  { region: "us-central1" },
  async (request) => {
    await verifyRole(db, request.auth?.uid, [ROLE_ADMIN]);

    const { nodeKey, data } = request.data;
    if (!nodeKey || typeof data !== "object" || data === null) {
      throw new HttpsError("invalid-argument", "Faltan parámetros requeridos.");
    }
    if (!SECTION_NODES.has(nodeKey)) {
      throw new HttpsError(
        "invalid-argument",
        "Nodo de contenido no permitido.",
      );
    }

    const sanitized = sanitizeSectionValue(data);
    if (!sanitized || typeof sanitized !== "object") {
      throw new HttpsError("invalid-argument", "Contenido inválido.");
    }

    await getRtdb(admin).ref(`content/${nodeKey}`).set(sanitized);
    await logAdminAction(
      { db, FieldValue: admin.firestore.FieldValue, logger },
      request.auth?.uid,
      "content.section.upsert",
      { nodeKey },
    );

    return { success: true };
  },
);

exports.adminDeleteContent = onCall(
  { region: "us-central1" },
  async (request) => {
    const role = await verifyRole(db, request.auth?.uid, [
      ROLE_ADMIN,
      ROLE_EDITOR,
    ]);
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

    const targetRef = getRtdb(admin).ref(`content/${nodeKey}/${id}`);
    const existingSnapshot = await targetRef.get();
    assertEditorOwnsExistingContent(
      role,
      request.auth?.uid,
      existingSnapshot,
      "eliminar",
    );

    await targetRef.remove();
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

/**
 * RF-ADM-01: el administrador aprueba una publicación pendiente de un editor.
 * Mueve el contenido de `contentPending` al nodo público `content`.
 */
exports.aprobarPublicacion = onCall(
  { region: "us-central1" },
  async (request) => {
    await verifyRole(db, request.auth?.uid, [ROLE_ADMIN]);
    const pendingId = String(request.data?.pendingId || "").trim();
    if (!pendingId) {
      throw new HttpsError("invalid-argument", "Falta el ID de la publicación.");
    }

    const pendingRef = getRtdb(admin).ref(`contentPending/${pendingId}`);
    const pendingSnapshot = await pendingRef.get();
    if (!pendingSnapshot.exists()) {
      throw new HttpsError("not-found", "La publicación pendiente no existe.");
    }

    const pending = pendingSnapshot.val() || {};
    const { nodeKey, targetId, data, ownerUid, ownerEmail } = pending;
    if (!CONTENT_NODES.has(nodeKey) || !targetId || !data) {
      throw new HttpsError(
        "failed-precondition",
        "La publicación pendiente está incompleta.",
      );
    }

    const targetRef = getRtdb(admin).ref(`content/${nodeKey}/${targetId}`);
    const existingSnapshot = await targetRef.get();
    const payload = { ...data };

    payload.updatedAt = admin.database.ServerValue.TIMESTAMP;
    payload.updatedByUid = request.auth.uid;
    payload.updatedByEmail = getRequesterEmail(request);

    if (existingSnapshot.exists()) {
      const existing = existingSnapshot.val() || {};
      payload.createdAt = existing.createdAt || admin.database.ServerValue.TIMESTAMP;
      payload.ownerUid = existing.ownerUid || ownerUid;
      payload.ownerEmail = existing.ownerEmail || ownerEmail;
    } else {
      payload.createdAt = admin.database.ServerValue.TIMESTAMP;
      payload.ownerUid = ownerUid;
      payload.ownerEmail = ownerEmail;
    }

    await targetRef.set(payload);
    await pendingRef.remove();
    await logAdminAction(
      { db, FieldValue: admin.firestore.FieldValue, logger },
      request.auth.uid,
      "content.approve",
      { nodeKey, targetId, pendingId },
    );

    return { success: true };
  },
);

/**
 * RF-ADM-01: el administrador rechaza (descarta) una publicación pendiente.
 * La publicación original aprobada, si existía, permanece intacta.
 */
exports.rechazarPublicacion = onCall(
  { region: "us-central1" },
  async (request) => {
    await verifyRole(db, request.auth?.uid, [ROLE_ADMIN]);
    const pendingId = String(request.data?.pendingId || "").trim();
    if (!pendingId) {
      throw new HttpsError("invalid-argument", "Falta el ID de la publicación.");
    }

    const pendingRef = getRtdb(admin).ref(`contentPending/${pendingId}`);
    const pendingSnapshot = await pendingRef.get();
    if (!pendingSnapshot.exists()) {
      throw new HttpsError("not-found", "La publicación pendiente no existe.");
    }

    await pendingRef.remove();
    await logAdminAction(
      { db, FieldValue: admin.firestore.FieldValue, logger },
      request.auth.uid,
      "content.reject",
      { pendingId },
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

exports.adminListUsers = onCall({ region: "us-central1" }, async (request) => {
  await verifyRole(db, request.auth?.uid, [ROLE_ADMIN]);

  const authUsers = [];
  let pageToken;

  do {
    const result = await admin.auth().listUsers(1000, pageToken);
    authUsers.push(...result.users);
    pageToken = result.pageToken;
  } while (pageToken);

  const [publicSnapshot, privateSnapshot] = await Promise.all([
    db.collection("usersPublic").get(),
    db.collection("usersPrivate").get(),
  ]);

  const publicByUid = new Map(
    publicSnapshot.docs.map((entry) => [entry.id, entry.data()]),
  );
  const privateByUid = new Map(
    privateSnapshot.docs.map((entry) => [entry.id, entry.data()]),
  );

  const users = authUsers.map((authUser) => {
    const publicProfile = publicByUid.get(authUser.uid) || {};
    const privateProfile = privateByUid.get(authUser.uid) || {};
    const role = normalizeRole(
      publicProfile.role || authUser.customClaims?.role || ROLE_VIEWER,
    );

    return {
      uid: authUser.uid,
      email: String(authUser.email || privateProfile.email || "")
        .trim()
        .toLowerCase(),
      displayName:
        String(
          publicProfile.displayName ||
            authUser.displayName ||
            authUser.email ||
            "Usuario",
        ).trim() || "Usuario",
      role,
      active:
        typeof publicProfile.active === "boolean"
          ? publicProfile.active
          : !authUser.disabled,
      disabled: Boolean(authUser.disabled),
      deletedAt: privateProfile.deletedAt || publicProfile.deletedAt || null,
    };
  });

  users.sort((a, b) => a.email.localeCompare(b.email));

  return { users };
});

exports.adminUpdateUserRole = onCall(
  { region: "us-central1" },
  async (request) => {
    await verifyRole(db, request.auth?.uid, [ROLE_ADMIN]);
    const { uid, role } = request.data;

    if (!uid || !role) {
      throw new HttpsError("invalid-argument", "Faltan datos.");
    }

    const targetUser = await admin.auth().getUser(uid).catch(() => null);

    await db.collection("usersPublic").doc(uid).set({
      displayName: targetUser?.displayName || targetUser?.email || "Usuario",
      role,
      active: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

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

  batch.set(publicRef, {
    active: false,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  try {
    batch.set(privateRef, {
      deletedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
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
    const targetUser = await admin.auth().getUser(targetUid).catch(() => null);

    await db.collection("usersPublic").doc(targetUid).set({
      displayName: targetUser?.displayName || targetUser?.email || "Usuario",
      role: normalizedRole,
      active: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

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
