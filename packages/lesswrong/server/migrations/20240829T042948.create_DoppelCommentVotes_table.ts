export const acceptsSchemaHash = "2f2359e68b43ebe4eadabc0dbbe8a9e0";

import DoppelCommentVotes from "@/lib/collections/doppelCommentVotes/collection"
import { createTable, dropTable } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await createTable(db, DoppelCommentVotes)
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, DoppelCommentVotes)
}
