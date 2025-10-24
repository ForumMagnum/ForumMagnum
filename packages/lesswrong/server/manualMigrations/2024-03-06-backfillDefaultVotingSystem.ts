import { getDefaultVotingSystem } from "@/lib/collections/posts/helpers";
import { getSqlClientOrThrow } from "../../server/sql/sqlClient";
import { registerMigration } from "./migrationUtils";
import { forumTypeSetting } from "@/lib/forumTypeUtils";

export default registerMigration({
  name: 'backfillDefaultVotingSystem',
  dateWritten: '2024-03-06',
  idempotent: true,
  action: async () => {
    const forumType = forumTypeSetting.get();
    const db = getSqlClientOrThrow();
    await db.none(`
      UPDATE "Posts"
      SET "votingSystem" = $1
      WHERE "votingSystem" IS NULL
    `, [getDefaultVotingSystem(forumType)]);
  }
});
