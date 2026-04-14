const express = require("express");

const { requireAuth } = require("../../middleware/auth.middleware");
const { prisma } = require("../../lib/prisma");

const router = express.Router();

router.use(requireAuth);

router.get("/summary", async (_req, res) => {
  try {
    const [incidentCount, documentCount, userCount, assetCount, activeServerCount, openProblemCount, resolvedProblemCount, recentIncidents, recentDocuments, openProblems] = await Promise.all([
      prisma.incident.count(),
      prisma.document.count(),
      prisma.user.count(),
      prisma.asset.count(),
      prisma.asset.count({
        where: {
          type: {
            equals: "server",
            mode: "insensitive"
          },
          status: {
            equals: "online",
            mode: "insensitive"
          }
        }
      }),
      prisma.problem.count({
        where: {
          status: {
            not: "resolved"
          }
        }
      }),
      prisma.problem.count({
        where: {
          status: "resolved"
        }
      }),
      prisma.incident.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          createdAt: true
        }
      }),
      prisma.document.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          createdAt: true
        }
      }),
      prisma.problem.findMany({
        where: {
          status: {
            not: "resolved"
          }
        },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          title: true,
          severity: true,
          affectedAssets: true
        }
      })
    ]);

    const recentActivity = [
      ...recentIncidents.map((incident) => ({
        id: incident.id,
        title: incident.title,
        createdAt: incident.createdAt,
        type: "incident"
      })),
      ...recentDocuments.map((document) => ({
        id: document.id,
        title: document.title,
        createdAt: document.createdAt,
        type: "document"
      }))
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8);

    res.json({
      kpis: {
        incidents: incidentCount,
        documents: documentCount,
        users: userCount,
        totalAssets: assetCount,
        activeServers: activeServerCount,
        openProblems: openProblemCount,
        resolvedThisMonth: resolvedProblemCount
      },
      recentActivity,
      openProblems
    });
  } catch (_err) {
    res.status(500).json({ error: "Failed to load dashboard summary" });
  }
});

module.exports = router;