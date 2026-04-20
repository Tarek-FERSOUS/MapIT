const express = require("express");
const jwt = require("jsonwebtoken");
const { authenticateWithAD } = require("./auth.service");
const { requireAuth } = require("../../middleware/auth.middleware");
const { prisma } = require("../../lib/prisma");
const { loadUserAccessContext } = require("../../lib/access-control");
const { ROLE_LOOKUP } = require("../../lib/permissions");

const router = express.Router();

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  let user;
  let access;
  let defaultRoleRecord;
  try {
    user = await authenticateWithAD(username, password);
  } catch (_err) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  try {
    await prisma.user.upsert({
      where: {
        username: String(user.username)
      },
      update: {},
      create: {
        username: String(user.username)
      }
    });

    const createdUser = await prisma.user.findUnique({
      where: { username: String(user.username) },
      select: { id: true, username: true }
    });

    if (!createdUser) {
      return res.status(500).json({ error: "Login failed due to server configuration" });
    }

    const adminRole = ROLE_LOOKUP.admin;
    const viewerRole = ROLE_LOOKUP.viewer;
    const operatorRole = ROLE_LOOKUP.operator;

    const admins = (process.env.ADMIN_USERNAMES || "")
      .split(",")
      .map((name) => name.trim().toLowerCase())
      .filter(Boolean);

    const defaultRole = admins.includes(String(user.username).toLowerCase())
      ? adminRole
      : String(user.username).toLowerCase() === "testuser"
        ? operatorRole
        : viewerRole;

    const existingRoleCount = await prisma.userRole.count({
      where: { userId: createdUser.id }
    });

    defaultRoleRecord = await prisma.role.upsert({
      where: { key: defaultRole.key },
      update: {
        name: defaultRole.name,
        description: defaultRole.description,
        isSystem: defaultRole.isSystem
      },
      create: {
        key: defaultRole.key,
        name: defaultRole.name,
        description: defaultRole.description,
        isSystem: defaultRole.isSystem
      }
    });

    if (existingRoleCount === 0) {
      await prisma.userRole.create({
        data: {
          userId: createdUser.id,
          roleId: defaultRoleRecord.id,
          assignedBy: "system"
        }
      });
    }

    access = await loadUserAccessContext(String(user.username));
  } catch (err) {
    console.error("Login persistence error:", err);
    return res.status(500).json({ error: "Login failed due to server configuration" });
  }

  try {
    const token = jwt.sign({ username: String(user.username) }, process.env.JWT_SECRET, {
      expiresIn: "1d"
    });

    return res.json({
      token,
      role: access?.roles?.[0]?.name || defaultRoleRecord.name,
      roles: access?.roles || [{ key: defaultRoleRecord.key, name: defaultRoleRecord.name }],
      permissions: access?.permissions || []
    });
  } catch (err) {
    console.error("Login token error:", err);
    return res.status(500).json({ error: "Login failed due to server configuration" });
  }
});

router.get("/me", requireAuth, (req, res) => {
  loadUserAccessContext(req.user.username)
    .then((access) => {
      if (!access) {
        return res.status(401).json({ error: "Invalid session" });
      }

      return res.json({
        username: access.user.username,
        role: access.roles[0]?.name || "Viewer",
        roles: access.roles,
        permissions: access.permissions
      });
    })
    .catch(() => {
      res.status(500).json({ error: "Failed to load session" });
    });
});

module.exports = router;