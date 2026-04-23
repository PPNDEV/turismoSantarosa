const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();
const { FieldValue } = admin.firestore;

const BOT_UA_PATTERN =
  /bot|crawler|spider|headless|preview|lighthouse|google-structured-data-testing-tool|bingpreview|facebookexternalhit|slurp|duckduckbot|yandex|baiduspider/i;

function ensureLeadingSlash(pathname) {
  if (!pathname || pathname === "/") {
    return "/";
  }

  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

function normalizeRouteKey(pathname) {
  const normalizedPath =
    ensureLeadingSlash(pathname).toLowerCase().replace(/\/$/, "") || "/";

  if (normalizedPath === "/") {
    return "home";
  }

  return (
    normalizedPath
      .slice(1)
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "home"
  );
}

function sanitizePath(pathname) {
  const normalized = ensureLeadingSlash(String(pathname || "").trim())
    .replace(/[\r\n\t]/g, "")
    .slice(0, 180);

  return normalized.replace(/\/$/, "") || "/";
}

function isLikelyBot(request, userAgent = "") {
  const ua = String(userAgent || "").toLowerCase();

  if (BOT_UA_PATTERN.test(ua)) {
    return true;
  }

  if (String(request.get("x-bot") || "").toLowerCase() === "1") {
    return true;
  }

  const secPurpose = String(request.get("sec-purpose") || "").toLowerCase();
  if (secPurpose.includes("prefetch") || secPurpose.includes("preview")) {
    return true;
  }

  return false;
}

function sanitizeSessionId(rawSessionId = "") {
  const candidate = String(rawSessionId).trim().slice(0, 80);

  if (!candidate) {
    return null;
  }

  return /^[a-zA-Z0-9_-]+$/.test(candidate) ? candidate : null;
}

exports.countVisit = onRequest(
  {
    region: "us-central1",
    cors: true,
    invoker: "public",
    maxInstances: 10,
  },
  async (request, response) => {
    if (request.method === "OPTIONS") {
      response.status(204).send("");
      return;
    }

    if (request.method !== "POST") {
      response.status(405).json({ ok: false, error: "method-not-allowed" });
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

    if (!sessionId) {
      response.status(400).json({ ok: false, error: "invalid-session" });
      return;
    }

    const trafficRef = db.collection("analytics").doc("traffic");
    const sessionRef = db.collection("analyticsSessions").doc(sessionId);
    const routeSessionRef = db
      .collection("analyticsRouteSessions")
      .doc(`${sessionId}_${routeKey}`);

    try {
      await db.runTransaction(async (tx) => {
        const [sessionSnapshot, routeSessionSnapshot] = await Promise.all([
          tx.get(sessionRef),
          tx.get(routeSessionRef),
        ]);

        const updates = {
          totalPageViews: FieldValue.increment(1),
          lastVisitAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          [`routes.${routeKey}.path`]: path,
          [`routes.${routeKey}.views`]: FieldValue.increment(1),
          [`routes.${routeKey}.updatedAt`]: FieldValue.serverTimestamp(),
        };

        if (!sessionSnapshot.exists) {
          updates.totalSessions = FieldValue.increment(1);
          updates.lastSessionId = sessionId;

          tx.set(sessionRef, {
            sessionId,
            firstPath: path,
            userAgent: String(userAgent).slice(0, 200),
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });
        } else {
          tx.set(
            sessionRef,
            {
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true },
          );
        }

        if (!routeSessionSnapshot.exists) {
          updates[`routes.${routeKey}.sessions`] = FieldValue.increment(1);

          tx.set(routeSessionRef, {
            sessionId,
            routeKey,
            path,
            createdAt: FieldValue.serverTimestamp(),
          });
        }

        tx.set(trafficRef, updates, { merge: true });
      });

      response.status(200).json({ ok: true });
    } catch (error) {
      logger.error("countVisit error", error);
      response.status(500).json({ ok: false, error: "internal" });
    }
  },
);
