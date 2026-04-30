const { verifyCaptcha } = require("../lib/captcha");

function createContactHandler({
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
    isSuspiciousMessage,
    normalizeText,
    isValidEmail,
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
      logger.warn("contact origin blocked", { origin, requestId });
      response.status(403).json({ ok: false, error: "origin-not-allowed" });
      return;
    }

    const ip = getClientIp(request);
    const rateCheck = await enforceRateLimit(
      `contact:${ip}`,
      rateLimit,
      rateWindowMs,
    );
    if (!rateCheck.allowed) {
      logger.warn("contact rate limited", { requestId });
      response.status(429).json({ ok: false, error: "rate-limited" });
      return;
    }

    const nombre = normalizeText(request.body?.nombre, 80);
    const correo = normalizeText(request.body?.correo, 120);
    const mensaje = normalizeText(request.body?.mensaje, 1000);
    const captchaToken = normalizeText(request.body?.captchaToken, 2000);

    if (!nombre || !correo || !mensaje) {
      response.status(400).json({ ok: false, error: "invalid-payload" });
      return;
    }

    if (!isValidEmail(correo)) {
      response.status(400).json({ ok: false, error: "invalid-email" });
      return;
    }

    if (isSuspiciousMessage(mensaje)) {
      response.status(400).json({ ok: false, error: "spam-detected" });
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
        logger.warn("contact captcha failed", {
          requestId,
          reason: captchaResult.error,
        });
        response.status(400).json({ ok: false, error: "captcha-failed" });
        return;
      }
    }

    try {
      const ipHash = hashValue(ip, ipHashSecret);
      await db.collection("mensajes_contacto").add({
        remitente: nombre,
        correo,
        consulta_sugerencia: mensaje,
        fecha: FieldValue.serverTimestamp(),
        ipHash: ipHash.hash,
        ipHashAlgo: ipHash.algo,
        requestId,
      });

      logger.info("contact stored", { requestId });
      response.status(200).json({ ok: true });
    } catch (error) {
      logger.error("submitContactMessage error", { error, requestId });
      response.status(500).json({ ok: false, error: "internal" });
    }
  };
}

module.exports = {
  createContactHandler,
};
