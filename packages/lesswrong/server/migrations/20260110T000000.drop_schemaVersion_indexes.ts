import { allSchemas } from "@/lib/schema/allSchemas";

const schemaVersionIndexNames = Object.entries(allSchemas)
  .filter(([_, schema]) => "schemaVersion" in schema)
  .map(([collectionName]) => `idx_${collectionName}_schemaVersion`);

export const up = async ({ db }: MigrationContext) => {
  for (const indexName of schemaVersionIndexNames) {
    await db.none(`DROP INDEX IF EXISTS "${indexName}";`);
  }
};

export const down = async ({ db }: MigrationContext) => {
  // Intentionally left blank; we don't want to recreate these indexes.
};

