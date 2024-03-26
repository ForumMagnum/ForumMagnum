import ForumEvents from "../../lib/collections/forumEvents/collection";
import { createTable, dropTable } from "./meta/utils";

export const acceptsSchemaHash = "ec6d12fa05425118431d110f2e216b80";

export const up = async ({db}: MigrationContext) => {
  await createTable(db, ForumEvents);
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, ForumEvents);
}
