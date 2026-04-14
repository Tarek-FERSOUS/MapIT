const express = require("express");

const { requireAuth, requireRole } = require("../../middleware/auth.middleware");
const { prisma } = require("../../lib/prisma");

const router = express.Router();

router.use(requireAuth);

router.get("/", async (_req, res) => {
  try {
    const problems = await prisma.problem.findMany({
      orderBy: [{ createdAt: "desc" }]
    });

    res.json({ items: problems });
  } catch (_err) {
    res.status(500).json({ error: "Failed to fetch problems" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const problem = await prisma.problem.findUnique({ where: { id: req.params.id } });

    if (!problem) {
      return res.status(404).json({ error: "Problem not found" });
    }

    res.json(problem);
  } catch (_err) {
    res.status(500).json({ error: "Failed to fetch problem" });
  }
});

router.post("/", requireRole(["Admin"]), async (req, res) => {
  const { title, description, affectedAssets, severity, status, solution, resolvedAt } = req.body;

  if (!title || !description || !severity || !status) {
    return res.status(400).json({ error: "title, description, severity and status are required" });
  }

  try {
    const problem = await prisma.problem.create({
      data: {
        title: String(title),
        description: String(description),
        affectedAssets: Array.isArray(affectedAssets) ? affectedAssets.map(String) : [],
        severity: String(severity),
        status: String(status),
        ...(solution ? { solution: String(solution) } : {}),
        ...(status === "resolved" ? { resolvedAt: resolvedAt ? new Date(resolvedAt) : new Date() } : {})
      }
    });

    res.status(201).json(problem);
  } catch (_err) {
    res.status(500).json({ error: "Failed to create problem" });
  }
});

router.patch("/:id", requireRole(["Admin"]), async (req, res) => {
  try {
    const problem = await prisma.problem.update({
      where: { id: req.params.id },
      data: {
        ...(req.body.title ? { title: String(req.body.title) } : {}),
        ...(req.body.description ? { description: String(req.body.description) } : {}),
        ...(Array.isArray(req.body.affectedAssets) ? { affectedAssets: req.body.affectedAssets.map(String) } : {}),
        ...(req.body.severity ? { severity: String(req.body.severity) } : {}),
        ...(req.body.status ? { status: String(req.body.status) } : {}),
        ...(req.body.solution ? { solution: String(req.body.solution) } : {}),
        ...(req.body.status === "resolved"
          ? { resolvedAt: req.body.resolvedAt ? new Date(req.body.resolvedAt) : new Date() }
          : req.body.status
          ? { resolvedAt: null }
          : {})
      }
    });

    res.json(problem);
  } catch (_err) {
    res.status(404).json({ error: "Problem not found" });
  }
});

router.delete("/:id", requireRole(["Admin"]), async (req, res) => {
  try {
    await prisma.problem.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (_err) {
    res.status(404).json({ error: "Problem not found" });
  }
});

module.exports = router;