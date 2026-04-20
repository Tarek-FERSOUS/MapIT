const express = require("express");

const { requireAuth, requirePermission } = require("../../middleware/auth.middleware");
const { prisma } = require("../../lib/prisma");

const router = express.Router();

router.use(requireAuth);

router.get("/", requirePermission(["incident:view"]), async (_req, res) => {
  try {
    const incidents = await prisma.incident.findMany({
      orderBy: {
        createdAt: "desc"
      }
    });

    res.json({ items: incidents });
  } catch (_err) {
    res.status(500).json({ error: "Failed to fetch incidents" });
  }
});

router.get("/:id", requirePermission(["incident:view"]), async (req, res) => {
  try {
    const incident = await prisma.incident.findUnique({
      where: {
        id: req.params.id
      }
    });

    if (!incident) {
      return res.status(404).json({ error: "Incident not found" });
    }

    res.json(incident);
  } catch (_err) {
    res.status(500).json({ error: "Failed to fetch incident" });
  }
});

router.post("/", requirePermission(["incident:create"]), async (req, res) => {
  const { title, description } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: "title and description are required" });
  }

  try {
    const incident = await prisma.incident.create({
      data: {
        title: String(title),
        description: String(description)
      }
    });

    res.status(201).json(incident);
  } catch (_err) {
    res.status(500).json({ error: "Failed to create incident" });
  }
});

router.patch("/:id", requirePermission(["incident:update"]), async (req, res) => {
  const { title, description } = req.body;

  if (!title && !description) {
    return res.status(400).json({ error: "No fields to update" });
  }

  try {
    const incident = await prisma.incident.update({
      where: {
        id: req.params.id
      },
      data: {
        ...(title ? { title: String(title) } : {}),
        ...(description ? { description: String(description) } : {})
      }
    });

    res.json(incident);
  } catch (_err) {
    res.status(404).json({ error: "Incident not found" });
  }
});

module.exports = router;
