import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Pool } from "pg";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required.");

  const journal = JSON.parse(
    await readFile("drizzle/migrations/meta/_journal.json", "utf8"),
  ) as { entries: { idx: number; tag: string; when: number }[] };
  const baseline = journal.entries.find((entry) => entry.idx === 0);
  if (!baseline) throw new Error("No Drizzle baseline migration was found.");
  const migrationSql = await readFile(
    `drizzle/migrations/${baseline.tag}.sql`,
    "utf8",
  );
  const checksum = createHash("sha256").update(migrationSql).digest("hex");
  const pool = new Pool({ connectionString, max: 1, connectionTimeoutMillis: 15_000 });
  const client = await pool.connect();

  try {
    const tables = await client.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`,
    );
    if (tables.rowCount !== 31) {
      throw new Error(
        `Expected the migrated 31-table Supabase schema; found ${tables.rowCount}.`,
      );
    }

    await client.query("BEGIN");
    await client.query(`CREATE SCHEMA IF NOT EXISTS "drizzle"`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
        "id" SERIAL PRIMARY KEY,
        "hash" TEXT NOT NULL,
        "created_at" BIGINT
      )
    `);
    const existing = await client.query<{ hash: string; created_at: string }>(
      `SELECT hash, created_at FROM "drizzle"."__drizzle_migrations"
       ORDER BY created_at DESC LIMIT 1`,
    );
    if (existing.rows.length > 0) {
      const last = existing.rows[0];
      if (last.hash !== checksum || Number(last.created_at) !== baseline.when) {
        throw new Error("Drizzle migration history already exists and does not match this baseline.");
      }
      await client.query("ROLLBACK");
      console.info("Drizzle baseline is already recorded; no changes made.");
      return;
    }

    await client.query(
      `INSERT INTO "drizzle"."__drizzle_migrations" ("hash", "created_at") VALUES ($1, $2)`,
      [checksum, baseline.when],
    );
    await client.query("COMMIT");
    console.info("Recorded the existing Supabase schema as the Drizzle baseline.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error("[mark-drizzle-baseline]", error);
  process.exitCode = 1;
});
