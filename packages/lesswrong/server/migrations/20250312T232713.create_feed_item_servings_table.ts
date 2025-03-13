import { FeedItemServings } from "../collections/feedItemServings/collection";
import { createTable, dropTable, updateIndexes } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await createTable(db, FeedItemServings);
  await updateIndexes(FeedItemServings);
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, FeedItemServings);
}
