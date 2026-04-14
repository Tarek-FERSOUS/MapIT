require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./modules/auth/auth.routes");
const incidentsRoutes = require("./modules/incidents/incidents.routes");
const documentsRoutes = require("./modules/documents/documents.routes");
const dashboardRoutes = require("./modules/dashboard/dashboard.routes");
const assetsRoutes = require("./modules/assets/assets.routes");
const problemsRoutes = require("./modules/problems/problems.routes");
const relationshipsRoutes = require("./modules/relationships/relationships.routes");
const settingsRoutes = require("./modules/settings/settings.routes");
const reportsRoutes = require("./modules/reports/reports.routes");
const notificationsRoutes = require("./modules/notifications/notifications.routes");

function getRequiredEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function createApp() {
  const app = express();

  const JWT_SECRET = getRequiredEnv("JWT_SECRET");
  const AD_URL = getRequiredEnv("AD_URL");
  const AD_DOMAIN = process.env.AD_DOMAIN || "yourcompany.local";

  app.locals.config = {
    JWT_SECRET,
    AD_URL,
    AD_DOMAIN
  };

  app.use(cors());
  app.use(express.json());

  app.use("/auth", authRoutes);
  app.use("/incidents", incidentsRoutes);
  app.use("/documents", documentsRoutes);
  app.use("/dashboard", dashboardRoutes);
  app.use("/assets", assetsRoutes);
  app.use("/problems", problemsRoutes);
  app.use("/relationships", relationshipsRoutes);
  app.use("/settings", settingsRoutes);
  app.use("/reports", reportsRoutes);
  app.use("/notifications", notificationsRoutes);

  app.get("/health", (_req, res) => {
    res.send("API is running");
  });

  return app;
}

module.exports = {
  createApp,
  getRequiredEnv
};