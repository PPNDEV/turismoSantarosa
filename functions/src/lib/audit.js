async function logAdminAction({ db, FieldValue, logger }, uid, action, details) {
  if (!uid) {
    return;
  }

  const payload = {
    uid,
    action,
    details: details || {},
    createdAt: FieldValue.serverTimestamp(),
  };

  try {
    await db.collection("adminAudit").add(payload);
  } catch (error) {
    logger.warn("admin audit log failed", error);
  }
}

module.exports = {
  logAdminAction,
};
