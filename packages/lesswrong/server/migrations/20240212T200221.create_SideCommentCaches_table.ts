import { createTable, dropTable } from "./meta/utils";
import SideCommentCaches from "../../lib/collections/sideCommentCaches/collection";

export const acceptsSchemaHash = "7f47659e26cb4ca81a15fd63855111db";

export const up = async ({db}: MigrationContext) => {
  await createTable(db, SideCommentCaches);
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, SideCommentCaches);
}
