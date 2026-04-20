require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const { PERMISSIONS, ROLE_TEMPLATES } = require("../src/lib/permissions");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool)
});

async function main() {
  await prisma.userPermission.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.role.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.relationship.deleteMany();
  await prisma.problem.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.userSettings.deleteMany();
  await prisma.document.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.user.deleteMany();

  const permissionRecords = [];
  for (const definition of PERMISSIONS) {
    const permission = await prisma.permission.create({
      data: {
        key: definition.key,
        module: definition.module,
        action: definition.action,
        description: definition.description
      }
    });

    permissionRecords.push(permission);
  }

  const permissionByKey = new Map(permissionRecords.map((permission) => [permission.key, permission]));

  const roleRecords = [];
  for (const template of ROLE_TEMPLATES) {
    const role = await prisma.role.create({
      data: {
        key: template.key,
        name: template.name,
        description: template.description,
        isSystem: template.isSystem
      }
    });

    roleRecords.push(role);

    const rolePermissions = template.permissions
      .map((permissionKey) => permissionByKey.get(permissionKey))
      .filter(Boolean)
      .map((permission) => ({ roleId: role.id, permissionId: permission.id }));

    if (rolePermissions.length > 0) {
      await prisma.rolePermission.createMany({ data: rolePermissions });
    }
  }

  const roleByKey = new Map(roleRecords.map((role) => [role.key, role]));

  await prisma.user.createMany({
    data: [
      { username: "admin", firstName: "John", lastName: "Doe", email: "john.doe@company.com" },
      { username: "testuser", firstName: "Test", lastName: "User", email: "test.user@company.com" },
      { username: "sarah", firstName: "Sarah", lastName: "Chen", email: "sarah.chen@company.com" },
      { username: "michael", firstName: "Michael", lastName: "Torres", email: "michael.torres@company.com" }
    ]
  });

  const seededUsers = await prisma.user.findMany({
    where: {
      username: {
        in: ["admin", "testuser", "sarah", "michael"]
      }
    }
  });

  const userByUsername = new Map(seededUsers.map((user) => [user.username, user]));

  const userRoles = [
    { username: "admin", roleKey: "admin" },
    { username: "testuser", roleKey: "operator" },
    { username: "sarah", roleKey: "viewer" },
    { username: "michael", roleKey: "manager" }
  ];

  for (const assignment of userRoles) {
    const user = userByUsername.get(assignment.username);
    const role = roleByKey.get(assignment.roleKey);

    if (user && role) {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: role.id,
          assignedBy: "system"
        }
      });
    }
  }

  const incidents = await prisma.incident.createMany({
    data: [
      {
        title: "Database connection pool exhaustion",
        description: "Primary DB reached pool capacity during peak traffic."
      },
      {
        title: "Web login latency spike",
        description: "Authentication page slowed down after deploy validation."
      }
    ]
  });

  await prisma.document.createMany({
    data: [
      {
        id: "doc-runbook",
        title: "Production Incident Runbook",
        content: "Steps to triage production incidents, escalate, and communicate status."
      },
      {
        id: "doc-failover",
        title: "Database Failover Procedure",
        content: "Checklist for safe database failover and post-failover validation."
      },
      {
        id: "doc-faq",
        title: "Password Reset FAQ",
        content: "Standard answers for user password reset and account lockout questions."
      }
    ]
  });

  await prisma.asset.createMany({
    data: [
      { id: "1", name: "PROD-WEB-01", type: "server", ipAddress: "10.0.1.10", location: "DC-East Rack A3", status: "online", os: "Ubuntu 22.04 LTS", cpu: "Intel Xeon E5-2680 v4 (16 cores)", memory: "64 GB DDR4", tags: ["production", "web"], lastUpdated: new Date("2026-04-13T08:30:00Z") },
      { id: "2", name: "PROD-WEB-02", type: "server", ipAddress: "10.0.1.11", location: "DC-East Rack A3", status: "online", os: "Ubuntu 22.04 LTS", cpu: "Intel Xeon E5-2680 v4 (16 cores)", memory: "64 GB DDR4", tags: ["production", "web"], lastUpdated: new Date("2026-04-13T08:30:00Z") },
      { id: "3", name: "DB-PRIMARY", type: "server", ipAddress: "10.0.2.5", location: "DC-East Rack B1", status: "online", os: "CentOS 8", cpu: "AMD EPYC 7702 (32 cores)", memory: "256 GB DDR4", tags: ["production", "database"], lastUpdated: new Date("2026-04-13T09:00:00Z") },
      { id: "4", name: "VM-DEV-01", type: "vm", ipAddress: "10.0.3.20", location: "Hypervisor-01", status: "online", os: "Windows Server 2022", cpu: "4 vCPUs", memory: "16 GB", tags: ["development"], lastUpdated: new Date("2026-04-12T14:00:00Z") },
      { id: "5", name: "VM-STAGING-01", type: "vm", ipAddress: "10.0.3.30", location: "Hypervisor-02", status: "warning", os: "Ubuntu 20.04", cpu: "8 vCPUs", memory: "32 GB", tags: ["staging"], lastUpdated: new Date("2026-04-13T07:15:00Z") },
      { id: "6", name: "SW-CORE-01", type: "network", ipAddress: "10.0.0.1", location: "DC-East MDF", status: "online", tags: ["core", "network"], lastUpdated: new Date("2026-04-13T09:10:00Z") },
      { id: "7", name: "FW-EDGE-01", type: "network", ipAddress: "10.0.0.254", location: "DC-East MDF", status: "online", tags: ["firewall", "edge"], lastUpdated: new Date("2026-04-13T09:10:00Z") },
      { id: "8", name: "NAS-BACKUP-01", type: "storage", ipAddress: "10.0.4.10", location: "DC-East Rack C2", status: "online", tags: ["backup", "storage"], lastUpdated: new Date("2026-04-13T06:00:00Z") },
      { id: "9", name: "MAIL-SERVER", type: "server", ipAddress: "10.0.1.50", location: "DC-West Rack A1", status: "offline", os: "Ubuntu 20.04", cpu: "Intel Xeon E3 (4 cores)", memory: "16 GB", tags: ["production", "email"], lastUpdated: new Date("2026-04-12T22:00:00Z") },
      { id: "10", name: "K8S-NODE-01", type: "server", ipAddress: "10.0.5.10", location: "DC-East Rack D1", status: "online", os: "Ubuntu 22.04", cpu: "AMD EPYC 7502 (16 cores)", memory: "128 GB", tags: ["kubernetes", "production"], lastUpdated: new Date("2026-04-13T08:45:00Z") }
    ]
  });

  await prisma.problem.createMany({
    data: [
      { id: "problem-1", title: "Mail server unresponsive", description: "MAIL-SERVER stopped responding to SMTP and IMAP connections. CPU at 100% utilization.", affectedAssets: ["9", "MAIL-SERVER"], severity: "critical", status: "open" },
      { id: "problem-2", title: "VM-STAGING-01 high memory usage", description: "Memory usage consistently above 90%. Possible memory leak in staging application.", affectedAssets: ["5", "VM-STAGING-01"], severity: "high", status: "investigating" },
      { id: "problem-3", title: "Intermittent DNS resolution failures", description: "Some internal DNS queries failing intermittently, affecting service discovery.", affectedAssets: ["6", "SW-CORE-01"], severity: "medium", status: "resolved", resolvedAt: new Date("2026-04-11T09:30:00Z"), solution: "Updated DNS forwarder configuration and flushed DNS cache across all nodes." },
      { id: "problem-4", title: "NAS backup job failed", description: "Nightly backup job to NAS-BACKUP-01 failed with disk space error.", affectedAssets: ["8", "3", "NAS-BACKUP-01", "DB-PRIMARY"], severity: "high", status: "resolved", resolvedAt: new Date("2026-04-09T10:00:00Z"), solution: "Cleaned up old snapshots and expanded storage volume by 2TB." },
      { id: "problem-5", title: "SSL certificate expiring soon", description: "SSL certificate for production web servers expires in 7 days.", affectedAssets: ["1", "2", "PROD-WEB-01", "PROD-WEB-02"], severity: "medium", status: "open" }
    ]
  });

  await prisma.relationship.createMany({
    data: [
      { id: "rel-1", sourceAssetId: "1", targetAssetId: "6", relationshipType: "communicates-with", label: "eth0" },
      { id: "rel-2", sourceAssetId: "2", targetAssetId: "6", relationshipType: "communicates-with", label: "eth0" },
      { id: "rel-3", sourceAssetId: "3", targetAssetId: "6", relationshipType: "communicates-with", label: "eth0" },
      { id: "rel-4", sourceAssetId: "6", targetAssetId: "7", relationshipType: "depends-on", label: "trunk" },
      { id: "rel-5", sourceAssetId: "8", targetAssetId: "6", relationshipType: "communicates-with", label: "eth0" },
      { id: "rel-6", sourceAssetId: "4", targetAssetId: "6", relationshipType: "hosted-on", label: "vSwitch" },
      { id: "rel-7", sourceAssetId: "5", targetAssetId: "6", relationshipType: "hosted-on", label: "vSwitch" },
      { id: "rel-8", sourceAssetId: "9", targetAssetId: "6", relationshipType: "communicates-with", label: "eth0" },
      { id: "rel-9", sourceAssetId: "10", targetAssetId: "6", relationshipType: "communicates-with", label: "eth0" },
      { id: "rel-10", sourceAssetId: "3", targetAssetId: "8", relationshipType: "depends-on", label: "backup" },
      { id: "rel-11", sourceAssetId: "1", targetAssetId: "3", relationshipType: "depends-on", label: "mysql" },
      { id: "rel-12", sourceAssetId: "2", targetAssetId: "3", relationshipType: "depends-on", label: "mysql" }
    ]
  });

  await prisma.userSettings.createMany({
    data: [
      {
        username: "admin",
        notificationsEmail: true,
        notificationsInApp: true,
        notificationsCritical: true,
        theme: "light"
      },
      {
        username: "testuser",
        notificationsEmail: false,
        notificationsInApp: true,
        notificationsCritical: true,
        theme: "auto"
      }
    ]
  });

  console.log("Seed data created successfully");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });