const { prisma } = require("./prisma");
const { PERMISSIONS, ROLE_TEMPLATES } = require("./permissions");

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

    for (const permissionKey of roleTemplate.permissions) {
      const permission = permissionByKey.get(permissionKey);
      if (!permission) {
        continue;
      }

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id
          }
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id
        }
      });
    }
  }
}

module.exports = {
  ensureRolesAndPermissions
};