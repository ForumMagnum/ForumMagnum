import PostComparisons from "../../lib/collections/postComparisons/collection";
import { createTable, dropTable } from "./meta/utils";

export const acceptsSchemaHash = "73fa0eec120577af8dfa6a51cf57aa9c";
export const up = async ({db}: MigrationContext) => {
  if (PostComparisons.isPostgres()) {
    await createTable(db, PostComparisons);
  }
}

export const down = async ({db}: MigrationContext) => {
  if (PostComparisons.isPostgres()) {
    await dropTable(db, PostComparisons);
  }
}
