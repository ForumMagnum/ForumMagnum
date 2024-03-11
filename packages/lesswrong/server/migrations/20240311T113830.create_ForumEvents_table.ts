import ForumEvents from "../../lib/collections/forumEvents/collection";
import { createTable, dropTable } from "./meta/utils";

export const acceptsSchemaHash = "5128a9d63bc9b8e67348df15c918b0d8";

export const up = async ({db}: MigrationContext) => {
  await createTable(db, ForumEvents);
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, ForumEvents);
}
