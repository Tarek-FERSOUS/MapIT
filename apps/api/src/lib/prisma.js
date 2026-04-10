const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const globalForPrisma = global;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
const adapter = new PrismaPg(pool);

const prisma =
  globalForPrisma.__mapitPrisma ||
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__mapitPrisma = prisma;
}

module.exports = {
  prisma
};
