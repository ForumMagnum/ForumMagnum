import Pingbacks from "../collections/pingbacks/collection";
import { createTable, dropTable } from "./meta/utils";

// Run the backfillPostPingbacks manual migration after this one; until it
// finishes, posts list only the pingbacks from posts edited since this ran.
export const up = async ({db}: MigrationContext) => {
  await createTable(db, Pingbacks);
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, Pingbacks);
}
