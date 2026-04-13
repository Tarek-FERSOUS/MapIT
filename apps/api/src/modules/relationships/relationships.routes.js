const express = require("express");

const { requireAuth, requireRole } = require("../../middleware/auth.middleware");
const { prisma } = require("../../lib/prisma");

const router = express.Router();

router.use(requireAuth);

router.get("/", async (_req, res) => {
  try {
    const relationships = await prisma.relationship.findMany({
      orderBy: [{ createdAt: "desc" }]
    });

    res.json({ items: relationships });
  } catch (_err) {
    res.status(500).json({ error: "Failed to fetch relationships" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const relationship = await prisma.relationship.findUnique({ where: { id: req.params.id } });

    if (!relationship) {
      return res.status(404).json({ error: "Relationship not found" });
    }

    res.json(relationship);
  } catch (_err) {
    res.status(500).json({ error: "Failed to fetch relationship" });
  }
});

router.post("/", requireRole(["Admin"]), async (req, res) => {
  const { sourceAssetId, targetAssetId, relationshipType, label } = req.body;

  if (!sourceAssetId || !targetAssetId || !relationshipType) {
    return res.status(400).json({ error: "sourceAssetId, targetAssetId and relationshipType are required" });
  }

  try {
    const relationship = await prisma.relationship.create({
      data: {
        sourceAssetId: String(sourceAssetId),
        targetAssetId: String(targetAssetId),
        relationshipType: String(relationshipType),
        ...(label ? { label: String(label) } : {})
      }
    });

    res.status(201).json(relationship);
  } catch (_err) {
    res.status(500).json({ error: "Failed to create relationship" });
  }
});

router.delete("/:id", requireRole(["Admin"]), async (req, res) => {
  try {
    await prisma.relationship.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (_err) {
    res.status(404).json({ error: "Relationship not found" });
  }
});

module.exports = router;