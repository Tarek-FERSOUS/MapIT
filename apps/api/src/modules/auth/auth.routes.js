const express = require("express");
const jwt = require("jsonwebtoken");
const { authenticateWithAD } = require("./auth.service");
const { requireAuth } = require("../../middleware/auth.middleware");
const { prisma } = require("../../lib/prisma");

const router = express.Router();

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await authenticateWithAD(username, password);
    await prisma.user.upsert({
      where: {
        username: String(user.username)
      },
      update: {},
      create: {
        username: String(user.username)
      }
    });

    const admins = (process.env.ADMIN_USERNAMES || "")
      .split(",")
      .map((name) => name.trim().toLowerCase())
      .filter(Boolean);

    const role = admins.includes(String(user.username).toLowerCase()) ? "Admin" : "User";

    const token = jwt.sign({ ...user, role }, process.env.JWT_SECRET, {
      expiresIn: "1d"
    });

    res.json({ token, role });
  } catch (err) {
    res.status(401).json({ error: err });
  }
});

router.get("/me", requireAuth, (req, res) => {
  res.json({
    username: req.user.username,
    role: req.user.role
  });
});

module.exports = router;