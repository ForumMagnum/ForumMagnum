import { getSqlClientOrThrow } from "../../server/sql/sqlClient";
import { registerMigration } from "./migrationUtils";

export default registerMigration({
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
        COALESCE(u."lastNotificationsCheck", TO_TIMESTAMP(0)) > n."createdAt"
    `);
  },
});
