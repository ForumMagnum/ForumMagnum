import { queueMigrationTask } from "./meta/migrationTaskQueue";
import { updateCustomIndexes } from "./meta/utils";

export const up = async ({dbOutsideTransaction}: MigrationContext) => {
  queueMigrationTask(() => updateCustomIndexes(dbOutsideTransaction));
}

export const down = async ({db}: MigrationContext) => {
  await db.none(`DROP INDEX IF EXISTS "ultraFeedEvents_loggedOut_session_idx";`);
}
