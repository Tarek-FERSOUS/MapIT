const jwt = require("jsonwebtoken");
const { loadUserAccessContext, hasAnyPermission, hasRole } = require("../lib/access-control");
const { prisma } = require("../lib/prisma");

const AUDIT_BODY_REDACT_KEYS = new Set(["password", "token", "secret", "authorization"]);

function sanitizeBody(value, depth = 0) {
  if (depth > 3) {
    return "[truncated]";
  }

  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item) => sanitizeBody(item, depth + 1));
  }

  if (value && typeof value === "object") {
    const result = {};
    for (const [key, item] of Object.entries(value)) {
      if (AUDIT_BODY_REDACT_KEYS.has(String(key).toLowerCase())) {
        result[key] = "[redacted]";
      } else {
        result[key] = sanitizeBody(item, depth + 1);
      }
    }
    return result;
  }

  if (typeof value === "string" && value.length > 1000) {
    return `${value.slice(0, 1000)}...[truncated]`;
  }

  return value;
}

function buildAuditAction(method) {
  const normalizedMethod = String(method || "").toUpperCase();

  if (normalizedMethod === "GET") {
    return "resource.accessed";
  }
  if (normalizedMethod === "POST") {
    return "resource.created";
  }
  if (normalizedMethod === "PATCH" || normalizedMethod === "PUT") {
    return "resource.updated";
  }
  if (normalizedMethod === "DELETE") {
    return "resource.deleted";
  }

  return "resource.requested";
}

function buildAuditResource(originalUrl) {
  const cleanPath = String(originalUrl || "").split("?")[0] || "/";
  const parts = cleanPath.split("/").filter(Boolean);

  if (parts.length === 0) {
    return "root";
  }

  if (parts.length === 1) {
    return parts[0];
  }

  return `${parts[0]}:${parts.slice(1).join("/")}`;
}

function attachAccessAuditLogger(req, res) {
  const start = Date.now();

  res.on("finish", () => {
    const path = String(req.originalUrl || "");
    if (!req.user?.username || path.startsWith("/health")) {
      return;
    }

    const statusCode = Number(res.statusCode || 0);
    const durationMs = Date.now() - start;

    const action = buildAuditAction(req.method);
    const resource = buildAuditResource(path);

    const metadata = {
      type: "access",
      method: req.method,
      path,
      query: sanitizeBody(req.query || {}),
      requestBody: sanitizeBody(req.body || {}),
      statusCode,
      durationMs,
      ip: req.ip,
      userAgent: req.headers["user-agent"] || null
    };

    prisma.auditLog
      .create({
        data: {
          actorUsername: req.user.username,
          action,
          resource,
          metadata
        }
      })
      .catch(() => {
        // Do not block response flow on audit persistence failures.
      });
  });
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Missing bearer token" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    attachAccessAuditLogger(req, res);
    next();
  } catch (_err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

function requireRole(allowedRoles) {
  return async (req, res, next) => {
    try {
      const context = await loadUserAccessContext(req.user?.username);

      if (!context || !hasRole(context, allowedRoles)) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }

      req.access = context;
      next();
    } catch (_err) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
  };
}

function requirePermission(requiredPermissions) {
  return async (req, res, next) => {
    try {
      const context = await loadUserAccessContext(req.user?.username);

      if (!context || !hasAnyPermission(context, requiredPermissions)) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }

      req.access = context;
      next();
    } catch (_err) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
  };
}

module.exports = {
  requireAuth,
  requireRole,
  requirePermission
};
