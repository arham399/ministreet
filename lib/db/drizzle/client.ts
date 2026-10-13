import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/lib/db/drizzle/schema";

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to connect to Supabase PostgreSQL.");
  }

  const pool = new Pool({
    connectionString,
    connectionTimeoutMillis: 10_000,
    max: 5,
  });

  return {
    db: drizzle(pool, { schema }),
    pool,
  };
}

type DrizzleClient = ReturnType<typeof createClient>;
const globalForDrizzle = globalThis as typeof globalThis & {
  miniStreetDrizzle?: DrizzleClient;
};

export function getDrizzleClient() {
  globalForDrizzle.miniStreetDrizzle ??= createClient();
  return globalForDrizzle.miniStreetDrizzle;
}
