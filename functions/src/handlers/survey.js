const crypto = require("crypto");
const { verifyCaptcha } = require("../lib/captcha");

const SURVEY_COLLECTION = "encuestas_satisfaccion";
const CONTACT_COLLECTION = "surveyContacts";
const OTP_COLLECTION = "surveyOtpChallenges";
const OTP_TTL_MS = 10 * 60 * 1000;
const VALID_METHODS = new Set(["email", "phone"]);
const VALID_VISITOR_TYPES = new Set(["local", "nacional", "extranjero"]);
const VALID_FOUND_INFORMATION = new Set(["si", "parcialmente", "no"]);

function normalizeContact(method, value) {
  const rawValue = String(value || "").trim();

  if (method === "email") {
    return rawValue.toLowerCase();
  }

  return rawValue.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "");
}

function isValidPhone(value) {
  return /^\+?\d{7,15}$/.test(value);
}

function buildHash(value, secret) {
  const normalized = String(value || "").trim();
  const key = String(secret || "").trim();

  if (!normalized) {
    return { hash: null, algo: null };
  }

  if (key) {
    return {
      hash: crypto.createHmac("sha256", key).update(normalized).digest("hex"),
      algo: "hmac-sha256",
    };
  }

  return {
    hash: crypto.createHash("sha256").update(normalized).digest("hex"),
    algo: "sha256",
  };
}

function hashOtp({ otp, contactHash, secret }) {
  return crypto
    .createHash("sha256")
    .update(`${otp}:${contactHash}:${secret || "survey-otp"}`)
    .digest("hex");
}

