import { readFile, writeFile } from "node:fs/promises";

async function main() {
  const schemaPath = "drizzle/migrations/schema.ts";
  let schema = await readFile(schemaPath, "utf8");

  // Supabase may still contain this historical ORM migration table. Keep it
  // out of the application's Drizzle schema when introspecting the database.
  const legacyTableStart = schema.indexOf(
    'export const prismaMigrations = pgTable("_prisma_migrations", {',
  );
  if (legacyTableStart !== -1) {
    const openBrace = schema.indexOf("{", legacyTableStart);
    let depth = 0;
    let inString = false;
    let escaped = false;
    let closeBrace = -1;
    for (let index = openBrace; index < schema.length; index++) {
      const char = schema[index];
      if (inString) {
        if (escaped) escaped = false;
        else if (char === "\\") escaped = true;
        else if (char === '"' || char === "'") inString = false;
        continue;
      }
      if (char === '"' || char === "'") inString = true;
      else if (char === "{") depth++;
      else if (char === "}" && --depth === 0) {
        closeBrace = index;
        break;
      }
    }
    const statementEnd = schema.indexOf(");", closeBrace);
    if (closeBrace === -1 || statementEnd === -1) {
      throw new Error("Could not safely exclude the historical migration table.");
    }
    let removeEnd = statementEnd + 2;
    if (schema[removeEnd] === "\r") removeEnd++;
    if (schema[removeEnd] === "\n") removeEnd++;
    schema = schema.slice(0, legacyTableStart) + schema.slice(removeEnd);
  }

  const dateTimestamps =
    schema.match(/timestamp\(\{ precision: 3, mode: 'string' \}\)/g) ?? [];
  const generatedIds =
    schema.match(/id: text\(\)\.primaryKey\(\)\.notNull\(\),/g) ?? [];
  if (dateTimestamps.length === 0 || generatedIds.length < 20) {
    throw new Error(
      "Introspected Drizzle schema shape changed; refusing to apply client defaults.",
    );
  }

  schema = schema.replaceAll(
    "timestamp({ precision: 3, mode: 'string' })",
    "timestamp({ precision: 3, mode: 'date' })",
  );
  schema = schema.replaceAll(
    "id: text().primaryKey().notNull(),",
    "id: text().primaryKey().notNull().$defaultFn(() => globalThis.crypto.randomUUID()),",
  );

  await writeFile(schemaPath, schema, "utf8");
  console.info(
    `Prepared Drizzle runtime schema: ${dateTimestamps.length} Date timestamps and ${generatedIds.length} client-generated IDs.`,
  );
}

main().catch((error: unknown) => {
  console.error("[prepare-drizzle-schema]", error);
  process.exitCode = 1;
});
