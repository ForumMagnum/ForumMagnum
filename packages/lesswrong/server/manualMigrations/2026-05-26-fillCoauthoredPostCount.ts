import { postStatuses } from "@/lib/collections/posts/constants";
import { getSqlClientOrThrow } from "../sql/sqlClient";
import { registerMigration } from "./migrationUtils";

export default registerMigration({
  name: "fillCoauthoredPostCount",
  dateWritten: "2026-05-26",
  idempotent: true,
  action: async () => {
    // eslint-disable-next-line no-console
    console.log("Filling coauthored post count...");
    await getSqlClientOrThrow().none(`
      UPDATE "Users" u
      SET "coauthoredPostCount" = COALESCE(counts.count, 0)
      FROM (
        SELECT
          u2."_id" AS "userId",
          COUNT(p."_id") AS count
        FROM "Users" u2
        LEFT JOIN "Posts" p
          ON p."coauthorUserIds" @> ARRAY[u2."_id"]::TEXT[]
          AND p."draft" IS NOT TRUE
          AND p."rejected" IS NOT TRUE
          AND p."status" = $(approvedStatus)
        GROUP BY u2."_id"
      ) counts
      WHERE u."_id" = counts."userId"
    `, {
      approvedStatus: postStatuses.STATUS_APPROVED,
    });
    // eslint-disable-next-line no-console
    console.log("Done");
  },
});
