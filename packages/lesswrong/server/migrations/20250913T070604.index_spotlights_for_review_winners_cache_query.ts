import { updateCustomIndexes } from "./meta/utils";import { queueBackgroundTask } from "./meta/backgroundTaskQueue";
;

export const up = async ({dbOutsideTransaction}: MigrationContext) => {
  queueBackgroundTask(() => updateCustomIndexes(dbOutsideTransaction));
}

export const down = async ({db}: MigrationContext) => {
  await db.none(`DROP INDEX IF EXISTS "idx_Spotlights_documentId_createdAt";`);
}
