const required = [
  "NODE_ENV",
  "PORT",
  "JWT_SECRET",
  "AD_URL",
  "AD_DOMAIN",
  "DN_BASE",
  "BIND_DN",
  "DATABASE_URL"
];

const optional = ["CORS_ORIGIN", "ADMIN_USERNAMES", "DEV_MODE"];

function sanitize(value) {
  if (!value) return "<missing>";
  return value;
}

function validate() {
  const missing = required.filter((key) => !process.env[key] || !String(process.env[key]).trim());

  if (missing.length > 0) {
    console.error("[preflight] Missing required API environment variables:");
    for (const key of missing) {
      console.error(`  - ${key}`);
    }
    console.error("[preflight] Populate apps/api/.env before starting in production.");
    process.exit(1);
  }

  if (String(process.env.NODE_ENV).toLowerCase() === "production") {
    if (process.env.DEV_MODE === "true") {
      console.error("[preflight] DEV_MODE=true is not allowed in production.");
      process.exit(1);
    }

    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 24) {
      console.error("[preflight] JWT_SECRET must be at least 24 characters in production.");
      process.exit(1);
    }
  }

  console.log("[preflight] API environment checks passed.");
  console.log("[preflight] Required values loaded:");
  for (const key of required) {
    console.log(`  - ${key}: ${key === "JWT_SECRET" ? "<set>" : sanitize(process.env[key])}`);
  }

  for (const key of optional) {
    if (process.env[key]) {
      console.log(`  - ${key}: ${sanitize(process.env[key])}`);
    }
  }
}

validate();
