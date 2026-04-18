const required = ["NODE_ENV", "API_URL"];
const recommended = ["NEXT_PUBLIC_API_URL"];

function validate() {
  const missing = required.filter((key) => !process.env[key] || !String(process.env[key]).trim());

  if (missing.length > 0) {
    console.error("[preflight] Missing required WEB environment variables:");
    for (const key of missing) {
      console.error(`  - ${key}`);
    }
    console.error("[preflight] Populate apps/web/.env.local (or service EnvironmentFile) before start.");
    process.exit(1);
  }

  const apiUrl = String(process.env.API_URL || "");

  if (String(process.env.NODE_ENV).toLowerCase() === "production") {
    if (/localhost|127\.0\.0\.1/.test(apiUrl)) {
      console.error("[preflight] API_URL points to localhost in production. Use API VM private DNS/IP.");
      process.exit(1);
    }
  }

  console.log("[preflight] WEB environment checks passed.");
  for (const key of required) {
    console.log(`  - ${key}: ${process.env[key]}`);
  }

  for (const key of recommended) {
    if (!process.env[key]) {
      console.warn(`  - ${key}: not set (recommended)`);
    }
  }
}

validate();
