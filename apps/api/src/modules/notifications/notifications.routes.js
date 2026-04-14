const express = require("express");

const { requireAuth } = require("../../middleware/auth.middleware");
const { prisma } = require("../../lib/prisma");

const router = express.Router();

router.use(requireAuth);

router.get("/recent", async (req, res) => {
  try {
    const requested = Number.parseInt(String(req.query.limit || "10"), 10);
    const limit = Number.isFinite(requested)
      ? Math.min(Math.max(requested, 1), 30)
      : 10;

    const perSourceTake = Math.min(Math.max(limit, 5), 15);

    const [incidents, documents, problems, assets] = await Promise.all([
      prisma.incident.findMany({
        orderBy: { createdAt: "desc" },
        take: perSourceTake,
        select: { id: true, title: true, createdAt: true }
      }),
      prisma.document.findMany({
        orderBy: { createdAt: "desc" },
        take: perSourceTake,
        select: { id: true, title: true, createdAt: true }
      }),
      prisma.problem.findMany({
        orderBy: { createdAt: "desc" },
        take: perSourceTake,
        select: { id: true, title: true, severity: true, createdAt: true }
      }),
      prisma.asset.findMany({
        orderBy: { createdAt: "desc" },
        take: perSourceTake,
        select: { id: true, name: true, createdAt: true }
      })
    ]);

    const items = [
      ...incidents.map((incident) => ({
        id: `incident:${incident.id}`,
        kind: "incident",
        sourceId: incident.id,
        title: incident.title,
        createdAt: incident.createdAt,
        href: `/incidents/${incident.id}`
      })),
      ...documents.map((document) => ({
        id: `document:${document.id}`,
        kind: "document",
        sourceId: document.id,
        title: document.title,
        createdAt: document.createdAt,
        href: `/documents/${document.id}`
      })),
      ...problems.map((problem) => ({
        id: `problem:${problem.id}`,
        kind: "problem",
        sourceId: problem.id,
        title: problem.title,
        severity: problem.severity,
        createdAt: problem.createdAt,
        href: `/problems`
      })),
      ...assets.map((asset) => ({
        id: `asset:${asset.id}`,
        kind: "asset",
        sourceId: asset.id,
        title: `Asset added: ${asset.name}`,
        createdAt: asset.createdAt,
        href: `/assets/${asset.id}`
      }))
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);

    res.json({
      items,
      unreadCount: items.length
    });
  } catch (_err) {
    res.status(500).json({ error: "Failed to load recent notifications" });
  }
});

module.exports = router;
