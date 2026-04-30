const crypto = require("crypto");

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

function getClientIp(request) {
  const forwarded = String(request.get("x-forwarded-for") || "");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  return request.ip || "unknown";
}

function getRequestId(request) {
  const headerValue = String(
    request.get("x-request-id") || request.get("x-correlation-id") || "",
  )
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 64);

  if (headerValue) {
    return headerValue;
  }

  return crypto.randomUUID();
}

function isJsonRequest(request) {
  const contentType = String(request.get("content-type") || "");
  return contentType.toLowerCase().includes("application/json");
}

function parseAllowedOrigins(rawValue) {
  const entries = String(rawValue || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (entries.includes("*")) {
    return [];
  }

  return entries;
}

function isOriginAllowed(origin, allowedOrigins) {
  if (!origin) {
    return true;
  }

  if (!Array.isArray(allowedOrigins) || allowedOrigins.length === 0) {
    return true;
  }

  return allowedOrigins.includes(origin);
}

function countUrls(text) {
  const matches = String(text || "").match(/https?:\/\/|www\./gi);
  return matches ? matches.length : 0;
}

function isSuspiciousMessage(text) {
  return countUrls(text) > 2;
}

function hashValue(value, secret) {
  const input = String(value || "").trim();
  if (!input) {
    return { hash: null, algo: null };
  }

  if (!secret) {
    return { hash: null, algo: null };
  }

  return {
    hash: crypto
      .createHmac("sha256", secret)
      .update(input)
      .digest("hex")
      .slice(0, 32),
    algo: "hmac-sha256",
  };
}

function normalizeText(value, maxLength) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

module.exports = {
  ensureLeadingSlash,
  normalizeRouteKey,
  sanitizePath,
  isLikelyBot,
  sanitizeSessionId,
  getClientIp,
  getRequestId,
  isJsonRequest,
  parseAllowedOrigins,
  isOriginAllowed,
  normalizeText,
  isSuspiciousMessage,
  isValidEmail,
  hashValue,
};
