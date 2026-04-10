const fs = require("node:fs");
const path = require("node:path");

const requiredFiles = [
  "app/login.tsx",
  "app/index.tsx",
  "app/incidents/index.tsx",
  "app/incidents/new.tsx",
  "app/incidents/[id].tsx",
  "app/documents/index.tsx",
  "app/documents/new.tsx",
  "app/documents/[id].tsx",
  "services/api.js",
  "store/authStore.js"
];

const rootDir = process.cwd();
const missing = requiredFiles.filter((filePath) => !fs.existsSync(path.join(rootDir, filePath)));

if (missing.length) {
  console.error("Frontend smoke check failed. Missing files:");
  missing.forEach((item) => console.error(`- ${item}`));
  process.exit(1);
}

console.log("Frontend smoke check passed.");
