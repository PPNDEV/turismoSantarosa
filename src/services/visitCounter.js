import {
  doc,
  increment,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";

const ANALYTICS_COLLECTION = "analytics";
const ANALYTICS_DOCUMENT = "traffic";
const SESSION_ID_KEY = "visit-santa-rosa-session-id";
const SESSION_SEEN_KEY = "visit-santa-rosa-session-seen-routes";
const SESSION_COUNTED_KEY = "visit-santa-rosa-session-counted";
const SESSION_LAST_SENT_KEY = "visit-santa-rosa-session-last-sent";
const BOT_UA_PATTERN =
  /bot|crawler|spider|headless|preview|lighthouse|google-structured-data-testing-tool|bingpreview|facebookexternalhit|slurp|duckduckbot|yandex|baiduspider/i;
const MIN_SECONDS_BETWEEN_ROUTE_COUNTS = 4;

const VISITS_API_URL = import.meta.env.VITE_VISITS_API_URL || "/api/visits";
const VISITS_BACKEND_MODE =
  import.meta.env.VITE_VISITS_BACKEND_MODE || "function";
const VISITS_ALLOW_DIRECT_FALLBACK =
  import.meta.env.VITE_VISITS_ALLOW_DIRECT_FALLBACK === "true";

const analyticsRef = doc(db, ANALYTICS_COLLECTION, ANALYTICS_DOCUMENT);

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

function readSeenRoutes() {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const rawValue = window.sessionStorage.getItem(SESSION_SEEN_KEY);
    if (!rawValue) {
      return {};
    }

    const parsedValue = JSON.parse(rawValue);
    return parsedValue && typeof parsedValue === "object" ? parsedValue : {};
  } catch {
    return {};
  }
}

function readLastSentRoutes() {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const rawValue = window.sessionStorage.getItem(SESSION_LAST_SENT_KEY);
    if (!rawValue) {
      return {};
    }

    const parsedValue = JSON.parse(rawValue);
    return parsedValue && typeof parsedValue === "object" ? parsedValue : {};
  } catch {
    return {};
  }
}

function writeLastSentRoutes(lastSentRoutes) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(
      SESSION_LAST_SENT_KEY,
      JSON.stringify(lastSentRoutes),
    );
  } catch {
    // Si falla sessionStorage, simplemente no persiste estado local.
  }
}

function writeSeenRoutes(seenRoutes) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(SESSION_SEEN_KEY, JSON.stringify(seenRoutes));
  } catch {
    // Si falla sessionStorage, simplemente no persiste estado local.
  }
}

function getSessionId() {
  if (typeof window === "undefined") {
    return "server";
  }

  const existing = window.sessionStorage.getItem(SESSION_ID_KEY);
  if (existing) {
    return existing;
  }

  const nextSessionId =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  window.sessionStorage.setItem(SESSION_ID_KEY, nextSessionId);
  return nextSessionId;
}

function hasCountedSession() {
  if (typeof window === "undefined") {
    return true;
  }

  return window.sessionStorage.getItem(SESSION_COUNTED_KEY) === "1";
}

function markSessionCounted() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(SESSION_COUNTED_KEY, "1");
}

function isLikelyBotUserAgent(userAgent = "") {
  return BOT_UA_PATTERN.test(userAgent);
}

function shouldSkipVisitTracking(pathname) {
  if (typeof window === "undefined") {
    return true;
  }

  if (!pathname || !pathname.startsWith("/")) {
    return true;
  }

  if (
    typeof document !== "undefined" &&
    document.visibilityState === "hidden"
  ) {
    return true;
  }

  if (typeof navigator !== "undefined") {
    if (navigator.webdriver) {
      return true;
    }

    if (isLikelyBotUserAgent(navigator.userAgent || "")) {
      return true;
    }
  }

  return false;
}

function markRouteSent(routeKey) {
  const lastSent = readLastSentRoutes();
  lastSent[routeKey] = Date.now();
  writeLastSentRoutes(lastSent);
}

function shouldThrottleRoute(routeKey) {
  const lastSent = readLastSentRoutes();
  const lastSentAt = Number(lastSent[routeKey] || 0);
  const elapsedMs = Date.now() - lastSentAt;

  return elapsedMs >= 0 && elapsedMs < MIN_SECONDS_BETWEEN_ROUTE_COUNTS * 1000;
}

async function writeVisitToFirestore(pathname, routeKey) {
  const seenRoutes = readSeenRoutes();
  const isFirstRouteInSession = !seenRoutes[routeKey];
  const isFirstSessionVisit = !hasCountedSession();

  const payload = {
    totalPageViews: increment(1),
    lastVisitAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    [`routes.${routeKey}.path`]: pathname,
    [`routes.${routeKey}.views`]: increment(1),
    [`routes.${routeKey}.updatedAt`]: serverTimestamp(),
  };

  if (isFirstSessionVisit) {
    payload.totalSessions = increment(1);
    payload.lastSessionId = getSessionId();
  }

  if (isFirstRouteInSession) {
    payload[`routes.${routeKey}.sessions`] = increment(1);
  }

  await setDoc(analyticsRef, payload, { merge: true });

  if (isFirstSessionVisit) {
    markSessionCounted();
  }

  if (isFirstRouteInSession) {
    seenRoutes[routeKey] = true;
    writeSeenRoutes(seenRoutes);
  }
}

async function sendVisitToBackend(pathname, routeKey) {
  const response = await fetch(VISITS_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      path: pathname,
      routeKey,
      sessionId: getSessionId(),
      referrer: typeof document !== "undefined" ? document.referrer || "" : "",
    }),
  });

  if (!response.ok) {
    throw new Error(`Visit endpoint failed: ${response.status}`);
  }
}

export async function recordVisit(pathname) {
  if (shouldSkipVisitTracking(pathname)) {
    return;
  }

  const normalizedPath = ensureLeadingSlash(pathname).replace(/\/$/, "") || "/";
  const routeKey = normalizeRouteKey(normalizedPath);
  if (shouldThrottleRoute(routeKey)) {
    return;
  }

  if (VISITS_BACKEND_MODE === "firestore-direct") {
    await writeVisitToFirestore(normalizedPath, routeKey);
    markRouteSent(routeKey);
    return;
  }

  try {
    await sendVisitToBackend(normalizedPath, routeKey);
    markRouteSent(routeKey);
  } catch {
    if (VISITS_ALLOW_DIRECT_FALLBACK) {
      await writeVisitToFirestore(normalizedPath, routeKey);
      markRouteSent(routeKey);
    }
  }
}

function normalizeMetrics(rawData) {
  const routesMap =
    rawData?.routes && typeof rawData.routes === "object" ? rawData.routes : {};

  const routes = Object.entries(routesMap)
    .map(([key, value]) => ({
      key,
      path: value?.path || `/${key}`,
      views: Number(value?.views || 0),
      sessions: Number(value?.sessions || 0),
    }))
    .sort((a, b) => b.views - a.views);

  return {
    totalPageViews: Number(rawData?.totalPageViews || 0),
    totalSessions: Number(rawData?.totalSessions || 0),
    routes,
  };
}

export function subscribeVisitMetrics(onChange, onError) {
  return onSnapshot(
    analyticsRef,
    (snapshot) => {
      const normalized = snapshot.exists()
        ? normalizeMetrics(snapshot.data())
        : normalizeMetrics({});

      onChange(normalized);
    },
    (error) => {
      if (typeof onError === "function") {
        onError(error);
      }
    },
  );
}
