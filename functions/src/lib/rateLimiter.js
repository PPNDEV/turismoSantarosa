function normalizeRateKey(rawKey) {
  const normalized = String(rawKey || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
  if (!normalized) {
    return "unknown";
  }

  const encoded = Buffer.from(normalized).toString("base64");
  return encoded.replace(/[=+/]/g, "_").slice(0, 200);
}

function createRateLimiter({ db, FieldValue, Timestamp, collectionName }) {
  const limitCollection = collectionName || "rateLimits";

  async function enforceRateLimit(key, limit, windowMs) {
    const now = Date.now();
    const docId = normalizeRateKey(key);
    const ref = db.collection(limitCollection).doc(docId);

    const result = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      const data = snapshot.exists ? snapshot.data() : null;
      const resetAt = Number(data?.resetAt || 0);
      if (!resetAt || resetAt <= now) {
        const resetAtMs = now + windowMs;
        transaction.set(ref, {
          count: 1,
          resetAt: resetAtMs,
          expiresAt: Timestamp ? Timestamp.fromMillis(resetAtMs + windowMs) : null,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        return { allowed: true, remaining: limit - 1 };
      }

      const count = Number(data?.count || 0);
      if (count >= limit) {
        return { allowed: false, remaining: 0, resetAt };
      }

      transaction.update(ref, {
        count: count + 1,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return { allowed: true, remaining: Math.max(0, limit - count - 1) };
    });

    return result;
  }

  return { enforceRateLimit };
}

module.exports = {
  createRateLimiter,
};
