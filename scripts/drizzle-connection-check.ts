import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { sql } from "drizzle-orm";

const connections = [
  ["DATABASE_URL", process.env.DATABASE_URL],
  ["DIRECT_URL", process.env.DIRECT_URL],
] as const;

async function main() {
  let failed = false;

  for (const [name, connectionString] of connections) {
    if (!connectionString) {
      console.error(`[${name}] is missing.`);
      failed = true;
      continue;
    }

    let endpoint: string = name;
    try {
      const url = new URL(connectionString);
      endpoint = `${name} (${url.hostname}:${url.port || "5432"})`;
    } catch {
      console.error(`[${name}] is not a valid PostgreSQL URL.`);
      failed = true;
      continue;
    }

    const pool = new Pool({
      connectionString,
      connectionTimeoutMillis: 10_000,
      max: 1,
    });

    try {
      const db = drizzle(pool);
      const result = await db.execute(sql`SELECT 1 AS connected`);
      console.info(`${endpoint}: connected; read-only query returned ${result.rows.length} row.`);
      if (name === "DATABASE_URL") {
        const tables = await db.execute<{ table_name: string }>(
          sql`SELECT table_name FROM information_schema.tables
              WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
              ORDER BY table_name`,
        );
        console.info(`Supabase public tables: ${tables.rows.length}.`);
      }
    } catch (error) {
      failed = true;
      const code =
        typeof error === "object" && error !== null && "code" in error
          ? ` (code ${String(error.code)})`
          : "";
      console.error(`${endpoint}: connection failed${code}.`);
      console.error(
        error instanceof Error ? error.message : "Unknown connection error.",
      );
    } finally {
      await pool.end();
    }
  }

  if (failed) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error("Drizzle connection check failed unexpectedly.", error);
  process.exitCode = 1;
});
