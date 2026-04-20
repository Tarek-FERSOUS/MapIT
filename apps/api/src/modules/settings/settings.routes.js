const express = require("express");

const { requireAuth, requirePermission } = require("../../middleware/auth.middleware");
const { prisma } = require("../../lib/prisma");

const router = express.Router();

router.use(requireAuth);

function toResponse(settings) {
  return {
    profile: {
      firstName: settings.user?.firstName || "",
      lastName: settings.user?.lastName || "",
      email: settings.user?.email || ""
    },
    notifications: {
      email: settings.notificationsEmail,
      inApp: settings.notificationsInApp,
      critical: settings.notificationsCritical
    },
    theme: settings.theme
  };
}

router.get("/me", requirePermission(["settings:view-own", "settings:view-any"]), async (req, res) => {
  try {
    const settings = await prisma.userSettings.upsert({
      where: { username: String(req.user.username) },
      update: {},
      create: {
        username: String(req.user.username)
      },
      include: {
        user: true
      }
    });

    res.json(toResponse(settings));
  } catch (_err) {
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

router.patch("/me", requirePermission(["settings:update-own", "settings:update-any"]), async (req, res) => {
  try {
    const current = await prisma.userSettings.upsert({
      where: { username: String(req.user.username) },
      update: {},
      create: {
        username: String(req.user.username)
      }
    });

    const settings = await prisma.userSettings.update({
      where: { id: current.id },
      data: {
        ...(typeof req.body?.notifications?.email === "boolean" ? { notificationsEmail: req.body.notifications.email } : {}),
        ...(typeof req.body?.notifications?.inApp === "boolean" ? { notificationsInApp: req.body.notifications.inApp } : {}),
        ...(typeof req.body?.notifications?.critical === "boolean" ? { notificationsCritical: req.body.notifications.critical } : {}),
        ...(req.body?.theme ? { theme: String(req.body.theme) } : {})
      },
      include: {
        user: true
      }
    });

    if (req.body?.profile && typeof req.body.profile === "object") {
      await prisma.user.update({
        where: { username: String(req.user.username) },
        data: {
          ...(typeof req.body.profile.firstName === "string" ? { firstName: req.body.profile.firstName } : {}),
          ...(typeof req.body.profile.lastName === "string" ? { lastName: req.body.profile.lastName } : {}),
          ...(typeof req.body.profile.email === "string" ? { email: req.body.profile.email } : {})
        }
      });
    }

    const fresh = await prisma.userSettings.findUnique({
      where: { id: settings.id },
      include: {
        user: true
      }
    });

    res.json(toResponse(fresh || settings));
  } catch (_err) {
    res.status(500).json({ error: "Failed to update settings" });
  }
});

module.exports = router;