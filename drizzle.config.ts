import "dotenv/config";
import { defineConfig } from "drizzle-kit";

if (!process.env.DIRECT_URL) {
  throw new Error("DIRECT_URL is required for Drizzle schema introspection.");
}

export default defineConfig({
  schema: "./drizzle/migrations/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DIRECT_URL,
  },
  migrations: {
    schema: "drizzle",
    table: "__drizzle_migrations",
  },
  schemaFilter: ["public"],
});
