export const acceptsSchemaHash = "4784387869832318e26709e0e54682c8";

import { createTable, dropTable, updateIndexes } from "./meta/utils";
import DoppelComments from "@/lib/collections/doppelComments/collection";
import DoppelCommentVotes from "@/lib/collections/doppelCommentVotes/collection";

export const up = async ({db}: MigrationContext) => {
  await createTable(db, DoppelComments);
  await createTable(db, DoppelCommentVotes);
  await updateIndexes(DoppelComments);
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, DoppelComments);
  await dropTable(db, DoppelCommentVotes);
}
