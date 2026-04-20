const { prisma } = require("./prisma");

function normalizeKey(value) {
  return String(value || "").trim().toLowerCase();
}

async function loadUserAccessContext(username) {
  const user = await prisma.user.findUnique({
    where: { username: String(username) },
    select: {
      id: true,
      username: true,
      userRoles: {
        select: {
          role: {
            select: {
              id: true,
              key: true,
              name: true,
              permissions: {
                select: {
                  permission: {
                    select: {
                      key: true
                    }
                  }
                }
              }
            }
          }
        }
      },
      permissionOverrides: {
        select: {
          effect: true,
          permission: {
            select: {
              key: true
            }
          }
        }
      }
    }
  });

  if (!user) {
    return null;
  }

  const roles = user.userRoles.map((entry) => ({
    id: entry.role.id,
    key: entry.role.key,
    name: entry.role.name
  }));

  const allowedPermissions = new Set();
  const deniedPermissions = new Set();

  for (const entry of user.userRoles) {
    for (const link of entry.role.permissions) {
      allowedPermissions.add(link.permission.key);
    }
  }

  for (const override of user.permissionOverrides) {
    const permissionKey = override.permission.key;
    if (override.effect === "DENY") {
      deniedPermissions.add(permissionKey);
      allowedPermissions.delete(permissionKey);
      continue;
    }

    if (!deniedPermissions.has(permissionKey)) {
      allowedPermissions.add(permissionKey);
    }
  }

  const effectivePermissions = Array.from(allowedPermissions).sort();

  return {
    user: {
      id: user.id,
      username: user.username
    },
    roles,
    permissions: effectivePermissions,
    permissionMap: {
      allowed: Array.from(allowedPermissions),
      denied: Array.from(deniedPermissions)
    }
  };
}

function hasAnyPermission(context, requiredPermissions) {
  const required = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
  const allowed = new Set(context?.permissions || []);

  return required.some((permission) => allowed.has(String(permission)));
}

function hasRole(context, requiredRoles) {
  const required = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  const normalizedRequired = required.map(normalizeKey);
  const assigned = new Set((context?.roles || []).map((role) => normalizeKey(role.key)));

  return normalizedRequired.some((role) => assigned.has(role));
}

module.exports = {
  loadUserAccessContext,
  hasAnyPermission,
  hasRole
};