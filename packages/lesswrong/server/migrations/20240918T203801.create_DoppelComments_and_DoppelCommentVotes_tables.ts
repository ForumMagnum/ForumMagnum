export const acceptsSchemaHash = "0af380ba7653c0b38ee38230eee77fb9";

import { createTable, dropTable, updateIndexes } from "./meta/utils";
import DoppelComments from "@/lib/collections/doppelComments/collection";
import DoppelCommentVotes from "@/lib/collections/doppelCommentVotes/collection";

export const up = async ({db}: MigrationContext) => {
  await createTable(db, DoppelComments);
  await createTable(db, DoppelCommentVotes);
  await updateIndexes(DoppelComments);
  await updateIndexes(DoppelCommentVotes);
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, DoppelComments);
  await dropTable(db, DoppelCommentVotes);
}
