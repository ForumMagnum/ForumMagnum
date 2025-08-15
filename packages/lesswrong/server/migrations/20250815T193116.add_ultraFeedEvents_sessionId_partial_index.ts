import { updateCustomIndexes } from "./meta/utils";

export const up = async ({dbOutsideTransaction}: MigrationContext) => {
  await updateCustomIndexes(dbOutsideTransaction);
}

export const down = async ({ db }: MigrationContext) => {
  await db.none(`DROP INDEX IF EXISTS "ultraFeedEvents_sessionId_partial_idx";`);
}
