import { getSqlClientOrThrow } from "../sql/sqlClient";
import { registerMigration } from "./migrationUtils";
import type { ITask } from "pg-promise";

export const undraftPublicPostRevisions = async (db: SqlClient | ITask<{}>) => {
  await db.none(`
    UPDATE "Revisions" AS r
    SET
      "draft" = FALSE,
      "version" = CASE WHEN LEFT("version", 1) = '0' THEN '1.0.0' ELSE "version" END
    FROM "Posts" AS p
    WHERE
      p."contents_latest" = r."_id" AND
      p."draft" IS NOT TRUE AND
      r."draft" IS TRUE
  `);
  await db.none(`
    UPDATE "Revisions" AS r
    SET "collectionName" = 'Posts'
    FROM "Posts" AS p
    WHERE p."contents_latest" = r."_id"
  `);
}

export default registerMigration({
  name: "undraftPublicPostRevisions",
  dateWritten: "2024-08-14",
  idempotent: true,
  action: async () => {
    const db = getSqlClientOrThrow();
    await undraftPublicPostRevisions(db);
  },
});
