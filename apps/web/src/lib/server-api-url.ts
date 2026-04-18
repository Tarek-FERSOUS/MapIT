export function resolveServerApiUrl() {
  const configured = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;

  if (configured && configured.trim()) {
    return configured.replace(/\/+$/, "");
  }

  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:3002";
  }

  throw new Error("Missing API_URL for server routes. Set API_URL in apps/web environment.");
}