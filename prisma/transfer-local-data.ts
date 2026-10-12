import { existsSync } from "node:fs";
import path from "node:path";
import { Prisma as PostgresPrisma, PrismaClient as PostgresClient } from "@prisma/client";
import {
  Prisma as SqlitePrisma,
  PrismaClient as SqliteClient,
} from "@prisma/sqlite-client";

type DataRow = Record<string, unknown>;

const configuredSourceUrl =
  process.env.LOCAL_SQLITE_DATABASE_URL ?? "file:prisma/dev.db";
const dryRun = process.argv.includes("--dry-run");

function quoteIdentifier(identifier: string) {
  return `"${identifier.replaceAll('"', '""')}"`;
}

function scalarFields(model: (typeof PostgresPrisma.dmmf.datamodel.models)[number]) {
  return model.fields.filter((field) => field.kind === "scalar" || field.kind === "enum");
}

function verifySchemaParity() {
  const sqliteModels = new Map(
    SqlitePrisma.dmmf.datamodel.models.map((model) => [model.name, model]),
  );

  if (sqliteModels.size !== PostgresPrisma.dmmf.datamodel.models.length) {
    throw new Error("Local SQLite and Supabase schemas have different model counts.");
  }

  for (const postgresModel of PostgresPrisma.dmmf.datamodel.models) {
    const sqliteModel = sqliteModels.get(postgresModel.name);
    if (!sqliteModel) {
      throw new Error(`The local SQLite schema is missing model ${postgresModel.name}.`);
    }

    const sqliteFields = new Map(
      scalarFields(sqliteModel).map((field) => [field.name, field.type]),
    );
    for (const postgresField of scalarFields(postgresModel)) {
      if (sqliteFields.get(postgresField.name) !== postgresField.type) {
        throw new Error(
          `Local SQLite field ${postgresModel.name}.${postgresField.name} does not match the Supabase schema.`,
        );
      }
      sqliteFields.delete(postgresField.name);
    }
    if (sqliteFields.size > 0) {
      throw new Error(
        `Local SQLite model ${postgresModel.name} has fields missing from the Supabase schema.`,
      );
    }
  }
}

function dependencies(model: (typeof PostgresPrisma.dmmf.datamodel.models)[number]) {
  return model.fields
    .filter(
      (field) =>
        field.kind === "object" && (field.relationFromFields?.length ?? 0) > 0,
    )
    .map((field) => field.type)
    .filter((name) => name !== model.name);
}

function orderedModels() {
  const pending = new Map(
    PostgresPrisma.dmmf.datamodel.models.map((model) => [model.name, model]),
  );
  const ordered: Array<(typeof PostgresPrisma.dmmf.datamodel.models)[number]> = [];

  while (pending.size > 0) {
    const ready = [...pending.values()].filter((model) =>
      dependencies(model).every((dependency) => !pending.has(dependency)),
    );
    if (ready.length === 0) {
      throw new Error("Could not determine a safe foreign-key order for the data transfer.");
    }
    for (const model of ready) {
      ordered.push(model);
      pending.delete(model.name);
    }
  }

  return ordered;
}

function convertValue(value: unknown, type: string): unknown {
  if (value == null) return null;
  if (type === "Boolean") return Boolean(value);
  if (type === "DateTime") {
    const date = value instanceof Date ? value : new Date(String(value));
    if (Number.isNaN(date.getTime())) {
      throw new Error(`Invalid date value found in local SQLite data: ${String(value)}`);
    }
    return date;
  }
  if (type === "Json" && typeof value === "string") return JSON.parse(value);
  return value;
}

async function main() {
  if (!configuredSourceUrl.startsWith("file:")) {
    throw new Error("LOCAL_SQLITE_DATABASE_URL must be a SQLite file URL.");
  }
  const separatorIndex = configuredSourceUrl.indexOf("?");
  const configuredPath = configuredSourceUrl.slice(
    "file:".length,
    separatorIndex === -1 ? undefined : separatorIndex,
  );
  const query = separatorIndex === -1 ? "" : configuredSourceUrl.slice(separatorIndex);
  const localPath = path.resolve(decodeURIComponent(configuredPath));
  if (!existsSync(localPath)) {
    throw new Error(`Local SQLite database was not found at ${localPath}.`);
  }
  const sourceUrl = `file:${localPath.replaceAll("\\", "/")}${query}`;

  verifySchemaParity();

  const sqlite = new SqliteClient({ datasources: { db: { url: sourceUrl } } });
  const postgres = new PostgresClient();

  try {
    await sqlite.$connect();
    const models = orderedModels();
    const sourceRows = new Map<string, DataRow[]>();

    for (const model of models) {
      const tableName = model.dbName ?? model.name;
      const rows = await sqlite.$queryRawUnsafe<DataRow[]>(
        `SELECT * FROM ${quoteIdentifier(tableName)}`,
      );
      sourceRows.set(model.name, rows);
    }

    const totalRows = [...sourceRows.values()].reduce((total, rows) => total + rows.length, 0);
    console.info(
      `${dryRun ? "Dry run: found" : "Found"} ${totalRows} local rows across ${models.length} tables.`,
    );
    if (dryRun) return;

    await postgres.$connect();
    for (const model of models) {
      const tableName = model.dbName ?? model.name;
      const result = await postgres.$queryRawUnsafe<Array<{ count: bigint }>>(
        `SELECT COUNT(*) AS count FROM ${quoteIdentifier(tableName)}`,
      );
      if (result[0]?.count !== BigInt(0)) {
        throw new Error(
          `Supabase table ${tableName} is not empty. Transfer stopped without importing data.`,
        );
      }
    }

    await postgres.$transaction(async (tx) => {
      for (const model of models) {
        const fields = scalarFields(model);
        const rows = sourceRows.get(model.name)!;
        const tableName = quoteIdentifier(model.dbName ?? model.name);
        const columns = fields.map((field) => quoteIdentifier(field.dbName ?? field.name));

        for (let offset = 0; offset < rows.length; offset += 100) {
          const batch = rows.slice(offset, offset + 100);
          if (batch.length === 0) continue;

          const values: unknown[] = [];
          const tuples = batch.map((row) => {
            const placeholders = fields.map((field) => {
              values.push(convertValue(row[field.dbName ?? field.name], field.type));
              return `$${values.length}`;
            });
            return `(${placeholders.join(", ")})`;
          });

          await tx.$executeRawUnsafe(
            `INSERT INTO ${tableName} (${columns.join(", ")}) VALUES ${tuples.join(", ")}`,
            ...values,
          );
        }
      }
    });

    for (const model of models) {
      const tableName = model.dbName ?? model.name;
      const result = await postgres.$queryRawUnsafe<Array<{ count: bigint }>>(
        `SELECT COUNT(*) AS count FROM ${quoteIdentifier(tableName)}`,
      );
      const importedCount = Number(result[0]?.count ?? BigInt(0));
      const expectedCount = sourceRows.get(model.name)!.length;
      if (importedCount !== expectedCount) {
        throw new Error(
          `Row-count verification failed for ${tableName}: expected ${expectedCount}, found ${importedCount}.`,
        );
      }
    }

    console.info(`Successfully transferred ${totalRows} rows to Supabase.`);
  } finally {
    await Promise.all([sqlite.$disconnect(), postgres.$disconnect()]);
  }
}

main().catch((error: unknown) => {
  console.error("[db:transfer:local]", error);
  process.exitCode = 1;
});
