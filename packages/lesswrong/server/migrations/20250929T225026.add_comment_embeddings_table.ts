import CommentEmbeddings from "../collections/commentEmbeddings/collection";
import { createTable } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await createTable(db, CommentEmbeddings);
}

export const down = async ({db}: MigrationContext) => {
}
