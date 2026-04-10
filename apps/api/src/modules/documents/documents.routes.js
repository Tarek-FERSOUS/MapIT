const express = require("express");

const { requireAuth, requireRole } = require("../../middleware/auth.middleware");
const { prisma } = require("../../lib/prisma");

const router = express.Router();

router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const searchQuery = String(req.query.q || "").trim();

    const documents = await prisma.document.findMany({
      where: searchQuery
        ? {
            OR: [
              {
                title: {
                  contains: searchQuery,
                  mode: "insensitive"
                }
              },
              {
                content: {
                  contains: searchQuery,
                  mode: "insensitive"
                }
              }
            ]
          }
        : undefined,
      orderBy: {
        createdAt: "desc"
      }
    });

    res.json({ items: documents });
  } catch (_err) {
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const document = await prisma.document.findUnique({
      where: {
        id: req.params.id
      }
    });

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    res.json(document);
  } catch (_err) {
    res.status(500).json({ error: "Failed to fetch document" });
  }
});

router.post("/", async (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: "title and content are required" });
  }

  try {
    const document = await prisma.document.create({
      data: {
        title: String(title),
        content: String(content)
      }
    });

    res.status(201).json(document);
  } catch (_err) {
    res.status(500).json({ error: "Failed to create document" });
  }
});

router.patch("/:id", requireRole(["Admin"]), async (req, res) => {
  const { title, content } = req.body;

  if (!title && !content) {
    return res.status(400).json({ error: "No fields to update" });
  }

  try {
    const document = await prisma.document.update({
      where: {
        id: req.params.id
      },
      data: {
        ...(title ? { title: String(title) } : {}),
        ...(content ? { content: String(content) } : {})
      }
    });

    res.json(document);
  } catch (_err) {
    res.status(404).json({ error: "Document not found" });
  }
});

router.delete("/:id", requireRole(["Admin"]), async (req, res) => {
  try {
    await prisma.document.delete({
      where: {
        id: req.params.id
      }
    });

    res.json({ success: true });
  } catch (_err) {
    res.status(404).json({ error: "Document not found" });
  }
});

module.exports = router;
