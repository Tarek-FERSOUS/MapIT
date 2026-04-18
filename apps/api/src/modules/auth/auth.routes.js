const express = require("express");
const jwt = require("jsonwebtoken");
const { authenticateWithAD } = require("./auth.service");
const { requireAuth } = require("../../middleware/auth.middleware");
const { prisma } = require("../../lib/prisma");

const router = express.Router();

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  let user;
  try {
    user = await authenticateWithAD(username, password);
  } catch (_err) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  try {
    await prisma.user.upsert({
      where: {
        username: String(user.username)
      },
      update: {},
      create: {
        username: String(user.username)
      }
    });
  } catch (err) {
    console.error("Login persistence error:", err);
    return res.status(500).json({ error: "Login failed due to server configuration" });
  }

  try {
    const admins = (process.env.ADMIN_USERNAMES || "")
      .split(",")
      .map((name) => name.trim().toLowerCase())
      .filter(Boolean);

    const role = admins.includes(String(user.username).toLowerCase()) ? "Admin" : "User";

    const token = jwt.sign({ ...user, role }, process.env.JWT_SECRET, {
      expiresIn: "1d"
    });

    return res.json({ token, role });
  } catch (err) {
    console.error("Login token error:", err);
    return res.status(500).json({ error: "Login failed due to server configuration" });
  }
});

router.get("/me", requireAuth, (req, res) => {
  res.json({
    username: req.user.username,
    role: req.user.role
  });
});

module.exports = router;