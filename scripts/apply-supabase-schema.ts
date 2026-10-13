import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";

const migrationName = "20261012180000_initial_postgresql";
const migrationPath = path.join(
  process.cwd(),
  "prisma",
  "postgresql",
  "migrations",
  migrationName,
  "migration.sql",
);

async function main() {
  const connectionString = process.env.DIRECT_URL;
  if (!connectionString) {
    throw new Error("DIRECT_URL is required to apply the Supabase schema.");
  }
  const migrationSql = await readFile(migrationPath, "utf8");
  const checksum = createHash("sha256").update(migrationSql).digest("hex");
  const pool = new Pool({
    connectionString,
    connectionTimeoutMillis: 10_000,
    max: 1,
  });
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const existing = await client.query<{ table_name: string }>(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
       ORDER BY table_name`,
    );
    if (existing.rowCount !== 0) {
      throw new Error(
        `Refusing to apply the baseline to a non-empty schema (${existing.rowCount} public tables found).`,
      );
    }

    await client.query(migrationSql);
    await client.query(`
      CREATE TABLE "_prisma_migrations" (
        "id" VARCHAR(36) NOT NULL PRIMARY KEY,
        "checksum" VARCHAR(64) NOT NULL,
        "finished_at" TIMESTAMPTZ,
        "migration_name" VARCHAR(255) NOT NULL,
        "logs" TEXT,
        "rolled_back_at" TIMESTAMPTZ,
        "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "applied_steps_count" INTEGER NOT NULL DEFAULT 0
      )
    `);
    await client.query(
      `INSERT INTO "_prisma_migrations"
         ("id", "checksum", "finished_at", "migration_name", "started_at", "applied_steps_count")
       VALUES ($1, $2, now(), $3, now(), 1)`,
      [randomUUID(), checksum, migrationName],
    );
    await client.query("COMMIT");
    console.info(
      `Applied the existing PostgreSQL baseline (${migrationName}) using the Drizzle PostgreSQL driver.`,
    );
    console.info("The baseline checksum is recorded so Prisma remains available as a rollback path.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error("[apply-supabase-schema]", error);
  process.exitCode = 1;
});
