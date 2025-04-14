import ForumEvents from "../collections/forumEvents/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, ForumEvents, "isGlobal");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, ForumEvents, "isGlobal");
}
