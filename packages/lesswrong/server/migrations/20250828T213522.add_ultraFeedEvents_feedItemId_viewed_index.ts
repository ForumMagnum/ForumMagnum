import { updateCustomIndexes } from "./meta/utils";import { queueBackgroundTask } from "./meta/backgroundTaskQueue";
;

export const up = async ({ dbOutsideTransaction }: MigrationContext) => {
  queueBackgroundTask(() => updateCustomIndexes(dbOutsideTransaction));
}

export const down = async ({ db }: MigrationContext) => {
  await db.none(`DROP INDEX IF EXISTS "ultraFeedEvents_userId_feedItemId_viewed_idx";`);
}
