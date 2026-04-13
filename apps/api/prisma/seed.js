require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool)
});

async function main() {
  await prisma.relationship.deleteMany();
  await prisma.problem.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.userSettings.deleteMany();
  await prisma.document.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.createMany({
    data: [
      { username: "admin" },
      { username: "testuser" },
      { username: "sarah" },
      { username: "michael" }
    ]
  });

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
      {
        id: "asset-db",
        name: "Production DB Server",
        type: "server",
        ipAddress: "10.10.0.10",
        location: "Data Center A",
        status: "online",
        lastUpdated: new Date()
      },
      {
        id: "asset-web",
        name: "Web Frontend VM",
        type: "vm",
        ipAddress: "10.10.0.21",
        location: "Cloud Region 1",
        status: "online",
        lastUpdated: new Date()
      },
      {
        id: "asset-switch",
        name: "Core Network Switch",
        type: "network-device",
        ipAddress: "10.10.0.2",
        location: "Data Center A",
        status: "maintenance",
        lastUpdated: new Date()
      }
    ]
  });

  await prisma.problem.createMany({
    data: [
      {
        id: "problem-web-cpu",
        title: "High CPU on Web VM",
        description: "Sustained CPU above 85% during peak traffic.",
        affectedAssets: ["asset-web"],
        severity: "high",
        status: "in-progress",
        solution: "Scale out the front-end workload and tune caching."
      },
      {
        id: "problem-db-pool",
        title: "DB Pool Saturation",
        description: "Connection pool saturation during batch jobs.",
        affectedAssets: ["asset-db"],
        severity: "critical",
        status: "open"
      }
    ]
  });

  await prisma.relationship.createMany({
    data: [
      {
        id: "rel-web-db",
        sourceAssetId: "asset-web",
        targetAssetId: "asset-db",
        relationshipType: "depends-on",
        label: "queries database"
      },
      {
        id: "rel-switch-web",
        sourceAssetId: "asset-switch",
        targetAssetId: "asset-web",
        relationshipType: "communicates-with",
        label: "routes traffic"
      }
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