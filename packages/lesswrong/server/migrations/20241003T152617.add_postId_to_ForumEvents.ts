import ForumEvents from "@/lib/collections/forumEvents/collection";
import { addField, dropField } from "./meta/utils";
import { Comments } from "@/lib/collections/comments";

export const acceptsSchemaHash = "52988b5e9ef30fd8216855ec92c328c3";

export const up = async ({db}: MigrationContext) => {
  await addField(db, ForumEvents, "postId");
  await addField(db, Comments, "forumEventId");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, ForumEvents, "postId");
  await dropField(db, Comments, "forumEventId");
}
