import { Bookmarks } from "../collections/bookmarks/collection";
import { createTable, dropTable } from "./meta/utils";

/**
 * This replaces the old approach of storing bookmarked posts in Users.bookmarkedPostsMetadata.
 */
export const up = async ({db}: MigrationContext) => {
  await createTable(db, Bookmarks);
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, Bookmarks);
}
