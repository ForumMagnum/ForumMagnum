import { createTable, dropTable } from "./meta/utils";
import { SideCommentsCache } from "../../lib/collections/sideCommentsCache/collection";

export const acceptsSchemaHash = "a4eadc6b38a6c85ba03e0e6d1d7abad1";

export const up = async ({db}: MigrationContext) => {
  if (SideCommentsCache.isPostgres()) {
    await createTable(db, SideCommentsCache, true);
  }
}

export const down = async ({db}: MigrationContext) => {
}
