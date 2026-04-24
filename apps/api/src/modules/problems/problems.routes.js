const express = require("express");

const { requireAuth, requirePermission } = require("../../middleware/auth.middleware");
const { prisma } = require("../../lib/prisma");

const router = express.Router();

router.use(requireAuth);

router.get("/", requirePermission(["problem:view"]), async (_req, res) => {
  try {
    const problems = await prisma.problem.findMany({
      orderBy: [{ createdAt: "desc" }]
    });

    res.json({ items: problems });
  } catch (_err) {
    res.status(500).json({ error: "Failed to fetch problems" });
  }
});

router.get("/:id", requirePermission(["problem:view"]), async (req, res) => {
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

router.post("/", requirePermission(["problem:create"]), async (req, res) => {
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

router.patch("/:id", requirePermission(["problem:update"]), async (req, res) => {
  const updates = {};

  if (Object.prototype.hasOwnProperty.call(req.body || {}, "title")) {
    const nextTitle = String(req.body.title || "").trim();
    if (!nextTitle) {
      return res.status(400).json({ error: "title cannot be empty" });
    }
    updates.title = nextTitle;
  }

  if (Object.prototype.hasOwnProperty.call(req.body || {}, "description")) {
    const nextDescription = String(req.body.description || "").trim();
    if (!nextDescription) {
      return res.status(400).json({ error: "description cannot be empty" });
    }
    updates.description = nextDescription;
  }

  if (Array.isArray(req.body?.affectedAssets)) {
    updates.affectedAssets = req.body.affectedAssets.map(String);
  }

  if (Object.prototype.hasOwnProperty.call(req.body || {}, "severity")) {
    updates.severity = String(req.body.severity);
  }

  if (Object.prototype.hasOwnProperty.call(req.body || {}, "status")) {
    updates.status = String(req.body.status);
    if (updates.status === "resolved") {
      updates.resolvedAt = req.body.resolvedAt ? new Date(req.body.resolvedAt) : new Date();
    } else {
      updates.resolvedAt = null;
    }
  }

  if (Object.prototype.hasOwnProperty.call(req.body || {}, "solution")) {
    const nextSolution = String(req.body.solution || "").trim();
    updates.solution = nextSolution || null;
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: "No fields to update" });
  }

  try {
    const problem = await prisma.problem.update({
      where: { id: req.params.id },
      data: updates
    });

    res.json(problem);
  } catch (_err) {
    res.status(404).json({ error: "Problem not found" });
  }
});

router.delete("/:id", requirePermission(["problem:delete"]), async (req, res) => {
  try {
    await prisma.problem.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (_err) {
    res.status(404).json({ error: "Problem not found" });
  }
});

module.exports = router;