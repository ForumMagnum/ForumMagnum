import { createTable, updateIndexes } from "./meta/utils"
import CommentAwards from "../collections/commentAwards/collection";

export const up = async ({db}: MigrationContext) => {
  await createTable(db, CommentAwards);
  await updateIndexes(CommentAwards);
}

export const down = async ({db}: MigrationContext) => {
  await db.none(`DROP TABLE "CommentAwards"`);
}
