const crypto = require("crypto");
const { createError, getHeader } = require("./http");

const buckets = new Map();
const DEFAULT_WINDOW_MS = 60 * 1000;
const DEFAULT_LIMITS = {
  ai: 12,
  download: 20,
  mutation: 60
};
const MAX_BUCKETS = 2000;

function parseBoolean(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }
  return null;
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function hash(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function timingSafeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));
  const length = Math.max(leftBuffer.length, rightBuffer.length);
  const leftPadded = Buffer.alloc(length);
  const rightPadded = Buffer.alloc(length);

  leftBuffer.copy(leftPadded);
  rightBuffer.copy(rightPadded);

  return crypto.timingSafeEqual(leftPadded, rightPadded) && leftBuffer.length === rightBuffer.length;
}

function isLocalDevelopment(event) {
  if (parseBoolean(process.env.PUENTES_ALLOW_UNAUTHENTICATED_LOCAL) === false) {
    return false;
  }

  if (process.env.NETLIFY_DEV === "true" || process.env.CONTEXT === "dev") {
    return true;
  }

  const host = getHeader(event, "host");
  if (/^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(host)) {
    return true;
  }

  return !process.env.NETLIFY && !process.env.CONTEXT && !process.env.URL && !process.env.DEPLOY_URL;
}

function authRequired(event) {
  const forced = parseBoolean(process.env.PUENTES_REQUIRE_API_AUTH);
  if (forced !== null) {
    return forced;
  }

  if (isLocalDevelopment(event)) {
    return false;
  }

  return parseBoolean(process.env.PUENTES_PUBLIC_API) !== true;
}

function configuredTokens() {
  return [
    ...parseList(process.env.PUENTES_API_TOKENS),
    ...parseList(process.env.PUENTES_API_TOKEN)
  ];
}

function cookieToken(event) {
  const cookieHeader = getHeader(event, "cookie");
  if (!cookieHeader) {
    return "";
  }

  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
  const match = cookies.find((cookie) => cookie.startsWith("puentes_api_token="));
  return match ? decodeURIComponent(match.slice("puentes_api_token=".length)) : "";
}

function requestToken(event) {
  const authorization = getHeader(event, "authorization");
  const bearer = authorization.match(/^Bearer\s+(.+)$/i);
  if (bearer) {
    return bearer[1].trim();
  }

  return getHeader(event, "x-puentes-api-key") || getHeader(event, "x-api-key") || cookieToken(event);
}

function tokenIsValid(event) {
  const token = requestToken(event);
  const tokens = configuredTokens();

  return Boolean(token && tokens.some((candidate) => timingSafeEqual(token, candidate)));
}

function identityHasAllowedRole(context) {
  if (parseBoolean(process.env.PUENTES_ALLOW_NETLIFY_IDENTITY) !== true) {
    return false;
  }

  const user = context?.clientContext?.user;
  if (!user) {
    return false;
  }

  const allowedRoles = parseList(process.env.PUENTES_ALLOWED_NETLIFY_ROLES);
  if (!allowedRoles.length) {
    return true;
  }

  const userRoles = Array.isArray(user.app_metadata?.roles) ? user.app_metadata.roles : [];
  return userRoles.some((role) => allowedRoles.includes(role));
}

function authMechanismConfigured() {
  return configuredTokens().length > 0 || parseBoolean(process.env.PUENTES_ALLOW_NETLIFY_IDENTITY) === true;
}

function assertAuthorized(event, context) {
  if (!authRequired(event)) {
    return;
  }

  if (tokenIsValid(event) || identityHasAllowedRole(context)) {
    return;
  }

  const headers = { "WWW-Authenticate": "Bearer" };
  if (!authMechanismConfigured()) {
    throw createError(
      503,
      "API access is locked on deployed environments until PUENTES_API_TOKEN or PUENTES_API_TOKENS is configured.",
      { headers }
    );
  }

  throw createError(401, "Unauthorized.", { headers });
}

function clientIdentity(event, scope) {
  const token = requestToken(event);
  if (token) {
    return `${scope}:token:${hash(token).slice(0, 32)}`;
  }

  const forwardedFor = getHeader(event, "x-forwarded-for");
  const ip = getHeader(event, "x-nf-client-connection-ip")
    || forwardedFor.split(",")[0].trim()
    || getHeader(event, "client-ip")
    || "unknown";

  return `${scope}:ip:${hash(ip).slice(0, 32)}`;
}

function rateLimit(scope) {
  const envName = scope === "mutation"
    ? "PUENTES_MUTATION_RATE_LIMIT"
    : scope === "download"
      ? "PUENTES_DOWNLOAD_RATE_LIMIT"
      : "PUENTES_AI_RATE_LIMIT";

  return parsePositiveInt(process.env[envName], DEFAULT_LIMITS[scope] || DEFAULT_LIMITS.ai);
}

function assertRateLimit(event, scope) {
  if (isLocalDevelopment(event) && parseBoolean(process.env.PUENTES_RATE_LIMIT_LOCAL) !== true) {
    return;
  }

  const limit = rateLimit(scope);
  if (limit <= 0) {
    return;
  }

  const windowMs = parsePositiveInt(process.env.PUENTES_RATE_LIMIT_WINDOW_MS, DEFAULT_WINDOW_MS);
  const now = Date.now();
  const key = clientIdentity(event, scope);
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    trimBuckets(now);
    return;
  }

  if (current.count >= limit) {
    const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    throw createError(429, "Too many requests.", {
      headers: {
        "Retry-After": String(retryAfter)
      }
    });
  }

  current.count += 1;
}

function trimBuckets(now) {
  if (buckets.size <= MAX_BUCKETS) {
    return;
  }

  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now || buckets.size > MAX_BUCKETS) {
      buckets.delete(key);
    }
  }
}

function requireAccess(event, context, options = {}) {
  const scope = options.scope || "ai";
  assertAuthorized(event, context);
  assertRateLimit(event, scope);
}

module.exports = {
  requireAccess,
  isLocalDevelopment
};
