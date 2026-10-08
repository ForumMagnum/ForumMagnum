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
      -- If the revision got its own RevisionOriginalContents row concurrently
      -- (eg from updateOriginalContentsForRevision), that row is newer than the
      -- inline contents we copied, so don't repoint the revision (the row we
      -- just inserted is then left unreferenced, which is harmless)
      AND r."originalContentsId" IS NULL
  `, [revisionIds, originalContentsIds], (result) => result.rowCount);
}

/**
 * Bring existing RevisionOriginalContents rows up to date with the inline
 * `Revisions.originalContents` column, where they differ. Code that predates
 * RevisionOriginalContents (an older server during a deploy, or after a
 * rollback) only writes the inline column, which can leave the row stale.
 * Rows created after `startedAt` were written alongside the inline column
 * (either by the backfill above or by current code), so they're skipped to
 * avoid comparing every revision's contents twice.
 */
async function reconcileBatch(db: SqlClient, revisionIds: string[], startedAt: Date): Promise<number> {
  return await db.result(`
    UPDATE "RevisionOriginalContents" roc
    SET "originalContents" = r."originalContents"
    FROM "Revisions" r
    WHERE r._id = ANY($1::VARCHAR(27)[])
      AND roc._id = r."originalContentsId"
      AND roc."createdAt" < $2
      AND r."originalContents" IS NOT NULL
      AND roc."originalContents" IS DISTINCT FROM r."originalContents"
  `, [revisionIds, startedAt], (result) => result.rowCount);
}

/**
 * Copy the inline `Revisions.originalContents` column into RevisionOriginalContents
 * rows, creating rows for revisions that don't have one and updating rows which
 * have gone stale (see `reconcileBatch`). Rerun this before the inline column
 * stops being written, after the last time any code that predates
 * RevisionOriginalContents ran.
 */
export default registerMigration({
  name: "backfillRevisionOriginalContents",
  dateWritten: "2026-04-24",
  idempotent: true,
  action: async () => {
    const db = getSqlClientOrThrow();
    // Use the database's clock, since it's what sets RevisionOriginalContents.createdAt
    const { startedAt } = await db.one<{ startedAt: Date }>(`SELECT CURRENT_TIMESTAMP AS "startedAt"`);
    let createdTotal = 0;
    let reconciledTotal = 0;
    // Paginate by _id rather than rescanning from the start of the table each
    // batch, which would make the whole run quadratic in the table size
    let lastId = "";

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const rows = await db.any<{ _id: string }>(`
        SELECT _id
        FROM "Revisions"
        WHERE _id > $1
          AND "originalContents" IS NOT NULL
        ORDER BY _id
        LIMIT $2
      `, [lastId, batchSize]);

      if (rows.length === 0) {
        break;
      }
      lastId = rows[rows.length - 1]._id;

      const revisionIds = rows.map((row) => row._id);
      const createdCount = await backfillBatch(db, revisionIds);
      const reconciledCount = await reconcileBatch(db, revisionIds, startedAt);
      createdTotal += createdCount;
      reconciledTotal += reconciledCount;
      // eslint-disable-next-line no-console
      console.log(`backfillRevisionOriginalContents: created ${createdCount} and updated ${reconciledCount} rows (${createdTotal} created and ${reconciledTotal} updated so far)`);
    }

    // eslint-disable-next-line no-console
    console.log(`backfillRevisionOriginalContents: done, ${createdTotal} rows created and ${reconciledTotal} stale rows updated`);
  },
});
