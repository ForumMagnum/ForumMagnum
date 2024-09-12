export const acceptsSchemaHash = "218b88dd1bf697da99eb6b8823ff6931";

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
