import { createTable, addRemovedField, dropRemovedField, dropTable } from "./meta/utils";
import { JsonType } from "@/server/sql/Type";
import SideCommentCaches from "../../lib/collections/sideCommentCaches/collection";
import Posts from "../../lib/collections/posts/collection";

export const acceptsSchemaHash = "ca5281426ba6c737b2621d88156ea1c6";

export const up = async ({db}: MigrationContext) => {
  await createTable(db, SideCommentCaches);
  await dropRemovedField(db, Posts, "sideCommentsCache");
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, SideCommentCaches);
  await addRemovedField(db, Posts, "sideCommentsCache", new JsonType());
}
