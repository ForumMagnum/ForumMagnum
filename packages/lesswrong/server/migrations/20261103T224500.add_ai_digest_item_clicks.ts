import AiDigestItemClicks from "../collections/aiDigestItemClicks/collection";
import { queueMigrationTask } from "./meta/migrationTaskQueue";
import { createTable, dropTable, updateCustomIndexes } from "./meta/utils";

export const up = async ({ db, dbOutsideTransaction }: MigrationContext) => {
  await createTable(db, AiDigestItemClicks);
  queueMigrationTask(() => updateCustomIndexes(dbOutsideTransaction));
};

export const down = async ({ db }: MigrationContext) => {
  await db.none(`DROP INDEX IF EXISTS "idx_Users_subscribed_to_aiDigest";`);
  await dropTable(db, AiDigestItemClicks);
};
