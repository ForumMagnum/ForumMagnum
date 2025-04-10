import { getDefaultVotingSystem } from "../../lib/collections/posts/newSchema";
import { getSqlClientOrThrow } from "../../server/sql/sqlClient";
import { registerMigration } from "./migrationUtils";

export default registerMigration({
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
