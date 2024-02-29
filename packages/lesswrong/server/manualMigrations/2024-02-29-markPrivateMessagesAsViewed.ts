import { getSqlClientOrThrow } from "../../lib/sql/sqlClient";
import { registerMigration } from "./migrationUtils";

registerMigration({
  name: "markPrivateMessagesAsViewed",
  dateWritten: "2024-02-29",
  idempotent: true,
  action: async () => {
    await getSqlClientOrThrow().none(`
      UPDATE "Notifications" AS n
      SET "viewed" = TRUE
      FROM "Users" u
      WHERE
        u."_id" = n."userId" AND
        n."type" = 'newMessage' AND
        COALESCE(u."lastNotificationsCheck", '2000-01-01'::TIMESTAMP) > n."createdAt"
    `);
  },
});
