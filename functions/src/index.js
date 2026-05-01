const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const httpUtils = require("./lib/httpUtils");
const { createRateLimiter } = require("./lib/rateLimiter");
const { createVisitsHandler } = require("./handlers/visits");
const { createContactHandler } = require("./handlers/contact");
const { createSurveyHandler } = require("./handlers/survey");

admin.initializeApp();

const db = admin.firestore();
const { FieldValue, Timestamp } = admin.firestore;

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_CONTACT = 5;
const RATE_LIMIT_SURVEY = 10;
const RATE_LIMIT_VISITS = 120;

const allowedOrigins = httpUtils.parseAllowedOrigins(
  process.env.ALLOWED_ORIGINS,
);
const corsOption = allowedOrigins.length > 0 ? allowedOrigins : true;
const captchaProvider = process.env.CAPTCHA_PROVIDER || "turnstile";
const captchaSecret = process.env.CAPTCHA_SECRET || "";
const ipHashSecret = process.env.IP_HASH_SECRET || "";

const { enforceRateLimit } = createRateLimiter({ db, FieldValue, Timestamp });

const visitsHandler = createVisitsHandler({
  db,
  FieldValue,
  logger,
  enforceRateLimit,
  rateWindowMs: RATE_WINDOW_MS,
  rateLimit: RATE_LIMIT_VISITS,
  httpUtils,
  allowedOrigins,
});

const contactHandler = createContactHandler({
  db,
  FieldValue,
  logger,
  enforceRateLimit,
  rateWindowMs: RATE_WINDOW_MS,
  rateLimit: RATE_LIMIT_CONTACT,
  httpUtils,
  allowedOrigins,
  captcha: {
    secret: captchaSecret,
    provider: captchaProvider,
  },
  ipHashSecret,
});

const surveyHandler = createSurveyHandler({
  db,
  FieldValue,
  logger,
  enforceRateLimit,
  rateWindowMs: RATE_WINDOW_MS,
  rateLimit: RATE_LIMIT_SURVEY,
  httpUtils,
  allowedOrigins,
  captcha: {
    secret: captchaSecret,
    provider: captchaProvider,
  },
  ipHashSecret,
});

exports.countVisit = onRequest(
  {
    region: "us-central1",
    cors: corsOption,
    invoker: "public",
    maxInstances: 10,
  },
  visitsHandler,
);

exports.submitContactMessage = onRequest(
  {
    region: "us-central1",
    cors: corsOption,
    invoker: "public",
    maxInstances: 10,
  },
  contactHandler,
);

exports.submitSurvey = onRequest(
  {
    region: "us-central1",
    cors: corsOption,
    invoker: "public",
    maxInstances: 10,
  },
  surveyHandler,
);

const adminFunctions = require("./admin");
exports.adminUpsertContent = adminFunctions.adminUpsertContent;
exports.adminDeleteContent = adminFunctions.adminDeleteContent;
exports.adminCreateUser = adminFunctions.adminCreateUser;
exports.adminUpdateUserRole = adminFunctions.adminUpdateUserRole;
exports.adminDeleteUser = adminFunctions.adminDeleteUser;
exports.asignarRol = adminFunctions.asignarRol;
