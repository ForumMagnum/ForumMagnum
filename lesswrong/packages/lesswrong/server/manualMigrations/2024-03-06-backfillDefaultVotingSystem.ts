import { getDefaultVotingSystem } from "../../lib/collections/posts/schema";
import { getSqlClientOrThrow } from "../../server/sql/sqlClient";
import { registerMigration } from "./migrationUtils";

registerMigration({
  name: 'backfillDefaultVotingSystem',
  dateWritten: '2024-03-06',
  idempotent: true,
  action: async () => {
    const db = getSqlClientOrThrow();
    await db.none(`
      UPDATE "Posts"
      SET "votingSystem" = $1
      WHERE "votingSystem" IS NULL
    `, [getDefaultVotingSystem()]);
  }
});
