import ForumEvents from "../collections/forumEvents/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, ForumEvents, "commentId");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, ForumEvents, "commentId");
}
