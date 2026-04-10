const express = require("express");

const { requireAuth } = require("../../middleware/auth.middleware");
const { prisma } = require("../../lib/prisma");

const router = express.Router();

router.use(requireAuth);

router.get("/summary", async (_req, res) => {
  try {
    const [incidentCount, documentCount, userCount, recentIncidents, recentDocuments] = await Promise.all([
      prisma.incident.count(),
      prisma.document.count(),
      prisma.user.count(),
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
        users: userCount
      },
      recentActivity
    });
  } catch (_err) {
    res.status(500).json({ error: "Failed to load dashboard summary" });
  }
});

module.exports = router;