const express = require("express");

const { requireAuth, requirePermission } = require("../../middleware/auth.middleware");
const { hasRole } = require("../../lib/access-control");
const { prisma } = require("../../lib/prisma");

const router = express.Router();

const INCIDENT_STATUSES = ["OPEN", "IN_PROGRESS", "BLOCKED", "RESOLVED", "CLOSED"];
const INCIDENT_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const STATUS_TRANSITIONS = {
  OPEN: ["IN_PROGRESS", "BLOCKED", "RESOLVED", "CLOSED"],
  IN_PROGRESS: ["BLOCKED", "RESOLVED", "CLOSED"],
  BLOCKED: ["IN_PROGRESS", "RESOLVED", "CLOSED"],
  RESOLVED: ["CLOSED"],
  CLOSED: []
};

const ASSIGNEE_SELECT = {
  id: true,
  username: true,
  firstName: true,
  lastName: true,
  email: true
};

const INCIDENT_INCLUDE = {
  assignedTo: {
    select: ASSIGNEE_SELECT
  }
};

const KNOWLEDGE_STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "into",
  "when",
  "where",
  "what",
  "why",
  "how",
  "incident",
  "issue",
  "problem",
  "error",
  "failed",
  "failure",
  "unable",
  "cannot",
  "can't"
]);

const DEFAULT_SUGGESTION_LIMIT = 5;

router.use(requireAuth);

function toUpperCaseValue(value) {
  return String(value || "").trim().toUpperCase();
}

function normalizePriority(value) {
  const next = toUpperCaseValue(value);
  return INCIDENT_PRIORITIES.includes(next) ? next : "MEDIUM";
}

function normalizeStatus(value) {
  const next = toUpperCaseValue(value);
  return INCIDENT_STATUSES.includes(next) ? next : null;
}

function canTransitionStatus(currentStatus, nextStatus) {
  if (currentStatus === nextStatus) {
    return true;
  }

  return (STATUS_TRANSITIONS[currentStatus] || []).includes(nextStatus);
}

async function logAudit({ actorUsername, targetUsername, action, resource, metadata }) {
  try {
    await prisma.auditLog.create({
      data: {
        actorUsername,
        targetUsername,
        action,
        resource,
        metadata: metadata || undefined
      }
    });
  } catch (_error) {
    // Audit failures should not block the primary write.
  }
}

function requireAllowedStatusRole(req, res, allowedRoles) {
  if (!hasRole(req.access, allowedRoles)) {
    res.status(403).json({ error: "Status changes are restricted for your role" });
    return false;
  }

  return true;
}

async function loadIncidentOr404(id) {
  const incident = await prisma.incident.findUnique({
    where: { id },
    include: INCIDENT_INCLUDE
  });

  return incident;
}

function parseSuggestionLimit(value) {
  const next = Number.parseInt(String(value || ""), 10);

  if (!Number.isFinite(next) || next <= 0) {
    return DEFAULT_SUGGESTION_LIMIT;
  }

  return Math.min(next, 10);
}

function normalizeKnowledgeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ");
}

function tokenizeKnowledgeText(value) {
  return Array.from(
    new Set(
      normalizeKnowledgeText(value)
        .split(/\s+/)
        .map((token) => token.trim())
        .filter((token) => token.length > 2 && !KNOWLEDGE_STOP_WORDS.has(token))
    )
  );
}

function scoreTextSimilarity(queryTokens, text) {
  if (!queryTokens.length) {
    return { score: 0, matches: [] };
  }

  const textTokens = tokenizeKnowledgeText(text);
  if (!textTokens.length) {
    return { score: 0, matches: [] };
  }

  const textSet = new Set(textTokens);
  const matches = queryTokens.filter((token) => textSet.has(token));

  if (matches.length === 0) {
    return { score: 0, matches: [] };
  }

  const coverage = matches.length / queryTokens.length;
  const density = matches.length / textTokens.length;

  return {
    score: Math.min(1, coverage * 0.75 + density * 0.25),
    matches
  };
}

