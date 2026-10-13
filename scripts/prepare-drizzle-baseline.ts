import { readFile, writeFile } from "node:fs/promises";

async function main() {
  const sourcePath =
    "prisma/postgresql/migrations/20261012180000_initial_postgresql/migration.sql";
  const journalPath = "drizzle/migrations/meta/_journal.json";
  const source = (await readFile(sourcePath, "utf8")).trim();
  const journal = JSON.parse(await readFile(journalPath, "utf8")) as {
    entries: { idx: number; tag: string }[];
  };
  const baseline = journal.entries.find((entry) => entry.idx === 0);
  if (!baseline) throw new Error("Drizzle migration journal has no baseline entry.");

  const statements = source
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);
  if (statements.length < 60) {
    throw new Error("Existing PostgreSQL baseline SQL was unexpectedly short.");
  }

  await writeFile(
    `drizzle/migrations/${baseline.tag}.sql`,
    `${statements.join(";\n--> statement-breakpoint\n")};\n`,
    "utf8",
  );
  console.info(
    `Created Drizzle baseline ${baseline.tag} from the previously applied PostgreSQL schema.`,
  );
}

main().catch((error: unknown) => {
  console.error("[prepare-drizzle-baseline]", error);
  process.exitCode = 1;
});
