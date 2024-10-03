import ForumEvents from "@/lib/collections/forumEvents/collection";
import { addField, dropField } from "./meta/utils";

export const acceptsSchemaHash = "906a49c8f757615b2e527a1f3250c93a";

export const up = async ({db}: MigrationContext) => {
  await addField(db, ForumEvents, "postId");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, ForumEvents, "postId");
}