function generateOtp() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, "0");
}

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
    isValidEmail,
  } = httpUtils;

  function normalizeSurveyPayload(body = {}) {
    const country = normalizeText(body.country, 80);
    const city = normalizeText(body.city, 80);
    const visitorType = normalizeText(body.visitor_type, 20);
    const usabilityRating = Number(body.usability_rating);
    const designRating = Number(body.design_rating);
    const informationRating = Number(body.information_rating);
    const foundInformation = normalizeText(body.found_information, 20);
    const comment = normalizeText(body.comment, 700);
    const verificationMethod = normalizeText(body.verification_method, 20);
    const contact = normalizeContact(
      verificationMethod,
      normalizeText(body.contact, 160),
    );
    const sessionId = normalizeText(body.session_id, 80);

    const ratings = [usabilityRating, designRating, informationRating];
    const hasInvalidRating = ratings.some(
      (rating) => !Number.isInteger(rating) || rating < 1 || rating > 5,
    );

    if (
      !country ||
      !city ||
      !VALID_VISITOR_TYPES.has(visitorType) ||
      hasInvalidRating ||
      !VALID_FOUND_INFORMATION.has(foundInformation) ||
      !VALID_METHODS.has(verificationMethod)
    ) {
      return { ok: false, error: "invalid-survey" };
    }

    if (
      (verificationMethod === "email" && !isValidEmail(contact)) ||
      (verificationMethod === "phone" && !isValidPhone(contact))
    ) {
      return { ok: false, error: "invalid-contact" };
    }

    return {
      ok: true,
      survey: {
        session_id: sessionId,
        country,
        city,
        visitor_type: visitorType,
        usability_rating: usabilityRating,
        design_rating: designRating,
        information_rating: informationRating,
        found_information: foundInformation,
        comment,
        verification_method: verificationMethod,
      },
      contact,
    };
  }

  async function handleSendOtp({ request, response, requestId, ip }) {
    const payload = normalizeSurveyPayload(request.body);
    if (!payload.ok) {
      response.status(400).json({ ok: false, error: payload.error });
      return;
    }

    const contactHash = buildHash(
      `${payload.survey.verification_method}:${payload.contact}`,
      ipHashSecret,
    );

    if (!contactHash.hash) {
      response.status(500).json({ ok: false, error: "hash-unavailable" });
      return;
    }

    const contactRef = db.collection(CONTACT_COLLECTION).doc(contactHash.hash);
    const contactSnapshot = await contactRef.get();
    if (contactSnapshot.exists && contactSnapshot.data()?.status === "verificada") {
      response.status(409).json({
        ok: false,
        state: "duplicada",
        status: "duplicada",
        error: "duplicate-response",
      });
      return;
    }

    const otp = generateOtp();
    const challengeRef = db.collection(OTP_COLLECTION).doc();
    const expiresAtMillis = Date.now() + OTP_TTL_MS;

    await challengeRef.set({
      ...payload.survey,
      contact_hash: contactHash.hash,
      contact_hash_algo: contactHash.algo,
      otp_hash: hashOtp({ otp, contactHash: contactHash.hash, secret: ipHashSecret }),
      otp_verified: false,
      attempts: 0,
      status: "pendiente",
      created_at: FieldValue.serverTimestamp(),
      expires_at_millis: expiresAtMillis,
      requestId,
    });

    await contactRef.set(
      {
        contact_hash: contactHash.hash,
        contact_hash_algo: contactHash.algo,
        verification_method: payload.survey.verification_method,
        status: "pendiente",
        updated_at: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    const debugOtp =
      process.env.SURVEY_OTP_DEBUG === "true" ||
      process.env.NODE_ENV === "development"
        ? otp
        : undefined;

    logger.info("survey otp generated", {
      requestId,
      challengeId: challengeRef.id,
      method: payload.survey.verification_method,
      deliveryConfigured: false,
    });

    response.status(200).json({
      ok: true,
      state: "codigo_enviado",
      challengeId: challengeRef.id,
      expiresInSeconds: Math.round(OTP_TTL_MS / 1000),
      deliveryConfigured: false,
      ...(debugOtp ? { debugOtp } : {}),
    });
  }

  async function handleVerifyOtp({ request, response, requestId }) {
    const challengeId = normalizeText(request.body?.challenge_id, 120);
    const otp = normalizeText(request.body?.otp, 6);

    if (!challengeId || !/^\d{6}$/.test(otp)) {
      response.status(400).json({ ok: false, error: "invalid-otp" });
      return;
    }

    const challengeRef = db.collection(OTP_COLLECTION).doc(challengeId);

    try {
      const result = await db.runTransaction(async (transaction) => {
        const challengeSnapshot = await transaction.get(challengeRef);
        if (!challengeSnapshot.exists) {
          return { status: 404, body: { ok: false, error: "otp-not-found" } };
        }

        const challenge = challengeSnapshot.data();
        if (challenge.status !== "pendiente" || challenge.otp_verified === true) {
          return { status: 400, body: { ok: false, error: "otp-not-pending" } };
        }

        if (Date.now() > Number(challenge.expires_at_millis || 0)) {
          transaction.update(challengeRef, {
            status: "invalida",
            updated_at: FieldValue.serverTimestamp(),
          });
          return { status: 400, body: { ok: false, status: "invalida", error: "otp-expired" } };
        }

        const attempts = Number(challenge.attempts || 0);
        const expectedHash = hashOtp({
          otp,
          contactHash: challenge.contact_hash,
          secret: ipHashSecret,
        });

        if (expectedHash !== challenge.otp_hash) {
          const nextAttempts = attempts + 1;
          transaction.update(challengeRef, {
            attempts: nextAttempts,
            status: nextAttempts >= 5 ? "invalida" : "pendiente",
            updated_at: FieldValue.serverTimestamp(),
          });
          return {
            status: 400,
            body: {
              ok: false,
              status: nextAttempts >= 5 ? "invalida" : "pendiente",
              error: "otp-invalid",
            },
          };
        }

        const contactRef = db.collection(CONTACT_COLLECTION).doc(challenge.contact_hash);
        const contactSnapshot = await transaction.get(contactRef);
        if (contactSnapshot.exists && contactSnapshot.data()?.status === "verificada") {
          transaction.update(challengeRef, {
            status: "duplicada",
            otp_verified: false,
            updated_at: FieldValue.serverTimestamp(),
          });
          return {
            status: 409,
            body: {
              ok: false,
              status: "duplicada",
              state: "duplicada",
              error: "duplicate-response",
            },
          };
        }

        const responseRef = db.collection(SURVEY_COLLECTION).doc();
        const surveyResponse = {
          session_id: challenge.session_id || "",
          country: challenge.country,
          city: challenge.city,
          visitor_type: challenge.visitor_type,
          usability_rating: challenge.usability_rating,
          design_rating: challenge.design_rating,
          information_rating: challenge.information_rating,
          found_information: challenge.found_information,
          comment: challenge.comment || "",
          verification_method: challenge.verification_method,
          contact_hash: challenge.contact_hash,
          contact_hash_algo: challenge.contact_hash_algo,
          otp_verified: true,
          status: "verificada",
          created_at: FieldValue.serverTimestamp(),
          fecha: FieldValue.serverTimestamp(),
          requestId,
          puntuacion: Math.round(
            (Number(challenge.usability_rating) +
              Number(challenge.design_rating) +
              Number(challenge.information_rating)) /
              3,
          ),
          comentarios: challenge.comment || "",
        };

        transaction.set(responseRef, surveyResponse);
        transaction.set(
          contactRef,
          {
            contact_hash: challenge.contact_hash,
            contact_hash_algo: challenge.contact_hash_algo,
            verification_method: challenge.verification_method,
            status: "verificada",
            response_id: responseRef.id,
            verified_at: FieldValue.serverTimestamp(),
            updated_at: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
        transaction.update(challengeRef, {
          status: "verificada",
          otp_verified: true,
          response_id: responseRef.id,
          updated_at: FieldValue.serverTimestamp(),
        });

        return {
          status: 200,
          body: { ok: true, status: "verificada", state: "registrada" },
        };
      });

      response.status(result.status).json(result.body);
    } catch (error) {
      logger.error("verifySurveyOtp error", { error, requestId });
      response.status(500).json({ ok: false, error: "internal" });
    }
  }

  async function handleDirectSubmit({ request, response, requestId }) {
    const payload = normalizeSurveyPayload(request.body);
    if (!payload.ok) {
      response.status(400).json({ ok: false, error: payload.error });
      return;
    }

    const contactHash = buildHash(
      `${payload.survey.verification_method}:${payload.contact}`,
      ipHashSecret,
    );

    if (!contactHash.hash) {
      response.status(500).json({ ok: false, error: "hash-unavailable" });
      return;
    }

    const contactRef = db.collection(CONTACT_COLLECTION).doc(contactHash.hash);

    try {
      const result = await db.runTransaction(async (transaction) => {
        const contactSnapshot = await transaction.get(contactRef);
        if (
          contactSnapshot.exists &&
          contactSnapshot.data()?.status === "verificada"
        ) {
          return {
            status: 409,
            body: {
              ok: false,
              status: "duplicada",
              state: "duplicada",
              error: "duplicate-response",
            },
          };
        }

        const responseRef = db.collection(SURVEY_COLLECTION).doc();
        const surveyResponse = {
          session_id: payload.survey.session_id || "",
          country: payload.survey.country,
          city: payload.survey.city,
          visitor_type: payload.survey.visitor_type,
          usability_rating: payload.survey.usability_rating,
          design_rating: payload.survey.design_rating,
          information_rating: payload.survey.information_rating,
          found_information: payload.survey.found_information,
          comment: payload.survey.comment || "",
          verification_method: payload.survey.verification_method,
          contact_hash: contactHash.hash,
          contact_hash_algo: contactHash.algo,
          otp_verified: false,
          status: "verificada",
          created_at: FieldValue.serverTimestamp(),
          fecha: FieldValue.serverTimestamp(),
          requestId,
          puntuacion: Math.round(
            (Number(payload.survey.usability_rating) +
              Number(payload.survey.design_rating) +
              Number(payload.survey.information_rating)) /
              3,
          ),
          comentarios: payload.survey.comment || "",
        };

        transaction.set(responseRef, surveyResponse);
        transaction.set(
          contactRef,
          {
            contact_hash: contactHash.hash,
            contact_hash_algo: contactHash.algo,
            verification_method: payload.survey.verification_method,
            status: "verificada",
            response_id: responseRef.id,
            verified_at: FieldValue.serverTimestamp(),
            updated_at: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );

        return {
          status: 200,
          body: { ok: true, status: "verificada", state: "registrada" },
        };
      });

      logger.info("survey stored direct", { requestId });
      response.status(result.status).json(result.body);
    } catch (error) {
      logger.error("submitSurveyDirect error", { error, requestId });
      response.status(500).json({ ok: false, error: "internal" });
    }
  }

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

    const action = normalizeText(request.body?.action, 40) || "legacy_submit";
    const puntuacion = Number(request.body?.puntuacion);
    const comentarios = normalizeText(request.body?.comentarios, 1000);
    const captchaToken = normalizeText(request.body?.captchaToken, 2000);

    if (
      action === "legacy_submit" &&
      (!Number.isFinite(puntuacion) || puntuacion < 1 || puntuacion > 5)
    ) {
      response.status(400).json({ ok: false, error: "invalid-score" });
      return;
    }

    const captchaSecret = captcha?.secret;
    if (captchaSecret) {
      if (action !== "legacy_submit") {
        logger.info("survey otp captcha skipped", { requestId, action });
      } else if (!captchaToken) {
        response.status(400).json({ ok: false, error: "captcha-required" });
        return;
      } else {
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
    }

    if (action === "submit") {
      await handleDirectSubmit({ request, response, requestId });
      return;
    }

    if (action === "send_otp") {
      try {
        await handleSendOtp({ request, response, requestId, ip });
      } catch (error) {
        logger.error("sendSurveyOtp error", { error, requestId });
        response.status(500).json({ ok: false, error: "internal" });
      }
      return;
    }

    if (action === "verify_otp") {
      await handleVerifyOtp({ request, response, requestId });
      return;
    }

    try {
      const ipHash = hashValue(ip, ipHashSecret);
      await db.collection(SURVEY_COLLECTION).add({
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
