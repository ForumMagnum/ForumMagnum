import CommentEmbeddings from "../collections/commentEmbeddings/collection";
import { queueMigrationTask } from "./meta/migrationTaskQueue";
import { createTable, updateCustomIndexes } from "./meta/utils"

export const up = async ({db, dbOutsideTransaction}: MigrationContext) => {
  await createTable(db, CommentEmbeddings);
  queueMigrationTask(() => updateCustomIndexes(dbOutsideTransaction));
}

export const down = async ({db}: MigrationContext) => {
}
