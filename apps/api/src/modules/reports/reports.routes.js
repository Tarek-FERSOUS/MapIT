const express = require("express");

const { requireAuth } = require("../../middleware/auth.middleware");
const { prisma } = require("../../lib/prisma");

const router = express.Router();

router.use(requireAuth);

router.get("/summary", async (_req, res) => {
  try {
    const [assets, problems] = await Promise.all([
      prisma.asset.findMany({ select: { type: true } }),
      prisma.problem.findMany({ select: { severity: true } })
    ]);

    const assetTypes = ["server", "vm", "network", "storage", "service"];
    const severities = ["critical", "high", "medium", "low"];

    const assetsByType = assetTypes.map((type) => ({
      type,
      count: assets.filter((asset) => String(asset.type).toLowerCase() === type).length
    }));

    const problemsBySeverity = severities.map((severity) => ({
      severity,
      count: problems.filter((problem) => String(problem.severity).toLowerCase() === severity).length
    }));

    res.json({ assetsByType, problemsBySeverity });
  } catch (_err) {
    res.status(500).json({ error: "Failed to load reports summary" });
  }
});

module.exports = router;