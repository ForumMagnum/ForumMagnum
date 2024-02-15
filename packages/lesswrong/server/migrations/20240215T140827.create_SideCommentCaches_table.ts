import { createTable, addRemovedField, dropRemovedField, dropTable } from "./meta/utils";
import { JsonType } from "../../lib/sql/Type";
import SideCommentCaches from "../../lib/collections/sideCommentCaches/collection";
import Posts from "../../lib/collections/posts/collection";

export const acceptsSchemaHash = "5cb229f5d6b5603881b0eb0873896dd8";

export const up = async ({db}: MigrationContext) => {
  await createTable(db, SideCommentCaches);
  await dropRemovedField(db, Posts, "sideCommentsCache");
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, SideCommentCaches);
  await addRemovedField(db, Posts, "sideCommentsCache", new JsonType());
}
