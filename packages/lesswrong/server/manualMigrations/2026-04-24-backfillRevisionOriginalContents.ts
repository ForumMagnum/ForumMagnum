import { randomId } from "@/lib/random";
import { getSqlClientOrThrow } from "@/server/sql/sqlClient";
import { registerMigration } from "./migrationUtils";

const batchSize = 500;

async function backfillBatch(db: SqlClient, revisionIds: string[]): Promise<number> {
  const originalContentsIds = revisionIds.map(() => randomId());

  return await db.result(`
    WITH mapping AS (
      SELECT *
      FROM unnest($1::VARCHAR(27)[], $2::VARCHAR(27)[]) AS m("revisionId", "originalContentsId")
    ),
    inserted AS (
      INSERT INTO "RevisionOriginalContents" (_id, "createdAt", "originalContents")
      SELECT
        m."originalContentsId",
        CURRENT_TIMESTAMP,
        r."originalContents"
      FROM mapping m
      JOIN "Revisions" r ON r._id = m."revisionId"
      WHERE r."originalContentsId" IS NULL
        AND r."originalContents" IS NOT NULL
      RETURNING _id
    )
    UPDATE "Revisions" r
    SET "originalContentsId" = m."originalContentsId"
    FROM mapping m
    JOIN inserted i ON i._id = m."originalContentsId"
    WHERE r._id = m."revisionId"
  `, [revisionIds, originalContentsIds], (result) => result.rowCount);
}

export default registerMigration({
  name: "backfillRevisionOriginalContents",
  dateWritten: "2026-04-24",
  idempotent: true,
  action: async () => {
    const db = getSqlClientOrThrow();
    let batchTotal = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const rows = await db.any<{ _id: string }>(`
        SELECT _id
        FROM "Revisions"
        WHERE "originalContentsId" IS NULL
          AND "originalContents" IS NOT NULL
        ORDER BY _id
        LIMIT $1
      `, [batchSize]);

      if (rows.length === 0) {
        break;
      }

      const updatedCount = await backfillBatch(db, rows.map((row) => row._id));
      batchTotal += updatedCount;
      // eslint-disable-next-line no-console
      console.log(`backfillRevisionOriginalContents: migrated ${updatedCount} rows (${batchTotal} total so far)`);
    }

    // eslint-disable-next-line no-console
    console.log(`backfillRevisionOriginalContents: done, ${batchTotal} revisions updated`);
  },
});
