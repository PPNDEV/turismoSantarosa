const { verifyCaptcha } = require("../lib/captcha");

function createSurveyHandler({
  db,
  FieldValue,
  logger,
  enforceRateLimit,
  rateWindowMs,
  rateLimit,
  httpUtils,
  allowedOrigins,
  captcha,
  ipHashSecret,
}) {
  const {
    getClientIp,
    getRequestId,
    isJsonRequest,
    isOriginAllowed,
    normalizeText,
    hashValue,
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
      logger.warn("survey origin blocked", { origin, requestId });
      response.status(403).json({ ok: false, error: "origin-not-allowed" });
      return;
    }

    const ip = getClientIp(request);
    const rateCheck = await enforceRateLimit(
      `survey:${ip}`,
      rateLimit,
      rateWindowMs,
    );
    if (!rateCheck.allowed) {
      logger.warn("survey rate limited", { requestId });
      response.status(429).json({ ok: false, error: "rate-limited" });
      return;
    }

    const puntuacion = Number(request.body?.puntuacion);
    const comentarios = normalizeText(request.body?.comentarios, 1000);
    const captchaToken = normalizeText(request.body?.captchaToken, 2000);

    if (!Number.isFinite(puntuacion) || puntuacion < 1 || puntuacion > 5) {
      response.status(400).json({ ok: false, error: "invalid-score" });
      return;
    }

    const captchaSecret = captcha?.secret;
    if (captchaSecret) {
      if (!captchaToken) {
        response.status(400).json({ ok: false, error: "captcha-required" });
        return;
      }

      const captchaResult = await verifyCaptcha({
        token: captchaToken,
        secret: captchaSecret,
        provider: captcha?.provider,
        remoteip: ip,
        logger,
      });
      if (!captchaResult.ok) {
        logger.warn("survey captcha failed", {
          requestId,
          reason: captchaResult.error,
        });
        response.status(400).json({ ok: false, error: "captcha-failed" });
        return;
      }
    }

    try {
      const ipHash = hashValue(ip, ipHashSecret);
      await db.collection("encuestas_satisfaccion").add({
        puntuacion,
        comentarios,
        fecha: FieldValue.serverTimestamp(),
        ipHash: ipHash.hash,
        ipHashAlgo: ipHash.algo,
        requestId,
      });

      logger.info("survey stored", { requestId });
      response.status(200).json({ ok: true });
    } catch (error) {
      logger.error("submitSurvey error", { error, requestId });
      response.status(500).json({ ok: false, error: "internal" });
    }
  };
}

module.exports = {
  createSurveyHandler,
};
