const express = require("express");

const { requireAuth, requirePermission } = require("../../middleware/auth.middleware");
const { prisma } = require("../../lib/prisma");
const { loadUserAccessContext } = require("../../lib/access-control");
const { ensureRolesAndPermissions } = require("../../lib/rbac-bootstrap");

const router = express.Router();

router.use(requireAuth);
router.use(requirePermission(["user:manage", "permission:manage"]));

async function createAuditLog({ actorUsername, targetUsername, action, resource, metadata }) {
  try {
    await prisma.auditLog.create({
      data: {
        actorUsername,
        targetUsername,
        action,
        resource,
        metadata: metadata || undefined
      }
    });
  } catch (_error) {
    // Ignore audit failures so main action still succeeds.
  }
}

router.get("/access", async (_req, res) => {
  try {
    await ensureRolesAndPermissions();

    const [roles, users, permissions] = await Promise.all([
      prisma.role.findMany({
        orderBy: [{ name: "asc" }],
        include: {
          permissions: {
            include: {
              permission: true
            }
          }
        }
      }),
      prisma.user.findMany({
        orderBy: [{ username: "asc" }],
        include: {
          userRoles: {
            include: {
              role: true
            }
          },
          permissionOverrides: {
            include: {
              permission: true
            }
          }
        }
      }),
      prisma.permission.findMany({
        orderBy: [{ module: "asc" }, { action: "asc" }]
      })
    ]);

    const userPayload = [];

    for (const user of users) {
      const access = await loadUserAccessContext(user.username);

      userPayload.push({
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        roles: user.userRoles.map((entry) => ({ key: entry.role.key, name: entry.role.name })),
        allowPermissions: user.permissionOverrides.filter((entry) => entry.effect === "ALLOW").map((entry) => entry.permission.key),
        denyPermissions: user.permissionOverrides.filter((entry) => entry.effect === "DENY").map((entry) => entry.permission.key),
        permissions: access?.permissions || []
      });
    }

    res.json({
      roles: roles.map((role) => ({
        key: role.key,
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
        permissions: role.permissions.map((entry) => entry.permission.key)
      })),
      permissions,
      users: userPayload
    });
  } catch (error) {
    console.error("Access admin load failed:", error);
    res.status(500).json({ error: "Failed to load access control data" });
  }
});

router.patch("/roles/:key", async (req, res) => {
  try {
    const role = await prisma.role.findUnique({ where: { key: req.params.key } });

    if (!role) {
      return res.status(404).json({ error: "Role not found" });
    }

    const permissionKeys = Array.isArray(req.body?.permissionKeys) ? req.body.permissionKeys.map(String) : [];

    const permissions = await prisma.permission.findMany({
      where: { key: { in: permissionKeys } }
    });

    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    if (permissions.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissions.map((permission) => ({ roleId: role.id, permissionId: permission.id })),
        skipDuplicates: true
      });
    }

    const updated = await prisma.role.findUnique({
      where: { key: req.params.key },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    res.json({
      role: {
        key: updated.key,
        name: updated.name,
        description: updated.description,
        permissions: updated.permissions.map((entry) => entry.permission.key)
      }
    });

    await createAuditLog({
      actorUsername: req.user?.username,
      action: "role.permissions.updated",
      resource: `role:${role.key}`,
      metadata: { permissionKeys }
    });
  } catch (error) {
    console.error("Role update failed:", error);
    res.status(500).json({ error: "Failed to update role permissions" });
  }
});

router.patch("/users/:username", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { username: req.params.username } });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const roleKeys = Array.isArray(req.body?.roleKeys) ? req.body.roleKeys.map(String) : [];
    const allowPermissions = Array.isArray(req.body?.allowPermissions) ? req.body.allowPermissions.map(String) : [];
    const denyPermissions = Array.isArray(req.body?.denyPermissions) ? req.body.denyPermissions.map(String) : [];

    if (req.body?.roleKeys) {
      const roles = await prisma.role.findMany({
        where: { key: { in: roleKeys } }
      });

      await prisma.userRole.deleteMany({ where: { userId: user.id } });
      if (roles.length > 0) {
        await prisma.userRole.createMany({
          data: roles.map((role) => ({ userId: user.id, roleId: role.id, assignedBy: "admin" })),
          skipDuplicates: true
        });
      }
    }

    if (req.body?.allowPermissions || req.body?.denyPermissions) {
      const desiredKeys = [...allowPermissions, ...denyPermissions];
      const permissions = await prisma.permission.findMany({ where: { key: { in: desiredKeys } } });
      const permissionByKey = new Map(permissions.map((permission) => [permission.key, permission]));

      await prisma.userPermission.deleteMany({ where: { userId: user.id } });

      const allowRecords = allowPermissions
        .map((key) => permissionByKey.get(key))
        .filter(Boolean)
        .map((permission) => ({ userId: user.id, permissionId: permission.id, effect: "ALLOW", assignedBy: "admin" }));
      const denyRecords = denyPermissions
        .map((key) => permissionByKey.get(key))
        .filter(Boolean)
        .map((permission) => ({ userId: user.id, permissionId: permission.id, effect: "DENY", assignedBy: "admin" }));

      if (allowRecords.length + denyRecords.length > 0) {
        await prisma.userPermission.createMany({
          data: [...allowRecords, ...denyRecords],
          skipDuplicates: true
        });
      }
    }

    const access = await loadUserAccessContext(user.username);

    res.json({
      user: {
        username: user.username,
        roles: access?.roles || [],
        permissions: access?.permissions || []
      }
    });

    await createAuditLog({
      actorUsername: req.user?.username,
      targetUsername: user.username,
      action: "user.access.updated",
      resource: `user:${user.username}`,
      metadata: { roleKeys, allowPermissions, denyPermissions }
    });
  } catch (error) {
    console.error("User access update failed:", error);
    res.status(500).json({ error: "Failed to update user access" });
  }
});

router.get("/audit-logs", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || "100"), 500);
    const offset = parseInt(req.query.offset || "0");

    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset
    });

    const total = await prisma.auditLog.count();

    res.json({
      logs: logs.map((log) => ({
        id: log.id,
        actorUsername: log.actorUsername,
        targetUsername: log.targetUsername,
        action: log.action,
        resource: log.resource,
        metadata: log.metadata,
        createdAt: log.createdAt.toISOString()
      })),
      total,
      limit,
      offset
    });
  } catch (error) {
    console.error("Failed to fetch audit logs:", error);
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
});

module.exports = router;