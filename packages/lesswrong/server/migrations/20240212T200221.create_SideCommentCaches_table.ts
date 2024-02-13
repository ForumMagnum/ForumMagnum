import { createTable, dropRemovedField, dropTable } from "./meta/utils";
import { addRemovedField } from "./meta/utils";
import { JsonType } from "../../lib/sql/Type";
import SideCommentCaches from "../../lib/collections/sideCommentCaches/collection";
import Posts from "../../lib/collections/posts/collection";

export const acceptsSchemaHash = "c773458c4b6c3ce556c4a7001e86628e";

export const up = async ({db}: MigrationContext) => {
  await createTable(db, SideCommentCaches);
  await dropRemovedField(db, Posts, "sideCommentsCache");
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, SideCommentCaches);
  await addRemovedField(db, Posts, "sideCommentsCache", new JsonType());
}
