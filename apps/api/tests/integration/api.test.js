const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.AD_URL = process.env.AD_URL || "ldap://dev-ad";
process.env.AD_DOMAIN = process.env.AD_DOMAIN || "example.local";
process.env.DEV_MODE = "true";
process.env.ADMIN_USERNAMES = "admin";
process.env.DATABASE_URL =
  process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/itdocs";

const { createApp } = require("../../src/app");

const app = createApp();

test("GET /health returns 200", async () => {
  const res = await request(app).get("/health");

  assert.equal(res.status, 200);
  assert.match(String(res.text), /API is running/i);
});

test("POST /auth/login rejects missing credentials", async () => {
  const res = await request(app).post("/auth/login").send({ username: "", password: "" });

  assert.equal(res.status, 401);
});

test("POST /auth/login in DEV_MODE succeeds and returns role", async () => {
  const res = await request(app)
    .post("/auth/login")
    .send({ username: "admin", password: "password" });

  assert.equal(res.status, 200);
  assert.equal(res.body.role, "Admin");
  assert.ok(res.body.token);
});

test("PATCH /incidents/:id blocks non-admin role", async () => {
  const token = jwt.sign(
    {
      username: "testuser",
      role: "User"
    },
    process.env.JWT_SECRET
  );

  const res = await request(app)
    .patch("/incidents/non-existent-id")
    .set("Authorization", `Bearer ${token}`)
    .send({ title: "Should fail" });

  assert.equal(res.status, 403);
});
