import CommentEmbeddings from "@/lib/collections/commentEmbeddings/collection"
import { createTable, dropTable, updateIndexes } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await createTable(db, CommentEmbeddings);
  await updateIndexes(CommentEmbeddings);
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, CommentEmbeddings);
}
