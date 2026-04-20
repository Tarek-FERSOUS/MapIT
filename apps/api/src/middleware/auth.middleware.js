const jwt = require("jsonwebtoken");
const { loadUserAccessContext, hasAnyPermission, hasRole } = require("../lib/access-control");

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Missing bearer token" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
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
