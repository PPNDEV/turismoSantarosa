function createVisitsHandler({
  db,
  FieldValue,
  logger,
  enforceRateLimit,
  rateWindowMs,
  rateLimit,
  httpUtils,
  allowedOrigins,
}) {
  const {
    getClientIp,
    getRequestId,
    isJsonRequest,
    isLikelyBot,
    isOriginAllowed,
    sanitizePath,
    sanitizeSessionId,
    normalizeRouteKey,
  } = httpUtils;

  return async (request, response) => {
    if (request.method === "OPTIONS") {
      response.status(204).send("");
      return;
    }

    if (request.method !== "POST") {
      response.status(405).json({ ok: false, error: "method-not-allowed" });
      return;
    }

    const requestId = getRequestId(request);
    response.set("x-request-id", requestId);

    if (!isJsonRequest(request)) {
      response
        .status(415)
        .json({ ok: false, error: "unsupported-media-type" });
      return;
    }

    const origin = String(request.get("origin") || "");
    if (!isOriginAllowed(origin, allowedOrigins)) {
      logger.warn("visits origin blocked", { origin, requestId });
      response.status(403).json({ ok: false, error: "origin-not-allowed" });
      return;
    }

    const ip = getClientIp(request);
    const rateCheck = await enforceRateLimit(
      `visits:${ip}`,
      rateLimit,
      rateWindowMs,
    );
    if (!rateCheck.allowed) {
      logger.warn("visits rate limited", { requestId });
      response.status(429).json({ ok: false, error: "rate-limited" });
      return;
    }

    const userAgent = request.get("user-agent") || "";
    if (isLikelyBot(request, userAgent)) {
      response.status(202).json({ ok: true, ignored: "bot" });
      return;
    }

    const rawPath = request.body?.path;
    if (typeof rawPath !== "string") {
      response.status(400).json({ ok: false, error: "invalid-path" });
      return;
    }

    const path = sanitizePath(rawPath);
    if (!path.startsWith("/")) {
      response.status(400).json({ ok: false, error: "invalid-path-format" });
      return;
    }

    const routeKey = normalizeRouteKey(path);
    const sessionId = sanitizeSessionId(request.body?.sessionId);
    const isFirstSessionVisit = request.body?.isFirstSessionVisit === true;
    const isFirstRouteInSession = request.body?.isFirstRouteInSession === true;

    if (!sessionId) {
      response.status(400).json({ ok: false, error: "invalid-session" });
      return;
    }

    const trafficRef = db.collection("analytics").doc("traffic");

    try {
      const updates = {
        totalPageViews: FieldValue.increment(1),
        lastVisitAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        [`routes.${routeKey}.path`]: path,
        [`routes.${routeKey}.views`]: FieldValue.increment(1),
        [`routes.${routeKey}.updatedAt`]: FieldValue.serverTimestamp(),
      };

      if (isFirstSessionVisit) {
        updates.totalSessions = FieldValue.increment(1);
        updates.lastSessionId = sessionId;
      }

      if (isFirstRouteInSession) {
        updates[`routes.${routeKey}.sessions`] = FieldValue.increment(1);
      }

      await trafficRef.set(updates, { merge: true });

      logger.info("visit recorded", { requestId, routeKey });
      response.status(200).json({ ok: true });
    } catch (error) {
      logger.error("countVisit error", { error, requestId });
      response.status(500).json({ ok: false, error: "internal" });
    }
  };
}

module.exports = {
  createVisitsHandler,
};
