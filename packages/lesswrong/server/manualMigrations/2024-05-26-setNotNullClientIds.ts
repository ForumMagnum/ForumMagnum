import { getSqlClientOrThrow } from "../sql/sqlClient";
import { registerMigration } from "./migrationUtils";

const idxName = 'idx_idx_ClientIds_clientId_unique'

registerMigration({
  name: "setNotNullClientIds",
  dateWritten: "2024-05-06",
  idempotent: true,
  action: async () => {
    const sql = getSqlClientOrThrow()

    const alreadyNotNull = await sql.oneOrNone(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'ClientIds' AND column_name = 'clientId' AND is_nullable = 'NO'
    `) !== null;

    if (!alreadyNotNull) {
      // Add a check constraint without validating it to avoid a long lock
      await sql.none(`ALTER TABLE "ClientIds"
      ADD CONSTRAINT "ClientIds_clientId_not_null"
      CHECK ("clientId" IS NOT NULL) NOT VALID;`);

      // Validate the constraint in a separate step, which allows concurrent reads/writes
      await sql.none(`ALTER TABLE "ClientIds" VALIDATE CONSTRAINT "ClientIds_clientId_not_null";`)

      // Replace the generic constraint with a NOT NULL (which will now not lock the table because it will use the existing constraint)
      await sql.none(`ALTER TABLE "ClientIds" ALTER COLUMN "clientId" SET NOT NULL;`)
      await sql.none(`ALTER TABLE "ClientIds" DROP CONSTRAINT "ClientIds_clientId_not_null";`)
    }

    // Update index
    const indexQuery = await sql.oneOrNone(`
      SELECT indexdef
      FROM pg_indexes
      WHERE schemaname = 'public' AND tablename = 'ClientIds' AND indexname = '${idxName}'
    `)
    const indexIsCorrect = indexQuery?.indexdef === `CREATE UNIQUE INDEX "${idxName}" ON public."ClientIds" USING btree ("clientId")`;

    if (!indexIsCorrect) {
      const tempIndexName = `${idxName}_temp`;
      await sql.none(`
        CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "${tempIndexName}"
        ON "ClientIds" ("clientId");
      `);

      await sql.none(`DROP INDEX CONCURRENTLY IF EXISTS public."${idxName}";`);
      await sql.none(`ALTER INDEX "${tempIndexName}" RENAME TO "${idxName}";`);
    }
  },
});
