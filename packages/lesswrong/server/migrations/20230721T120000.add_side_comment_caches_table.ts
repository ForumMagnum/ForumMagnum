import { createTable, dropTable } from "./meta/utils";
import { SideCommentsCache } from "../../lib/collections/sideCommentsCache/collection";

export const acceptsSchemaHash = "5a1af1017444e973f8389a78b08a0922";

export const up = async ({db}: MigrationContext) => {
  if (SideCommentsCache.isPostgres()) {
    await createTable(db, SideCommentsCache, true);
  }
}

export const down = async ({db}: MigrationContext) => {
}
