import ForumEvents from "@/lib/collections/forumEvents/collection";
import { addField, dropField, updateIndexes } from "./meta/utils";
import { Comments } from "@/lib/collections/comments";

export const acceptsSchemaHash = "845ab447f6646ba141b9aee88cc3a619";

export const up = async ({db}: MigrationContext) => {
  await addField(db, ForumEvents, "postId");
  await addField(db, Comments, "forumEventId");
  await updateIndexes(Comments);
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, ForumEvents, "postId");
  await dropField(db, Comments, "forumEventId");
}
