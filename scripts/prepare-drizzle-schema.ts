import { readFile, writeFile } from "node:fs/promises";

async function main() {
  const schemaPath = "drizzle/migrations/schema.ts";
  let schema = await readFile(schemaPath, "utf8");

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
