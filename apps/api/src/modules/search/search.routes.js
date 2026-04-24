const express = require("express");

const { requireAuth, requirePermission } = require("../../middleware/auth.middleware");
const { prisma } = require("../../lib/prisma");

const router = express.Router();

router.use(requireAuth);

function normalizeQuery(value) {
  return String(value || "").trim();
}

function toEntityResult(type, item) {
  if (type === "asset") {
    return {
      type,
      id: item.id,
      title: item.name,
      subtitle: `${item.type} · ${item.status}`,
      href: `/assets/${item.id}`,
      createdAt: item.createdAt
    };
  }

  if (type === "problem") {
    return {
      type,
      id: item.id,
      title: item.title,
      subtitle: `${item.severity} · ${item.status}`,
      href: `/problems`,
      createdAt: item.createdAt
    };
  }

  if (type === "incident") {
    return {
      type,
      id: item.id,
      title: item.title,
      subtitle: `${item.priority} · ${item.status}`,
      href: `/incidents/${item.id}`,
      createdAt: item.createdAt
    };
  }

  return {
    type,
    id: item.id,
    title: item.title,
    subtitle: null,
    href: `/documents/${item.id}`,
    createdAt: item.createdAt
  };
}

router.get(
  "/global",
  requirePermission(["asset:view", "problem:view", "incident:view", "document:view"]),
  async (req, res) => {
    const q = normalizeQuery(req.query.q);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10) || 20, 1), 100);

    if (q.length < 2) {
      return res.json({
        query: q,
        total: 0,
        results: [],
        grouped: { assets: [], problems: [], incidents: [], documents: [] }
      });
    }

    const contains = { contains: q, mode: "insensitive" };

    try {
      const [assets, problems, incidents, documents] = await Promise.all([
        prisma.asset.findMany({
          where: {
            OR: [{ name: contains }, { type: contains }, { location: contains }, { tags: { has: q } }]
          },
          orderBy: [{ updatedAt: "desc" }],
          take: limit
        }),
        prisma.problem.findMany({
          where: {
            OR: [{ title: contains }, { description: contains }, { solution: contains }]
          },
          orderBy: [{ updatedAt: "desc" }],
          take: limit
        }),
        prisma.incident.findMany({
          where: {
            OR: [{ title: contains }, { description: contains }, { assignedTeam: contains }]
          },
          orderBy: [{ createdAt: "desc" }],
          take: limit
        }),
        prisma.document.findMany({
          where: {
            OR: [{ title: contains }, { content: contains }]
          },
          orderBy: [{ createdAt: "desc" }],
          take: limit
        })
      ]);

      const grouped = {
        assets: assets.map((item) => toEntityResult("asset", item)),
        problems: problems.map((item) => toEntityResult("problem", item)),
        incidents: incidents.map((item) => toEntityResult("incident", item)),
        documents: documents.map((item) => toEntityResult("document", item))
      };

      const all = [...grouped.assets, ...grouped.problems, ...grouped.incidents, ...grouped.documents]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);

      return res.json({
        query: q,
        total: grouped.assets.length + grouped.problems.length + grouped.incidents.length + grouped.documents.length,
        results: all,
        grouped
      });
    } catch (error) {
      console.error("Global search failed:", error);
      return res.status(500).json({ error: "Failed to perform global search" });
    }
  }
);

module.exports = router;
