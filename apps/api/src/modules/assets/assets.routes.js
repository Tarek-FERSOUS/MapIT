const express = require("express");

const { requireAuth, requireRole } = require("../../middleware/auth.middleware");
const { prisma } = require("../../lib/prisma");

const router = express.Router();

router.use(requireAuth);

router.get("/", async (_req, res) => {
  try {
    const assets = await prisma.asset.findMany({
      orderBy: [{ createdAt: "desc" }]
    });

    res.json({ items: assets });
  } catch (_err) {
    res.status(500).json({ error: "Failed to fetch assets" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const asset = await prisma.asset.findUnique({
      where: { id: req.params.id }
    });

    if (!asset) {
      return res.status(404).json({ error: "Asset not found" });
    }

    res.json(asset);
  } catch (_err) {
    res.status(500).json({ error: "Failed to fetch asset" });
  }
});

router.post("/", requireRole(["Admin"]), async (req, res) => {
  const { name, type, ipAddress, location, status, lastUpdated, os, cpu, memory, tags } = req.body;

  if (!name || !type || !ipAddress || !location || !status) {
    return res.status(400).json({ error: "name, type, ipAddress, location and status are required" });
  }

  try {
    const asset = await prisma.asset.create({
      data: {
        name: String(name),
        type: String(type),
        ipAddress: String(ipAddress),
        location: String(location),
        status: String(status),
        ...(os ? { os: String(os) } : {}),
        ...(cpu ? { cpu: String(cpu) } : {}),
        ...(memory ? { memory: String(memory) } : {}),
        ...(Array.isArray(tags) ? { tags: tags.map(String) } : {}),
        lastUpdated: lastUpdated ? new Date(lastUpdated) : new Date()
      }
    });

    res.status(201).json(asset);
  } catch (_err) {
    res.status(500).json({ error: "Failed to create asset" });
  }
});

router.patch("/:id", requireRole(["Admin"]), async (req, res) => {
  try {
    const asset = await prisma.asset.update({
      where: { id: req.params.id },
      data: {
        ...(req.body.name ? { name: String(req.body.name) } : {}),
        ...(req.body.type ? { type: String(req.body.type) } : {}),
        ...(req.body.ipAddress ? { ipAddress: String(req.body.ipAddress) } : {}),
        ...(req.body.location ? { location: String(req.body.location) } : {}),
        ...(req.body.status ? { status: String(req.body.status) } : {}),
        ...(req.body.os ? { os: String(req.body.os) } : {}),
        ...(req.body.cpu ? { cpu: String(req.body.cpu) } : {}),
        ...(req.body.memory ? { memory: String(req.body.memory) } : {}),
        ...(Array.isArray(req.body.tags) ? { tags: req.body.tags.map(String) } : {}),
        ...(req.body.lastUpdated ? { lastUpdated: new Date(req.body.lastUpdated) } : {})
      }
    });

    res.json(asset);
  } catch (_err) {
    res.status(404).json({ error: "Asset not found" });
  }
});

router.delete("/:id", requireRole(["Admin"]), async (req, res) => {
  try {
    await prisma.asset.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (_err) {
    res.status(404).json({ error: "Asset not found" });
  }
});

module.exports = router;