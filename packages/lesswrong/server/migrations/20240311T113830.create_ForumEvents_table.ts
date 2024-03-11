import ForumEvents from "../../lib/collections/forumEvents/collection";
import { createTable, dropTable } from "./meta/utils";

export const acceptsSchemaHash = "7d00e24659b5765533db00034c6636ae";

export const up = async ({db}: MigrationContext) => {
  await createTable(db, ForumEvents);
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, ForumEvents);
}
