const PERMISSIONS = [
  { key: "dashboard:view", module: "dashboard", action: "view", description: "View dashboard summaries and widgets" },
  { key: "asset:view", module: "assets", action: "view", description: "View assets" },
  { key: "asset:create", module: "assets", action: "create", description: "Create assets" },
  { key: "asset:update", module: "assets", action: "update", description: "Edit assets" },
  { key: "asset:delete", module: "assets", action: "delete", description: "Delete assets" },
  { key: "problem:view", module: "problems", action: "view", description: "View problems" },
  { key: "problem:create", module: "problems", action: "create", description: "Create problems" },
  { key: "problem:update", module: "problems", action: "update", description: "Edit problems" },
  { key: "problem:delete", module: "problems", action: "delete", description: "Delete problems" },
  { key: "incident:view", module: "incidents", action: "view", description: "View incidents" },
  { key: "incident:create", module: "incidents", action: "create", description: "Create incidents" },
  { key: "incident:update", module: "incidents", action: "update", description: "Edit incidents" },
  { key: "incident:delete", module: "incidents", action: "delete", description: "Delete incidents" },
  { key: "document:view", module: "documents", action: "view", description: "View documents" },
  { key: "document:create", module: "documents", action: "create", description: "Create documents" },
  { key: "document:update", module: "documents", action: "update", description: "Edit documents" },
  { key: "document:delete", module: "documents", action: "delete", description: "Delete documents" },
  { key: "relationship:view", module: "relationships", action: "view", description: "View relationships" },
  { key: "relationship:create", module: "relationships", action: "create", description: "Create relationships" },
  { key: "relationship:delete", module: "relationships", action: "delete", description: "Delete relationships" },
  { key: "report:view", module: "reports", action: "view", description: "View reports" },
  { key: "notification:view", module: "notifications", action: "view", description: "View notifications" },
  { key: "settings:view-own", module: "settings", action: "view-own", description: "View own settings" },
  { key: "settings:update-own", module: "settings", action: "update-own", description: "Update own settings" },
  { key: "settings:view-any", module: "settings", action: "view-any", description: "View any user's settings" },
  { key: "settings:update-any", module: "settings", action: "update-any", description: "Update any user's settings" },
  { key: "user:view", module: "users", action: "view", description: "View users" },
  { key: "user:manage", module: "users", action: "manage", description: "Assign roles and permission overrides to users" },
  { key: "permission:view", module: "permissions", action: "view", description: "View permission catalog" },
  { key: "permission:manage", module: "permissions", action: "manage", description: "Create or update permission definitions" }
];

const ROLE_TEMPLATES = [
  {
    key: "admin",
    name: "Admin",
    description: "Full access to every feature",
    permissions: PERMISSIONS.map((permission) => permission.key),
    isSystem: true
  },
  {
    key: "manager",
    name: "Manager",
    description: "Can manage operational content and review reports",
    permissions: [
      "dashboard:view",
      "asset:view",
      "asset:create",
      "asset:update",
      "problem:view",
      "problem:create",
      "problem:update",
      "incident:view",
      "incident:create",
      "incident:update",
      "document:view",
      "document:create",
      "document:update",
      "relationship:view",
      "report:view",
      "notification:view",
      "settings:view-own",
      "settings:update-own"
    ],
    isSystem: true
  },
  {
    key: "operator",
    name: "Operator",
    description: "Can add operational records without administrative access",
    permissions: [
      "dashboard:view",
      "asset:view",
      "asset:create",
      "problem:view",
      "problem:create",
      "incident:view",
      "incident:create",
      "document:view",
      "document:create",
      "relationship:view",
      "notification:view",
      "settings:view-own",
      "settings:update-own"
    ],
    isSystem: true
  },
  {
    key: "viewer",
    name: "Viewer",
    description: "Read-only access",
    permissions: [
      "dashboard:view",
      "asset:view",
      "problem:view",
      "incident:view",
      "document:view",
      "relationship:view",
      "report:view",
      "notification:view",
      "settings:view-own",
      "settings:update-own"
    ],
    isSystem: true
  }
];

const PERMISSION_LOOKUP = Object.fromEntries(PERMISSIONS.map((permission) => [permission.key, permission]));
const ROLE_LOOKUP = Object.fromEntries(ROLE_TEMPLATES.map((role) => [role.key, role]));

function getPermissionKeys() {
  return PERMISSIONS.map((permission) => permission.key);
}

module.exports = {
  PERMISSIONS,
  ROLE_TEMPLATES,
  PERMISSION_LOOKUP,
  ROLE_LOOKUP,
  getPermissionKeys
};