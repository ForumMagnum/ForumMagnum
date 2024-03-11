import ForumEvents from "../../lib/collections/forumEvents/collection";
import { createTable, dropTable } from "./meta/utils";

export const acceptsSchemaHash = "a5d908ad079b15fbcbc381bbc31e2f03";

export const up = async ({db}: MigrationContext) => {
  await createTable(db, ForumEvents);
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, ForumEvents);
}
