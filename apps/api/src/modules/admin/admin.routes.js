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
    const normalizedMetadata = {
      type: "change",
      ...(metadata || {})
    };

    await prisma.auditLog.create({
      data: {
        actorUsername,
        targetUsername,
        action,
        resource,
        metadata: normalizedMetadata
      }
    });
  } catch (_error) {
    // Ignore audit failures so main action still succeeds.
  }
}

function normalizeSortField(value) {
  const allowed = new Set(["createdAt", "actorUsername", "action", "resource"]);
  const next = String(value || "createdAt");
  return allowed.has(next) ? next : "createdAt";
}

function normalizeSortOrder(value) {
  const next = String(value || "desc").toLowerCase();
  return next === "asc" ? "asc" : "desc";
}

function parseDate(value, endOfDay = false) {
  if (!value) {
    return null;
  }

  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  if (endOfDay) {
    parsed.setHours(23, 59, 59, 999);
  } else {
    parsed.setHours(0, 0, 0, 0);
  }

  return parsed;
}

function csvEscape(value) {
  const normalized = String(value ?? "");
  return `"${normalized.replace(/"/g, '""')}"`;
}

function formatAuditLog(log) {
  return {
    id: log.id,
    actorUsername: log.actorUsername,
    targetUsername: log.targetUsername,
    action: log.action,
    resource: log.resource,
    metadata: log.metadata,
    createdAt: log.createdAt.toISOString()
  };
}

function buildAuditWhereClause(query) {
  const q = String(query.q || "").trim();
  const actor = String(query.actor || "").trim();
  const action = String(query.action || "").trim();
  const resource = String(query.resource || "").trim();
  const type = String(query.type || "").trim();
  const from = parseDate(query.from, false);
  const to = parseDate(query.to, true);

  const where = {};
  const andConditions = [];

  if (actor) {
    andConditions.push({ actorUsername: { contains: actor, mode: "insensitive" } });
  }

  if (action) {
    andConditions.push({ action: { contains: action, mode: "insensitive" } });
  }

  if (resource) {
    andConditions.push({ resource: { contains: resource, mode: "insensitive" } });
  }

  if (type) {
    andConditions.push({ metadata: { path: ["type"], equals: type } });
  }

  if (q) {
    andConditions.push({
      OR: [
        { actorUsername: { contains: q, mode: "insensitive" } },
        { targetUsername: { contains: q, mode: "insensitive" } },
        { action: { contains: q, mode: "insensitive" } },
        { resource: { contains: q, mode: "insensitive" } }
      ]
    });
  }

  if (from || to) {
    andConditions.push({
      createdAt: {
        ...(from ? { gte: from } : {}),
        ...(to ? { lte: to } : {})
      }
    });
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  return where;
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

router.get("/audit-logs/suggestions", async (req, res) => {
  try {
    const field = String(req.query.field || "").trim();
    const q = String(req.query.q || "").trim();
    const limit = Math.min(Math.max(parseInt(req.query.limit || "10", 10) || 10, 1), 50);

    const fieldMap = {
      actor: "actorUsername",
      action: "action",
      resource: "resource"
    };

    const column = fieldMap[field];
    if (!column) {
      return res.status(400).json({ error: "Invalid suggestion field" });
    }

    const where = {
      [column]: {
        not: null,
        ...(q ? { contains: q, mode: "insensitive" } : {})
      }
    };

    const rows = await prisma.auditLog.findMany({
      where,
      distinct: [column],
      select: { [column]: true },
      orderBy: { [column]: "asc" },
      take: limit
    });

    const items = rows
      .map((row) => row[column])
      .filter(Boolean)
      .map(String);

    res.json({ items });
  } catch (error) {
    console.error("Failed to fetch audit log suggestions:", error);
    res.status(500).json({ error: "Failed to fetch audit log suggestions" });
  }
});

router.get("/audit-logs", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || "100", 10) || 100, 1000);
    const offset = parseInt(req.query.offset || "0", 10) || 0;
    const sortBy = normalizeSortField(req.query.sortBy);
    const sortOrder = normalizeSortOrder(req.query.sortOrder);
    const where = buildAuditWhereClause(req.query);
    const exportFormat = String(req.query.format || "").toLowerCase();

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      take: limit,
      skip: offset
    });

    const total = await prisma.auditLog.count({ where });

    if (exportFormat === "csv") {
      const lines = [
        ["id", "createdAt", "actorUsername", "targetUsername", "action", "resource", "metadata"].join(",")
      ];

      for (const log of logs) {
        lines.push(
          [
            csvEscape(log.id),
            csvEscape(log.createdAt.toISOString()),
            csvEscape(log.actorUsername || ""),
            csvEscape(log.targetUsername || ""),
            csvEscape(log.action || ""),
            csvEscape(log.resource || ""),
            csvEscape(log.metadata ? JSON.stringify(log.metadata) : "")
          ].join(",")
        );
      }

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename=\"audit-logs-${Date.now()}.csv\"`);
      return res.status(200).send(lines.join("\n"));
    }

    res.json({
      logs: logs.map(formatAuditLog),
      total,
      limit,
      offset,
      sortBy,
      sortOrder
    });
  } catch (error) {
    console.error("Failed to fetch audit logs:", error);
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
});

module.exports = router;