function scoreRecency(dateValue) {
  if (!dateValue) {
    return 0;
  }

  const ageDays = Math.max(0, (Date.now() - new Date(dateValue).getTime()) / 86400000);
  return Math.max(0, 1 - Math.min(ageDays, 365) / 365);
}

function getFeedbackKey(sourceType, sourceId) {
  return `${sourceType}:${sourceId}`;
}

async function loadFeedbackMap() {
  const feedbackRows = await prisma.incidentKnowledgeFeedback.findMany({
    select: {
      sourceType: true,
      sourceId: true,
      helpful: true
    }
  });

  return feedbackRows.reduce((accumulator, row) => {
    const key = getFeedbackKey(row.sourceType, row.sourceId);
    const current = accumulator.get(key) || { helpfulCount: 0, notHelpfulCount: 0 };

    if (row.helpful) {
      current.helpfulCount += 1;
    } else {
      current.notHelpfulCount += 1;
    }

    accumulator.set(key, current);
    return accumulator;
  }, new Map());
}

function buildRankedSuggestion({
  queryTokens,
  item,
  sourceType,
  feedback,
  title,
  description,
  solution,
  status,
  priority,
  createdAt,
  resolvedAt
}) {
  const titleScore = scoreTextSimilarity(queryTokens, title);
  const descriptionScore = scoreTextSimilarity(queryTokens, description);
  const solutionScore = solution ? scoreTextSimilarity(queryTokens, solution) : { score: 0, matches: [] };
  const searchScore = Math.max(titleScore.score * 0.65, descriptionScore.score * 0.85, solutionScore.score);
  const helpfulCount = feedback?.helpfulCount || 0;
  const notHelpfulCount = feedback?.notHelpfulCount || 0;
  const totalFeedback = helpfulCount + notHelpfulCount;
  const helpfulRate = totalFeedback > 0 ? helpfulCount / totalFeedback : 0;
  const feedbackScore = totalFeedback > 0 ? ((helpfulCount - notHelpfulCount) / totalFeedback + 1) / 2 : 0;
  const recencyScore = scoreRecency(resolvedAt || createdAt);
  const statusBoost = sourceType === "problem" && String(status || "").toLowerCase() === "resolved" ? 0.12 : 0.04;
  const solutionBoost = sourceType === "problem" && solution ? 0.08 : 0;
  const totalScore = Math.min(
    1,
    searchScore * 0.62 + feedbackScore * 0.2 + recencyScore * 0.13 + statusBoost + solutionBoost
  );
  const matches = Array.from(
    new Set([...titleScore.matches, ...descriptionScore.matches, ...solutionScore.matches])
  );

  const reasonParts = [];
  if (matches.length > 0) {
    reasonParts.push(`Matched ${matches.slice(0, 3).join(", ")}`);
  }
  if (totalFeedback > 0) {
    reasonParts.push(`${helpfulCount} of ${totalFeedback} users found it helpful`);
  }
  if (sourceType === "problem" && solution) {
    reasonParts.push("Documented solution available");
  }
  if (sourceType === "incident" && String(status || "").toLowerCase() !== "open") {
    reasonParts.push(`Incident marked ${String(status || "").toLowerCase()}`);
  }
  if (priority) {
    reasonParts.push(`Priority ${String(priority).toLowerCase()}`);
  }

  return {
    sourceType,
    sourceId: item.id,
    title,
    description,
    solution: solution || null,
    status: status || null,
    priority: priority || null,
    createdAt,
    resolvedAt: resolvedAt || null,
    score: Math.round(totalScore * 100),
    helpfulCount,
    notHelpfulCount,
    helpfulRate: Number(helpfulRate.toFixed(2)),
    reason: reasonParts.join(" · ") || "Text similarity matched this record"
  };
}

