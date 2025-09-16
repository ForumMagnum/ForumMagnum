import { backgroundTask } from "../utils/backgroundTask";
import { updateCustomIndexes } from "./meta/utils";

export const up = async ({dbOutsideTransaction}: MigrationContext) => {
  backgroundTask(updateCustomIndexes(dbOutsideTransaction));
}

export const down = async ({db}: MigrationContext) => {
  await db.none(`DROP INDEX IF EXISTS "ultraFeedEvents_loggedOut_session_idx";`);
}
