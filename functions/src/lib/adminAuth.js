const { HttpsError } = require("firebase-functions/v2/https");

const ROLE_ADMIN = "administrador";
const ROLE_EDITOR = "editor";
const ROLE_VIEWER = "visualizador";

function normalizeRole(role) {
  if (role === ROLE_ADMIN || role === ROLE_EDITOR || role === ROLE_VIEWER) {
    return role;
  }

  return ROLE_VIEWER;
}

async function verifyRole(db, uid, allowedRoles) {
  if (!uid) {
    throw new HttpsError(
      "unauthenticated",
      "El usuario debe estar autenticado.",
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
      "No tienes los permisos necesarios.",
    );
  }
  return role;
}

module.exports = {
  ROLE_ADMIN,
  ROLE_EDITOR,
  ROLE_VIEWER,
  normalizeRole,
  verifyRole,
};
