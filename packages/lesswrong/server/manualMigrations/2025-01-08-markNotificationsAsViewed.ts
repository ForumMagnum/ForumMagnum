import { registerMigration } from "./migrationUtils";
import { getSqlClientOrThrow } from "../sql/sqlClient";

registerMigration({
  name: "markNotificationsAsViewed",
  dateWritten: "2025-01-08",
  idempotent: true,
  action: async () => {
    await getSqlClientOrThrow().none(`
      UPDATE "Notifications" AS n
      SET "viewed" = TRUE
      FROM "Users" AS u
      WHERE
        u."_id" = n."userId"
        AND u."lastNotificationsCheck" IS NOT NULL
        AND u."lastNotificationsCheck" > n."createdAt"
        AND n."type" <> 'newMessage'
    `);
  },
});
