import Pingbacks from "../collections/pingbacks/collection";
import Comments from "../collections/comments/collection";
import { addField, createTable, dropField, dropTable, updateIndexes } from "./meta/utils";

// Run the backfillPostPingbacks manual migration after this one; until it
// finishes, posts list only the pingbacks from posts edited since this ran.
export const up = async ({db}: MigrationContext) => {
  await createTable(db, Pingbacks);
  await addField(db, Comments, "pingbackId");
  await updateIndexes(Comments);
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Comments, "pingbackId");
  await dropTable(db, Pingbacks);
}
