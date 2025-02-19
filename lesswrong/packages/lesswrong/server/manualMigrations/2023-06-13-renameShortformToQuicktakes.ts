import { registerMigration } from "./migrationUtils";
import { getSqlClientOrThrow } from '../../server/sql/sqlClient';

registerMigration({
  name: "renameShortformToQuicktakes",
  dateWritten: "2023-06-13",
  idempotent: true,
  action: async () => {
    await getSqlClientOrThrow().none(`
      UPDATE "Posts"
      SET title = (
        SELECT "displayName"
        FROM "Users"
        WHERE "Posts"."userId" = "Users"."_id"
      ) || '''s Quick takes'
      WHERE "shortform" IS TRUE
    `);
  }
});
