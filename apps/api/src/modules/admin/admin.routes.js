const express = require("express");

const { requireAuth, requirePermission } = require("../../middleware/auth.middleware");
const { prisma } = require("../../lib/prisma");
const { PERMISSIONS, ROLE_TEMPLATES } = require("../../lib/permissions");
const { loadUserAccessContext } = require("../../lib/access-control");

const router = express.Router();

router.use(requireAuth);
router.use(requirePermission(["user:manage", "permission:manage"]));

async function ensureRolesAndPermissions() {
  const permissionRecords = [];

  for (const definition of PERMISSIONS) {
    const permission = await prisma.permission.upsert({
      where: { key: definition.key },
      update: {
        module: definition.module,
        action: definition.action,
        description: definition.description
      },
      create: {
        key: definition.key,
        module: definition.module,
        action: definition.action,
        description: definition.description
      }
    });

    permissionRecords.push(permission);
  }

  const permissionByKey = new Map(permissionRecords.map((permission) => [permission.key, permission]));

  for (const roleTemplate of ROLE_TEMPLATES) {
    const role = await prisma.role.upsert({
      where: { key: roleTemplate.key },
      update: {
        name: roleTemplate.name,
        description: roleTemplate.description,
        isSystem: roleTemplate.isSystem
      },
      create: {
        key: roleTemplate.key,
        name: roleTemplate.name,
        description: roleTemplate.description,
        isSystem: roleTemplate.isSystem
      }
    });

    const permissionLinks = roleTemplate.permissions
      .map((permissionKey) => permissionByKey.get(permissionKey))
      .filter(Boolean)
      .map((permission) => ({ roleId: role.id, permissionId: permission.id }));

    if (permissionLinks.length > 0) {
      await prisma.rolePermission.createMany({ data: permissionLinks, skipDuplicates: true });
    }
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
  } catch (error) {
    console.error("User access update failed:", error);
    res.status(500).json({ error: "Failed to update user access" });
  }
});

module.exports = router;