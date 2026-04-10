const jwt = require("jsonwebtoken");

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
  return (req, res, next) => {
    const userRole = req.user?.role;

    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
}

module.exports = {
  requireAuth,
  requireRole
};
