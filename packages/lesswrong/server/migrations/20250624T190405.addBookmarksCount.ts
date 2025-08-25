import Users from "../collections/users/collection";
import BookmarksRepo from "../repos/BookmarksRepo";
import { backgroundTask } from "../utils/backgroundTask";
import { addField } from "./meta/utils";

export const up = async ({db, dbOutsideTransaction}: MigrationContext) => {
  await addField(db, Users, "bookmarksCount");
  backgroundTask(new BookmarksRepo(dbOutsideTransaction).updateBookmarkCountForAllUsers());
}

export const down = async ({db}: MigrationContext) => {
}