async function buildKnowledgeSuggestions({ title, description, excludeIncidentId = null, limit = DEFAULT_SUGGESTION_LIMIT }) {
  const queryTokens = tokenizeKnowledgeText([title, description].filter(Boolean).join(" "));

  if (queryTokens.length === 0) {
    return {
      solutions: [],
      similarIncidents: []
    };
  }

  const [incidents, problems, feedbackMap] = await Promise.all([
    prisma.incident.findMany({
      where: {
        ...(excludeIncidentId ? { id: { not: excludeIncidentId } } : {})
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        createdAt: true
      }
    }),
    prisma.problem.findMany({
      where: {
        solution: {
          not: null
        }
      },
      select: {
        id: true,
        title: true,
        description: true,
        severity: true,
        status: true,
        solution: true,
        createdAt: true,
        resolvedAt: true
      }
    }),
    loadFeedbackMap()
  ]);

  const solutions = problems
    .map((problem) => buildRankedSuggestion({
      queryTokens,
      item: problem,
      sourceType: "problem",
      feedback: feedbackMap.get(getFeedbackKey("problem", problem.id)),
      title: problem.title,
      description: problem.description,
      solution: problem.solution,
      status: problem.status,
      priority: problem.severity,
      createdAt: problem.createdAt,
      resolvedAt: problem.resolvedAt
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);

  const similarIncidents = incidents
    .map((incident) => buildRankedSuggestion({
      queryTokens,
      item: incident,
      sourceType: "incident",
      feedback: feedbackMap.get(getFeedbackKey("incident", incident.id)),
      title: incident.title,
      description: incident.description,
      solution: null,
      status: incident.status,
      priority: incident.priority,
      createdAt: incident.createdAt,
      resolvedAt: null
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);

  return {
    solutions,
    similarIncidents
  };
}

router.get("/knowledge-suggestions", requirePermission(["incident:view"]), async (req, res) => {
  try {
    const title = String(req.query?.title || "");
    const description = String(req.query?.description || "");
    const limit = parseSuggestionLimit(req.query?.limit);
    const suggestions = await buildKnowledgeSuggestions({ title, description, limit });

    res.json({
      query: { title, description },
      ...suggestions
    });
  } catch (_err) {
    res.status(500).json({ error: "Failed to load knowledge suggestions" });
  }
});

router.get("/:id/knowledge-suggestions", requirePermission(["incident:view"]), async (req, res) => {
  try {
    const incident = await loadIncidentOr404(req.params.id);

    if (!incident) {
      return res.status(404).json({ error: "Incident not found" });
    }

    const limit = parseSuggestionLimit(req.query?.limit);
    const suggestions = await buildKnowledgeSuggestions({
      title: incident.title,
      description: incident.description,
      excludeIncidentId: incident.id,
      limit
    });

    res.json({
      incidentId: incident.id,
      query: {
        title: incident.title,
        description: incident.description
      },
      ...suggestions
    });
  } catch (_err) {
    res.status(500).json({ error: "Failed to load incident suggestions" });
  }
});

router.post("/:id/knowledge-feedback", requirePermission(["incident:view"]), async (req, res) => {
  try {
    const incident = await loadIncidentOr404(req.params.id);

    if (!incident) {
      return res.status(404).json({ error: "Incident not found" });
    }

    const sourceType = String(req.body?.sourceType || "").trim().toLowerCase();
    const sourceId = String(req.body?.sourceId || "").trim();
    const helpful = req.body?.helpful;

    if (!sourceType || !["incident", "problem"].includes(sourceType)) {
      return res.status(400).json({ error: "sourceType must be incident or problem" });
    }

    if (!sourceId) {
      return res.status(400).json({ error: "sourceId is required" });
    }

    if (typeof helpful !== "boolean") {
      return res.status(400).json({ error: "helpful must be a boolean" });
    }

    const user = await prisma.user.findUnique({
      where: { username: req.user?.username },
      select: { id: true }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (sourceType === "problem") {
      const problem = await prisma.problem.findUnique({
        where: { id: sourceId },
        select: { id: true, solution: true }
      });

      if (!problem || !problem.solution) {
        return res.status(404).json({ error: "Problem solution not found" });
      }
    } else {
      const sourceIncident = await prisma.incident.findUnique({
        where: { id: sourceId },
        select: { id: true }
      });

      if (!sourceIncident) {
        return res.status(404).json({ error: "Incident suggestion not found" });
      }
    }

    await prisma.incidentKnowledgeFeedback.upsert({
      where: {
        incidentId_sourceType_sourceId_userId: {
          incidentId: req.params.id,
          sourceType,
          sourceId,
          userId: user.id
        }
      },
      update: {
        helpful
      },
      create: {
        incidentId: req.params.id,
        sourceType,
        sourceId,
        userId: user.id,
        helpful
      }
    });

    res.json({ success: true });
  } catch (_err) {
    res.status(500).json({ error: "Failed to save feedback" });
  }
});

router.get("/assignees", requirePermission(["incident:assign"]), async (_req, res) => {
  try {
    const assignees = await prisma.user.findMany({
      orderBy: { username: "asc" },
      select: ASSIGNEE_SELECT
    });

    res.json({ items: assignees });
  } catch (_err) {
    res.status(500).json({ error: "Failed to load assignable users" });
  }
});

router.get("/", requirePermission(["incident:view"]), async (_req, res) => {
  try {
    const incidents = await prisma.incident.findMany({
      orderBy: {
        createdAt: "desc"
      },
      include: INCIDENT_INCLUDE
    });

    res.json({ items: incidents });
  } catch (_err) {
    res.status(500).json({ error: "Failed to fetch incidents" });
  }
});

router.get("/:id", requirePermission(["incident:view"]), async (req, res) => {
  try {
    const incident = await loadIncidentOr404(req.params.id);

    if (!incident) {
      return res.status(404).json({ error: "Incident not found" });
    }

    res.json(incident);
  } catch (_err) {
    res.status(500).json({ error: "Failed to fetch incident" });
  }
});

router.post("/", requirePermission(["incident:create"]), async (req, res) => {
  const { title, description, assignedTeam } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: "title and description are required" });
  }

  try {
    const incident = await prisma.incident.create({
      data: {
        title: String(title),
        description: String(description),
        status: "OPEN",
        priority: normalizePriority(req.body.priority),
        ...(typeof assignedTeam === "string" && assignedTeam.trim() ? { assignedTeam: assignedTeam.trim() } : {})
      },
      include: INCIDENT_INCLUDE
    });

    res.status(201).json(incident);
  } catch (_err) {
    res.status(500).json({ error: "Failed to create incident" });
  }
});

router.patch("/:id", requirePermission(["incident:update"]), async (req, res) => {
  const updates = {};

  if (typeof req.body?.title === "string" && req.body.title.trim()) {
    updates.title = req.body.title.trim();
  }

  if (typeof req.body?.description === "string" && req.body.description.trim()) {
    updates.description = req.body.description.trim();
  }

  if (typeof req.body?.priority !== "undefined") {
    updates.priority = normalizePriority(req.body.priority);
  }

  if (typeof req.body?.assignedTeam !== "undefined") {
    updates.assignedTeam = typeof req.body.assignedTeam === "string" && req.body.assignedTeam.trim() ? req.body.assignedTeam.trim() : null;
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: "No fields to update" });
  }

  try {
    const incident = await prisma.incident.update({
      where: {
        id: req.params.id
      },
      data: updates,
      include: INCIDENT_INCLUDE
    });

    res.json(incident);
  } catch (_err) {
    res.status(404).json({ error: "Incident not found" });
  }
});

router.delete("/:id", requirePermission(["incident:delete"]), async (req, res) => {
  try {
    const existing = await prisma.incident.findUnique({
      where: { id: req.params.id },
      include: INCIDENT_INCLUDE
    });

    if (!existing) {
      return res.status(404).json({ error: "Incident not found" });
    }

    await prisma.incident.delete({
      where: { id: req.params.id }
    });

    await logAudit({
      actorUsername: req.user?.username,
      action: "incident.deleted",
      resource: `incident:${existing.id}`,
      metadata: {
        title: existing.title,
        status: existing.status,
        priority: existing.priority,
        assignedToUsername: existing.assignedTo?.username || null
      }
    });

    res.json({ success: true });
  } catch (_err) {
    res.status(500).json({ error: "Failed to delete incident" });
  }
});

router.patch("/:id/status", requirePermission(["incident:status:update"]), async (req, res) => {
  if (!requireAllowedStatusRole(req, res, ["admin", "manager", "operator"])) {
    return;
  }

  const nextStatus = normalizeStatus(req.body?.status);
  if (!nextStatus) {
    return res.status(400).json({ error: "Invalid incident status" });
  }

  try {
    const current = await prisma.incident.findUnique({
      where: { id: req.params.id }
    });

    if (!current) {
      return res.status(404).json({ error: "Incident not found" });
    }

    if (!canTransitionStatus(current.status, nextStatus)) {
      return res.status(400).json({
        error: `Invalid status transition from ${current.status} to ${nextStatus}`
      });
    }

    if (current.status === nextStatus) {
      return res.json(await loadIncidentOr404(req.params.id));
    }

    const updated = await prisma.incident.update({
      where: { id: req.params.id },
      data: { status: nextStatus },
      include: INCIDENT_INCLUDE
    });

    await logAudit({
      actorUsername: req.user?.username,
      action: "incident.status.changed",
      resource: `incident:${updated.id}`,
      metadata: {
        from: current.status,
        to: nextStatus
      }
    });

    res.json(updated);
  } catch (_err) {
    res.status(500).json({ error: "Failed to update incident status" });
  }
});

router.patch("/:id/assignment", requirePermission(["incident:assign"]), async (req, res) => {
  if (!requireAllowedStatusRole(req, res, ["admin", "manager"])) {
    return;
  }

  const hasUserField = Object.prototype.hasOwnProperty.call(req.body || {}, "assignedToUserId");
  const hasTeamField = Object.prototype.hasOwnProperty.call(req.body || {}, "assignedTeam");

  if (!hasUserField && !hasTeamField) {
    return res.status(400).json({ error: "No assignment changes provided" });
  }

  try {
    const current = await prisma.incident.findUnique({
      where: { id: req.params.id },
      include: {
        assignedTo: {
          select: ASSIGNEE_SELECT
        }
      }
    });

    if (!current) {
      return res.status(404).json({ error: "Incident not found" });
    }

    const updateData = {};
    let nextAssigneeId = current.assignedToUserId;
    let nextAssignedTeam = current.assignedTeam;

    if (hasUserField) {
      const providedUserId = req.body.assignedToUserId;
      if (providedUserId === null || providedUserId === "") {
        nextAssigneeId = null;
      } else {
        const assignee = await prisma.user.findUnique({
          where: { id: String(providedUserId) },
          select: ASSIGNEE_SELECT
        });

        if (!assignee) {
          return res.status(404).json({ error: "Assignee not found" });
        }

        nextAssigneeId = assignee.id;
      }
      updateData.assignedToUserId = nextAssigneeId;
    }

    if (hasTeamField) {
      nextAssignedTeam = typeof req.body.assignedTeam === "string" && req.body.assignedTeam.trim() ? req.body.assignedTeam.trim() : null;
      updateData.assignedTeam = nextAssignedTeam;
    }

    const updated = await prisma.incident.update({
      where: { id: req.params.id },
      data: updateData,
      include: INCIDENT_INCLUDE
    });

    await logAudit({
      actorUsername: req.user?.username,
      action: "incident.assignment.changed",
      resource: `incident:${updated.id}`,
      metadata: {
        fromAssignedToUserId: current.assignedToUserId,
        toAssignedToUserId: updated.assignedToUserId,
        fromAssignedToUsername: current.assignedTo?.username || null,
        toAssignedToUsername: updated.assignedTo?.username || null,
        fromAssignedTeam: current.assignedTeam,
        toAssignedTeam: updated.assignedTeam
      }
    });

    res.json(updated);
  } catch (_err) {
    res.status(500).json({ error: "Failed to update incident assignment" });
  }
});

module.exports = router;
